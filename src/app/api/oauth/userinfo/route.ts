import { NextRequest, NextResponse } from 'next/server';
import { OAuthIdpService } from '@/server/services/oauth/oauth-idp.service';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'invalid_token', error_description: 'จำเป็นต้องแนบ Authorization: Bearer <access_token>' },
      { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }

  const token = authHeader.substring(7).trim();
  const result = OAuthIdpService.getUserInfo(token);

  if (!result.success) {
    return NextResponse.json(
      { error: 'invalid_token', error_description: result.error },
      { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }

  return NextResponse.json(result.data, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

