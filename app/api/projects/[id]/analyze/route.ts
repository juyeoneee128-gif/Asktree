import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { runAnalysis } from '@/src/lib/analysis/run-analysis';

type Params = { params: Promise<{ id: string }> };

// POST /api/projects/[id]/analyze — 분석 실행 (수동 트리거)
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

  // 분석 실행 (userId 전달 → run-analysis 내부에서 크레딧 체크/차감)
  try {
    const result = await runAnalysis(projectId, session_id, user.id);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('[analyze] Analysis failed:', (err as Error).message);
    return NextResponse.json(
      { error: 'Analysis failed', detail: (err as Error).message },
      { status: 500 }
    );
  }
}
