import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { extractAndSaveFeatures } from '@/src/lib/specs/extract-features';
import { checkCredits, deductCredit, InsufficientCreditsError } from '@/src/lib/credits/deduct';

type Params = { params: Promise<{ id: string }> };

const CREDIT_COST = 1;

// GET /api/projects/[id]/specs/documents — 문서 목록
export async function GET(_request: Request, { params }: Params) {
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

  const { data: documents, error } = await supabase
    .from('spec_documents')
    .select('*')
    .eq('project_id', projectId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ documents: documents ?? [] });
}

// POST /api/projects/[id]/specs/documents — 문서 업로드 + 기능 추출
export async function POST(request: Request, { params }: Params) {
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

  const body = await request.json();
  const { name, type, content } = body;

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'name은 필수입니다' }, { status: 400 });
  }
  if (!type || !['FRD', 'PRD'].includes(type)) {
    return NextResponse.json({ error: 'type은 "FRD" 또는 "PRD"만 허용됩니다' }, { status: 400 });
  }
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'content는 필수입니다' }, { status: 400 });
  }

  // 크레딧 사전 체크
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
    const result = await extractAndSaveFeatures(projectId, name, type, content);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // 성공 시에만 차감
    const { remaining } = await deductCredit(user.id, CREDIT_COST);

    return NextResponse.json({
      success: true,
      credits_remaining: remaining,
      ...result,
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Feature extraction failed', detail: (err as Error).message },
      { status: 500 }
    );
  }
}
