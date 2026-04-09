import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { estimateAnalysisCredits } from '@/src/lib/analysis/estimate-credits';

type Params = { params: Promise<{ id: string }> };

// GET /api/projects/[id]/analyze/estimate?session_id=xxx — 예상 크레딧 조회
export async function GET(request: Request, { params }: Params) {
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

  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'session_id query parameter is required' }, { status: 400 });
  }

  const { data: session } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('project_id', projectId)
    .single();

  if (!session) {
    return NextResponse.json({ error: '세션을 찾을 수 없습니다' }, { status: 404 });
  }

  try {
    const estimate = await estimateAnalysisCredits(projectId, sessionId);
    return NextResponse.json(estimate);
  } catch (err) {
    return NextResponse.json(
      { error: 'Estimation failed', detail: (err as Error).message },
      { status: 500 }
    );
  }
}
