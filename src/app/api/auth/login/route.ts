import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: Request) {
  // 1. ดึงค่าคอนฟิกจาก Environment Variables
  const authUrl = process.env.OAUTH_AUTH_URL || 'http://localhost:3030/oauth/authorize';
  const clientId = process.env.OAUTH_CLIENT_ID || 'super-app-nhh-11018';
  const redirectUri = process.env.OAUTH_REDIRECT_URI || 'http://localhost:3030/api/auth/callback';
  const scope = process.env.OAUTH_SCOPE || 'openid profile provider hospital.11018';

  // 2. สร้างค่า State แบบสุ่ม เพื่อป้องกัน CSRF (Cross-Site Request Forgery)
  const state = crypto.randomUUID();

  // 3. สร้าง URL สำหรับ Redirect ผู้ใช้ไปยังหน้ายินยอม/ยืนยันตัวตนของ IdP
  const targetUrl = new URL(authUrl);
  targetUrl.searchParams.set('response_type', 'code');
  targetUrl.searchParams.set('client_id', clientId);
  targetUrl.searchParams.set('redirect_uri', redirectUri);
  targetUrl.searchParams.set('scope', scope);
  targetUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(targetUrl.toString());

  // 4. บันทึก State ลงใน httpOnly Cookie สำหรับตรวจสอบในขั้นตอน Callback
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 5, // 5 นาที
  });

  return response;
}

