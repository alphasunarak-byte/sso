import { NextRequest, NextResponse } from 'next/server';
import { OAuthIdpService } from '@/server/services/oauth/oauth-idp.service';
import { MonitorService } from '@/server/services/monitor/monitor.service';

export async function POST(request: NextRequest) {
  const t0 = Date.now();
  try {
    let clientId = '';
    let clientSecret = '';
    let grantType = '';
    let code = '';
    let redirectUri = '';
    let scope = '';

    // 1. ตรวจสอบ Basic Auth Header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Basic ')) {
      const credentials = Buffer.from(authHeader.substring(6), 'base64').toString('utf8');
      const [id, secret] = credentials.split(':');
      clientId = id;
      clientSecret = secret;
    }

    // 2. อ่านข้อมูลจาก Body (รองรับทั้ง form-urlencoded และ json)
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      grantType = formData.get('grant_type')?.toString() || '';
      code = formData.get('code')?.toString() || '';
      redirectUri = formData.get('redirect_uri')?.toString() || '';
      scope = formData.get('scope')?.toString() || '';
      if (!clientId) clientId = formData.get('client_id')?.toString() || '';
      if (!clientSecret) clientSecret = formData.get('client_secret')?.toString() || '';
    } else {
      const body = await request.json().catch(() => ({}));
      grantType = body.grant_type || '';
      code = body.code || '';
      redirectUri = body.redirect_uri || '';
      scope = body.scope || '';
      if (!clientId) clientId = body.client_id || '';
      if (!clientSecret) clientSecret = body.client_secret || '';
    }

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'จำเป็นต้องระบุ client_id และ client_secret' },
        { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // 3. จัดการตาม grant_type
    if (grantType === 'authorization_code') {
      if (!code) {
        return NextResponse.json(
          { error: 'invalid_request', error_description: 'จำเป็นต้องระบุ code สำหรับ authorization_code grant' },
          { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }

      const result = OAuthIdpService.exchangeCode({
        code,
        clientId,
        clientSecret,
        redirectUri,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: 'invalid_grant', error_description: result.error },
          { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }

      return NextResponse.json(result.tokens, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (grantType === 'client_credentials') {
      const result = OAuthIdpService.issueClientCredentialsToken({
        clientId,
        clientSecret,
        scope,
      });

      MonitorService.recordApiRequest({
        endpoint: '/api/oauth/token',
        method: 'POST',
        statusCode: result.success ? 200 : 401,
        responseTimeMs: Math.max(1, Date.now() - t0),
        environment: 'PRD',
      });

      if (!result.success) {
        return NextResponse.json(
          { error: 'invalid_client', error_description: result.error },
          { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }

      return NextResponse.json(result.tokens, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return NextResponse.json(
      { error: 'unsupported_grant_type', error_description: `ไม่รองรับ grant_type '${grantType}'` },
      { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err: any) {
    console.error('OAuth Token error:', err);
    return NextResponse.json(
      { error: 'server_error', error_description: err.message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

