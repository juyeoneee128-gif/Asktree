import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

// GET /api/projects/[id]/sessions — 세션 목록 (raw_log 제외)
export async function GET(_request: Request, { params }: Params) {
  const { id: projectId } = await params;
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

  // 목록은 parsed_summary(jsonb)를 제외하여 응답 크기를 줄임 — 상세에서만 노출.
  // 신규: duration_seconds / prompt_count / total_tokens (정렬/표시용 정수).
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(
      'id, number, title, summary, files_changed, changed_files, prompts, duration_seconds, prompt_count, total_tokens, created_at, updated_at'
    )
    .eq('project_id', projectId)
    .order('number', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions: sessions ?? [] });
}
