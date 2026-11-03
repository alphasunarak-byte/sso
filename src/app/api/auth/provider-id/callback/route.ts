import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth/auth.service';
import { createSessionToken } from '@/lib/session';
import { MonitorService } from '@/server/services/monitor/monitor.service';

export async function GET(request: NextRequest) {
  const t0 = Date.now();
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0].trim();
  const host = forwardedHost || request.headers.get('host') || 'localhost:3030';
  const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(:[0-9]+)?$/.test(host);
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim();
  const protocol = forwardedProto === 'https' || forwardedProto === 'http'
    ? forwardedProto
    : ((host.includes('localhost') || isIp) ? 'http' : 'https');
  const baseUrl = `${protocol}://${host}`;

  // 1. ตรวจสอบกรณี Provider หรือผู้ใช้ยกเลิก
  if (errorParam) {
    console.warn('[Provider ID Callback] OAuth Provider Error:', errorParam);
    return NextResponse.redirect(new URL(`/login?error=provider_error&detail=${encodeURIComponent(errorParam)}`, baseUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=invalid_code', baseUrl));
  }

  // 2. ตรวจสอบ state ความถูกต้องของเซสชันป้องกัน CSRF
  const cookieRaw = request.cookies.get('oauth_state')?.value;
  let savedState = '';
  const env: 'PRD' = 'PRD'; // ระบบใช้งานจริงเท่านั้น (Production Only)
  let callbackUrl = '/console';

  if (cookieRaw) {
    try {
      const parsed = JSON.parse(cookieRaw);
      savedState = parsed.state;
      callbackUrl = parsed.callbackUrl || callbackUrl;
    } catch {
      savedState = cookieRaw;
    }
  }

  if (savedState && state && savedState !== state) {
    console.warn('[Provider ID Callback] State mismatch error');
    return NextResponse.redirect(new URL('/login?error=state_mismatch', baseUrl));
  }

  const redirectUri = `${baseUrl}/api/auth/provider-id/callback`;

  try {
    // 3. ขั้นตอนที่ 1 (Health ID OAuth): ขอ Health ID Access Token จาก Authorization Code
    const healthTokenResult = await AuthService.exchangeHealthIdToken({
      code,
      redirectUri,
      env,
    });

    if (!healthTokenResult.success || !healthTokenResult.accessToken) {
      console.error('[Provider ID Callback] Health ID Token exchange failed:', healthTokenResult.error);
      return NextResponse.redirect(new URL('/login?error=health_id_failed', baseUrl));
    }

    // 4. ขั้นตอนที่ 2 (Provider ID Token): ขอ Service Token ของระบบ Provider ID
    const providerTokenResult = await AuthService.exchangeProviderServiceToken({
      healthIdAccessToken: healthTokenResult.accessToken,
      env,
    });

    if (!providerTokenResult.success || !providerTokenResult.serviceAccessToken) {
      console.error('[Provider ID Callback] Provider Token exchange failed:', providerTokenResult.error);
      return NextResponse.redirect(new URL('/login?error=not_provider_id', baseUrl));
    }

    // 5. ขั้นตอนที่ 3 (Provider Profile): ดึงข้อมูลโปรไฟล์และสังกัดการทำงาน
    const profileResult = await AuthService.fetchProviderProfile({
      serviceAccessToken: providerTokenResult.serviceAccessToken,
      env,
    });

    if (!profileResult.success || !profileResult.profile) {
      console.error('[Provider ID Callback] Fetch profile failed:', profileResult.error);
      return NextResponse.redirect(new URL('/login?error=profile_fetch_failed', baseUrl));
    }

    const profile = profileResult.profile;

    // 6. ตรวจสอบสิทธิ์เฉพาะบุคลากรของ โรงพยาบาลหนองหาน [11018]
    const authCheck = AuthService.verifyNonghanHospitalAffiliation(profile);
    if (!authCheck.authorized) {
      console.warn('[Provider ID Callback] Unauthorized: User not affiliated with Nonghan Hospital [11018]');
      return NextResponse.redirect(new URL('/login?error=provider_not_authorized', baseUrl));
    }

    const nonghanOrg = authCheck.nonghanOrg;
    const fullName = profile.name_th ||
      `${profile.firstname_th || ''} ${profile.lastname_th || ''}`.trim() ||
      profile.name_eng ||
      'บุคลากร รพ.หนองหาน';

    const isAdmin = AuthService.isSystemAdmin(profile);
    const role: 'ADMIN' | 'USER' = isAdmin ? 'ADMIN' : 'USER';

    const userSession = {
      providerId: profile.provider_id || '',
      accountId: profile.account_id || '',
      hashCid: profile.hash_cid || '',
      cid: profile.cid || profile.citizen_id || '',
      fullName,
      title: profile.special_title_th || profile.title_th || '',
      position: nonghanOrg?.position || profile.position || 'บุคลากรทางการแพทย์',
      department: nonghanOrg?.affiliation || nonghanOrg?.department || 'โรงพยาบาลหนองหาน',
      hospitalCode: '11018',
      hospitalName: 'โรงพยาบาลหนองหาน',
      licenseId: nonghanOrg?.license_id || '',
      expertise: nonghanOrg?.expertise || '',
      isHrAdmin: !!nonghanOrg?.is_hr_admin,
      isDirector: !!nonghanOrg?.is_director,
      isAdmin,
      role,
      loginBy: 'provider_id_health_id',
      environment: env,
      authenticatedAt: new Date().toISOString(),
    };

    // 7. บันทึก Session และ Redirect ไปยังปลายทาง (Console หรือหน้าที่ผู้ใช้ต้องการเข้า)
    const targetPath = callbackUrl.startsWith('/') ? callbackUrl : '/console';
    const response = NextResponse.redirect(new URL(targetPath, baseUrl));

    // สร้าง JWT Session Token ด้วย jose
    try {
      const sessionJwt = await createSessionToken(userSession);
      response.cookies.set('session', sessionJwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 8, // 8 ชั่วโมง
      });
    } catch (e) {
      console.warn('Failed to generate JWT session token:', e);
    }

    // Session Cookie สำหรับ Proxy และ Client Component
    response.cookies.set('nhh_session', JSON.stringify(userSession), {
      httpOnly: false, // เพื่อให้ Client อ่านไปแสดงผลได้
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 ชั่วโมง
    });

    // ลบคุกกี้ oauth_state
    response.cookies.delete('oauth_state');

    MonitorService.recordApiRequest({
      endpoint: '/api/auth/provider-id/callback',
      method: 'GET',
      statusCode: 200,
      responseTimeMs: Math.max(1, Date.now() - t0),
      environment: 'PRD',
    });

    return response;
  } catch (err: any) {
    console.error('[Provider ID Callback] Unexpected error:', err);
    MonitorService.recordApiRequest({
      endpoint: '/api/auth/provider-id/callback',
      method: 'GET',
      statusCode: 500,
      responseTimeMs: Math.max(1, Date.now() - t0),
      environment: 'PRD',
    });
    return NextResponse.redirect(new URL('/login?error=provider_error', baseUrl));
  }
}
