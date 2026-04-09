import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

// GET /api/projects/[id]/guidelines — 가이드라인 목록 + 카운트
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

  const { data: guidelines, error } = await supabase
    .from('guidelines')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const all = guidelines ?? [];

  // 정렬: unapplied → applied, 같은 status 내 created_at DESC
  all.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'unapplied' ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const counts = {
    total: all.length,
    unapplied: all.filter((g) => g.status === 'unapplied').length,
    applied: all.filter((g) => g.status === 'applied').length,
  };

  return NextResponse.json({ guidelines: all, counts });
}
