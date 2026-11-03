import { NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth/auth.service';
import { MonitorService } from '@/server/services/monitor/monitor.service';

export async function POST(req: Request) {
  const t0 = Date.now();
  try {
    const body = await req.json().catch(() => ({}));

    // If request has action === 'logout', clear session cookie
    if (body.action === 'logout') {
      const response = NextResponse.json({ success: true, message: 'Logged out successfully' }, { status: 200 });
      response.cookies.delete('nhh_session');
      response.cookies.delete('session');
      return response;
    }

    // Live Request Test to MOPH APIs (ทดสอบการเชื่อมต่อ API สธ. จริง)
    const probeResult = await AuthService.testLiveEndpoint({
      environment: 'PRD',
      provider: body.provider === 'HEALTH_ID' ? 'HEALTH_ID' : 'PROVIDER_ID',
      hospitalCode: '11018',
      serviceName: 'Super App By รพ.หนองหาน',
    });

    const elapsed = Date.now() - t0;
    MonitorService.recordApiRequest({
      endpoint: '/api/auth/provider',
      method: 'POST',
      statusCode: probeResult.success ? 200 : 502,
      responseTimeMs: elapsed,
      environment: 'PRD',
      serviceName: 'Super App By รพ.หนองหาน',
    });

    return NextResponse.json(probeResult, { status: 200 });
  } catch (error: unknown) {
    console.error('Provider ID Live Test API Error:', error);
    const elapsed = Date.now() - t0;
    const message = error instanceof Error ? error.message : 'Internal Server Error';

    MonitorService.recordApiRequest({
      endpoint: '/api/auth/provider',
      method: 'POST',
      statusCode: 500,
      responseTimeMs: elapsed,
      environment: 'PRD',
      serviceName: 'Super App By รพ.หนองหาน',
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PROBE_FAILED',
          message,
        },
      },
      { status: 500 }
    );
  }
}
