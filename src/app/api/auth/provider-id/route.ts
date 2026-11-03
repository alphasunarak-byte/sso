import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { AuthService } from '@/server/services/auth/auth.service';
import { MonitorService } from '@/server/services/monitor/monitor.service';

export async function GET(request: Request) {
  const t0 = Date.now();
  const url = new URL(request.url);
  const reqEnv: 'PRD' = 'PRD'; // ระบบใช้งานจริงเท่านั้น (Production Only)
  const callbackUrl = url.searchParams.get('callbackUrl') || '/console';

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0].trim();
  const host = forwardedHost || request.headers.get('host') || 'localhost:3030';
  const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(:[0-9]+)?$/.test(host);
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim();
  const protocol = forwardedProto === 'https' || forwardedProto === 'http'
    ? forwardedProto
    : ((host.includes('localhost') || isIp) ? 'http' : 'https');

  const redirectUri = `${protocol}://${host}/api/auth/provider-id/callback`;
  const state = crypto.randomUUID();

  const mophRedirectUrl = AuthService.buildOAuthRedirectUrl({
    redirectUri,
    state,
    env: reqEnv,
  });

  const response = NextResponse.redirect(mophRedirectUrl);

  // บันทึก oauth_state, callbackUrl และ environment สำหรับตรวจสอบตอน callback
  const statePayload = JSON.stringify({ state, env: reqEnv, callbackUrl });
  response.cookies.set('oauth_state', statePayload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 5, // 5 นาที
  });

  MonitorService.recordApiRequest({
    endpoint: '/api/auth/provider-id',
    method: 'GET',
    statusCode: 307,
    responseTimeMs: Math.max(1, Date.now() - t0),
    environment: 'PRD',
  });

  return response;
}
