import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { assessFeatures } from '@/src/lib/specs/assess-features';
import { checkCredits, deductCredit, InsufficientCreditsError } from '@/src/lib/credits/deduct';

type Params = { params: Promise<{ id: string }> };

const CREDIT_COST = 1;

// POST /api/projects/[id]/specs/features/assess — 구현 현황 판정 실행
export async function POST(_request: Request, { params }: Params) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다' }, { status: 404 });
  }

  try {
    await checkCredits(user.id, CREDIT_COST);
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { error: '크레딧이 부족합니다', remaining: err.remaining, required: CREDIT_COST },
        { status: 402 }
      );
    }
    throw err;
  }

  try {
    const result = await assessFeatures(projectId);
    const { remaining } = await deductCredit(user.id, CREDIT_COST);
    return NextResponse.json({ success: true, credits_remaining: remaining, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: 'Assessment failed', detail: (err as Error).message },
      { status: 500 }
    );
  }
}
