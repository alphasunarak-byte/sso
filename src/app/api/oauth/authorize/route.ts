import { NextRequest, NextResponse } from 'next/server';
import { OAuthIdpService } from '@/server/services/oauth/oauth-idp.service';

export async function POST(request: NextRequest) {
  try {
    const rawText = await request.text();
    let body: any = {};
    try {
      body = JSON.parse(rawText);
    } catch {
      const params = new URLSearchParams(rawText);
      body = Object.fromEntries(params.entries());
    }

    const { clientId, redirectUri, scope, state, action } = body;

    const client = OAuthIdpService.getClient(clientId);
    if (!client) {
      return NextResponse.json({ error: 'invalid_client', error_description: 'Client ไม่ถูกต้อง' }, { status: 400 });
    }

    if (!OAuthIdpService.isRedirectUriAllowed(client, redirectUri)) {
      return NextResponse.json({ error: 'invalid_redirect_uri', error_description: 'Redirect URI ไม่ได้รับอนุญาต' }, { status: 400 });
    }

    // กรณีผู้ใช้กดยกเลิก
    if (action === 'deny') {
      const targetUrl = new URL(redirectUri);
      targetUrl.searchParams.set('error', 'access_denied');
      targetUrl.searchParams.set('error_description', 'ผู้ใช้งานปฏิเสธการอนุญาตเข้าถึงข้อมูล');
      if (state) targetUrl.searchParams.set('state', state);
      return NextResponse.json({ redirectUrl: targetUrl.toString() });
    }

    // ตรวจสอบ Session ผู้ใช้ (รองรับทั้ง cookie 'session' และ 'nhh_session')
    const sessionCookie = request.cookies.get('session')?.value || request.cookies.get('nhh_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'unauthorized', error_description: 'ผู้ใช้ยังไม่ได้เข้าสู่ระบบ' }, { status: 401 });
    }

    let user: any;
    const decodedCookie = (() => {
      try {
        return decodeURIComponent(sessionCookie);
      } catch {
        return sessionCookie;
      }
    })();

    try {
      user = JSON.parse(decodedCookie);
    } catch {
      const { verifySessionToken } = await import('@/lib/session');
      const verified = await verifySessionToken(sessionCookie);
      if (verified) {
        user = verified;
      } else {
        return NextResponse.json({ error: 'invalid_session', error_description: 'เซสชันไม่ถูกต้องหรือหมดอายุ' }, { status: 401 });
      }
    }

    // สร้าง Authorization Code
    const code = OAuthIdpService.createAuthorizationCode({
      clientId,
      redirectUri,
      user,
      scope,
    });

    const targetUrl = new URL(redirectUri);
    targetUrl.searchParams.set('code', code);
    if (state) targetUrl.searchParams.set('state', state);

    return NextResponse.json({ redirectUrl: targetUrl.toString() });
  } catch (err: any) {
    console.error('Authorize API Error:', err);
    return NextResponse.json({ error: 'server_error', error_description: err.message }, { status: 500 });
  }
}
