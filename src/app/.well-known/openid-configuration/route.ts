import { NextRequest, NextResponse } from 'next/server';
import { OAuthIdpService } from '@/server/services/oauth/oauth-idp.service';

export async function GET(request: NextRequest) {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0].trim();
  const host = forwardedHost || request.headers.get('host') || 'localhost:3030';
  const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(:[0-9]+)?$/.test(host);
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim();
  const protocol = forwardedProto === 'https' || forwardedProto === 'http'
    ? forwardedProto
    : ((host.includes('localhost') || isIp) ? 'http' : 'https');

  const baseUrl = `${protocol}://${host}`;
  const config = OAuthIdpService.getOpenIdConfiguration(baseUrl);

  return NextResponse.json(config, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}

