import { NextResponse } from 'next/server';
import { cleanupExpiredEphemeral } from '@/src/lib/agent/ephemeral';

// GET /api/cron/cleanup-ephemeral — Vercel Cron이 15분마다 호출
export async function GET(request: Request) {
  // Cron secret 검증 (Vercel Cron은 Authorization 헤더에 Bearer <CRON_SECRET> 전송)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await cleanupExpiredEphemeral();

    console.log(
      `[cron/cleanup-ephemeral] Deleted ${result.deleted} expired rows at ${new Date().toISOString()}`
    );

    return NextResponse.json({
      success: true,
      deleted: result.deleted,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[cron/cleanup-ephemeral] Error:', (err as Error).message);
    return NextResponse.json(
      { error: 'Cleanup failed', detail: (err as Error).message },
      { status: 500 }
    );
  }
}
