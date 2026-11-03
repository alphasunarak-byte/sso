import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken } from '@/lib/session';

// รหัสหน่วยบริการเป้าหมายที่อนุญาตให้เข้าใช้งานระบบหลังบ้าน
const AUTHORIZED_HOSPITAL_CODE = '11018'; // โรงพยาบาลหนองหาน

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  const baseUrl = new URL('/', request.url).origin;

  // 1. ตรวจสอบ Error ที่ส่งกลับมาจาก IdP
  if (errorParam) {
    console.error('[OAuth Callback] Authorization error:', errorParam);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorParam)}`, baseUrl));
  }

  // 2. ตรวจสอบ CSRF State ให้ตรงกับ Cookie ที่บันทึกไว้ในขั้นตอน Login
  const savedState = request.cookies.get('oauth_state')?.value;
  if (!code || !state || !savedState || state !== savedState) {
    console.warn('[OAuth Callback] CSRF State mismatch or expired code');
    return NextResponse.redirect(new URL('/login?error=invalid_state', baseUrl));
  }

  try {
    const tokenUrl = process.env.OAUTH_TOKEN_URL || 'http://localhost:3030/api/oauth/token';
    const clientId = process.env.OAUTH_CLIENT_ID || 'super-app-nhh-11018';
    const clientSecret = process.env.OAUTH_CLIENT_SECRET || 'secret_nhh_superapp_2026';
    const redirectUri = process.env.OAUTH_REDIRECT_URI || 'http://localhost:3030/api/auth/callback';
    const userInfoUrl = process.env.OAUTH_USERINFO_URL || 'http://localhost:3030/api/oauth/userinfo';

    // 3. แลกเปลี่ยน Authorization Code เป็น Access Token (Server-to-Server)
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error('[OAuth Callback] Token exchange failed:', tokenResponse.status, errBody);
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', baseUrl));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.redirect(new URL('/login?error=no_access_token', baseUrl));
    }

    // 4. นำ access_token ไปดึงข้อมูลผู้ใช้จาก UserInfo Endpoint
    const userinfoResponse = await fetch(userInfoUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userinfoResponse.ok) {
      console.error('[OAuth Callback] UserInfo fetch failed:', userinfoResponse.status);
      return NextResponse.redirect(new URL('/login?error=userinfo_failed', baseUrl));
    }

    const userData = await userinfoResponse.json();

    // 5. ตรวจสอบเงื่อนไขสังกัด: ต้องเป็นบุคลากรของ โรงพยาบาลหนองหาน [11018] เท่านั้น
    // รองรับทั้ง field hospital_code ตรงๆ หรือ data.organization.hcode ตามสเปกกระทรวงฯ
    const orgHcode =
      String(userData.hospital_code || userData.organization?.hcode || userData.user?.hospital_code || '').trim();

    if (orgHcode !== AUTHORIZED_HOSPITAL_CODE) {
      console.warn(`[OAuth Callback] Access denied: User hospital code (${orgHcode}) is not ${AUTHORIZED_HOSPITAL_CODE}`);
      return NextResponse.redirect(new URL('/unauthorized', baseUrl));
    }

    // 6. ดึงข้อมูลบุคลากรเพื่อสร้าง Session
    const userSession = {
      providerId: userData.provider_id || userData.sub || '',
      fullName: userData.name || userData.full_name || 'บุคลากร รพ.หนองหาน',
      position: userData.position || 'บุคลากรทางการแพทย์',
      hospitalCode: AUTHORIZED_HOSPITAL_CODE,
      hospitalName: userData.hospital_name || userData.organization?.hname_th || 'โรงพยาบาลหนองหาน',
      role: 'personnel',
    };

    // 7. สร้าง Session Token (JWT) ด้วย jose และบันทึกลงใน httpOnly Cookie
    const sessionJwt = await createSessionToken(userSession);

    const response = NextResponse.redirect(new URL('/dashboard', baseUrl));

    response.cookies.set('session', sessionJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 ชั่วโมง
    });

    // ลบคุกกี้ State ชั่วคราว
    response.cookies.delete('oauth_state');

    return response;
  } catch (error: any) {
    console.error('[OAuth Callback] Unexpected Error:', error);
    return NextResponse.redirect(new URL('/login?error=server_error', baseUrl));
  }
}

