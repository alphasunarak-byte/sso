import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/session';
import { AuthService } from '@/server/services/auth/auth.service';

function formatUserWithRole(user: any) {
  const isAdmin = AuthService.isSystemAdmin(user);
  return {
    ...user,
    isAdmin,
    role: isAdmin ? 'ADMIN' : 'USER',
  };
}

export async function GET(request: NextRequest) {
  const sessionVal = request.cookies.get('session')?.value;
  const nhhSessionVal = request.cookies.get('nhh_session')?.value;

  // 1. ตรวจสอบคุกกี้ nhh_session แบบ JSON ก่อน
  if (nhhSessionVal) {
    try {
      const decoded = decodeURIComponent(nhhSessionVal);
      const user = JSON.parse(decoded);
      if (user && (user.hospitalCode === '11018' || user.providerId)) {
        return NextResponse.json({ authenticated: true, user: formatUserWithRole(user) });
      }
    } catch {}
  }

  // 2. ตรวจสอบคุกกี้ session แบบ JWT (jose)
  if (sessionVal) {
    try {
      const jwtPayload = await verifySessionToken(sessionVal);
      if (jwtPayload) {
        return NextResponse.json({ authenticated: true, user: formatUserWithRole(jwtPayload) });
      }
    } catch {}

    // 3. ลองตรวจสอบ session เผื่อถูกเก็บเป็น JSON
    try {
      const decoded = decodeURIComponent(sessionVal);
      const user = JSON.parse(decoded);
      if (user && (user.hospitalCode === '11018' || user.providerId)) {
        return NextResponse.json({ authenticated: true, user: formatUserWithRole(user) });
      }
    } catch {}
  }

  return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
}
