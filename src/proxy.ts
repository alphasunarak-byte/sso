import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'nhh_sso_super_secret_jwt_key_11018_udonthani_hospital_2026';
const key = new TextEncoder().encode(JWT_SECRET);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. จัดการ root path '/' ตัดหน้าหลักออก ให้เด้งไปหน้า login ก่อนเสมอ
  if (pathname === '/') {
    const sessionToken = request.cookies.get('session')?.value;
    const nhhSessionRaw = request.cookies.get('nhh_session')?.value;

    let hasValidSession = false;
    if (nhhSessionRaw) {
      try {
        const decoded = decodeURIComponent(nhhSessionRaw);
        const parsed = JSON.parse(decoded);
        if (parsed && (parsed.hospitalCode === '11018' || parsed.providerId)) {
          hasValidSession = true;
        }
      } catch {}
    }

    if (!hasValidSession && sessionToken) {
      try {
        await jwtVerify(sessionToken, key, { algorithms: ['HS256'] });
        hasValidSession = true;
      } catch {}
    }

    if (hasValidSession) {
      return NextResponse.redirect(new URL('/console', request.url));
    }

    const loginUrl = new URL('/login', request.url);
    request.nextUrl.searchParams.forEach((value, paramKey) => {
      loginUrl.searchParams.set(paramKey, value);
    });
    return NextResponse.redirect(loginUrl);
  }

  // 2. ดักจับและป้องกันหน้า /dashboard และ /console
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/console')) {
    const sessionToken = request.cookies.get('session')?.value;
    const nhhSessionRaw = request.cookies.get('nhh_session')?.value;

    // 1.1 ถ้าไม่มีคุกกี้เลย ให้พาไปหน้า Login ปกติ (ไม่ต้องมี error=session_expired)
    if (!sessionToken && !nhhSessionRaw) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 1.2 ตรวจสอบ nhh_session แบบ JSON (Provider ID รพ.หนองหาน [11018])
    if (nhhSessionRaw) {
      try {
        const decoded = decodeURIComponent(nhhSessionRaw);
        const parsed = JSON.parse(decoded);
        if (parsed && (parsed.hospitalCode === '11018' || parsed.providerId)) {
          return NextResponse.next();
        }
      } catch (err) {
        // ลองตรวจตัวถัดไป
      }
    }

    // 1.3 ตรวจสอบ session แบบ JWT (jose)
    if (sessionToken) {
      try {
        await jwtVerify(sessionToken, key, { algorithms: ['HS256'] });
        return NextResponse.next();
      } catch (err) {
        // ลองตรวจแบบ JSON เผื่อเก็บ JSON ลง session
      }

      try {
        const decoded = decodeURIComponent(sessionToken);
        const parsed = JSON.parse(decoded);
        if (parsed && (parsed.hospitalCode === '11018' || parsed.providerId)) {
          return NextResponse.next();
        }
      } catch (err) {
        // คุกกี้ไม่ผ่าน
      }
    }

    // 1.4 ถ้ามีคุกกี้ส่งมา แต่ตรวจสอบทั้งสองแบบไม่ผ่าน (หมดอายุ หรือผิดสังกัด)
    const loginUrl = new URL('/login?error=session_expired', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('session');
    response.cookies.delete('nhh_session');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/console/:path*'],
};
