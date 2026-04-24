import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

type Params = { params: Promise<{ id: string; sessionId: string }> };

// GET /api/projects/[id]/sessions/[sessionId] — 세션 상세 (raw_log 포함)
export async function GET(_request: Request, { params }: Params) {
  const { id: projectId, sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('project_id', projectId)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: '세션을 찾을 수 없습니다' }, { status: 404 });
  }

  return NextResponse.json(session);
}
