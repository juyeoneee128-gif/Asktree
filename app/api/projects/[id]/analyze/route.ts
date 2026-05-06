import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { runAnalysis } from '@/src/lib/analysis/run-analysis';
import { hasUserApiKey, getUserApiKey } from '@/src/lib/credits/byok';
import {
  deductCredit,
  getCreditInfo,
  InsufficientCreditsError,
} from '@/src/lib/credits/deduct';
import { CREDIT_COSTS } from '@/src/lib/credits/constants';

type Params = { params: Promise<{ id: string }> };

// POST /api/projects/[id]/analyze — 수동 재분석 (full mode, 2 크레딧)
export async function POST(request: Request, { params }: Params) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  // 프로젝트 소유권 확인
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다' }, { status: 404 });
  }

  // 요청 body에서 session_id 추출
  const body = await request.json();
  const { session_id } = body;

  if (!session_id || typeof session_id !== 'string') {
    return NextResponse.json(
      { error: 'session_id is required' },
      { status: 400 }
    );
  }

  // 세션이 해당 프로젝트 소속인지 확인
  const { data: session } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', session_id)
    .eq('project_id', projectId)
    .single();

  if (!session) {
    return NextResponse.json(
      { error: '세션을 찾을 수 없습니다' },
      { status: 404 }
    );
  }

  // 크레딧 + BYOK 체크
  const isByok = await hasUserApiKey(user.id);
  const apiKey = isByok ? (await getUserApiKey(user.id)) ?? undefined : undefined;
  let creditsUsed = 0;

  if (!isByok) {
    try {
      await deductCredit(user.id, CREDIT_COSTS.MANUAL_ANALYSIS, {
        reason: 'manual_analysis',
        projectId,
        sessionId: session_id,
      });
      creditsUsed = CREDIT_COSTS.MANUAL_ANALYSIS;
    } catch (err) {
      if (err instanceof InsufficientCreditsError) {
        return NextResponse.json(
          {
            error: '크레딧이 부족합니다',
            insufficient_credits: true,
            remaining: err.remaining,
            required: CREDIT_COSTS.MANUAL_ANALYSIS,
          },
          { status: 403 }
        );
      }
      console.error('[analyze] credit deduction failed:', (err as Error).message);
      return NextResponse.json(
        { error: 'Credit deduction failed' },
        { status: 500 }
      );
    }
  }

  // 분석 실행 (수동 트리거 → full 모드, Sonnet)
  try {
    const result = await runAnalysis(projectId, session_id, 'full', {
      useLightModel: false,
      apiKey,
    });

    let remaining = 0;
    try {
      remaining = (await getCreditInfo(user.id)).remaining;
    } catch {
      // 응답 부가 정보, 실패해도 무시
    }

    return NextResponse.json({
      success: true,
      ...result,
      credits: {
        used: creditsUsed,
        remaining,
        is_byok: isByok,
      },
    });
  } catch (err) {
    console.error('[analyze] Analysis failed:', (err as Error).message);
    return NextResponse.json(
      { error: 'Analysis failed', detail: (err as Error).message },
      { status: 500 }
    );
  }
}
