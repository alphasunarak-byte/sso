import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'ออกจากระบบสำเร็จ' });
  
  const cookiesToClear = [
    'session',
    'nhh_session',
    'nhh_user_session',
    'nhh_sso_session',
    'nhh_token',
    'oauth_state',
  ];

  cookiesToClear.forEach((name) => {
    response.cookies.set(name, '', {
      path: '/',
      expires: new Date(0),
      maxAge: 0,
      httpOnly: false,
    });
    response.cookies.delete(name);
  });

  return response;
}

export async function GET(request: Request) {
  const baseUrl = new URL('/', request.url).origin;
  const response = NextResponse.redirect(new URL('/login', baseUrl));

  const cookiesToClear = [
    'session',
    'nhh_session',
    'nhh_user_session',
    'nhh_sso_session',
    'nhh_token',
    'oauth_state',
  ];

  cookiesToClear.forEach((name) => {
    response.cookies.set(name, '', {
      path: '/',
      expires: new Date(0),
      maxAge: 0,
      httpOnly: false,
    });
    response.cookies.delete(name);
  });

  return response;
}
