import { NextRequest, NextResponse } from 'next/server';
import { MonitorService } from '@/server/services/monitor/monitor.service';

export async function GET(request: NextRequest) {
  const t0 = Date.now();
  try {
    const metrics = MonitorService.getMetrics('PRD');
    const elapsed = Math.max(1, Date.now() - t0);

    MonitorService.recordApiRequest({
      endpoint: '/api/monitor',
      method: 'GET',
      statusCode: 200,
      responseTimeMs: elapsed,
      environment: 'PRD',
    });

    return NextResponse.json(
      {
        success: true,
        data: metrics,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_PRERENDER')) {
      throw error;
    }
    console.error('Monitor API Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MONITOR_ERROR',
          message,
        },
      },
      { status: 500 }
    );
  }
}
