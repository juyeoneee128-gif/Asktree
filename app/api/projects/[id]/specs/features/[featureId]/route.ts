import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

type Params = { params: Promise<{ id: string; featureId: string }> };

// PATCH /api/projects/[id]/specs/features/[featureId] — 수동 상태 변경
export async function PATCH(request: Request, { params }: Params) {
  const { id: projectId, featureId } = await params;
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

  const { data: feature } = await supabase
    .from('spec_features')
    .select('id')
    .eq('id', featureId)
    .eq('project_id', projectId)
    .single();

  if (!feature) {
    return NextResponse.json({ error: '기능을 찾을 수 없습니다' }, { status: 404 });
  }

  const body = await request.json();
  const { status } = body;

  const validStatuses = ['implemented', 'partial', 'unimplemented', 'attention'];
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `status는 ${validStatuses.join(', ')} 중 하나여야 합니다` },
      { status: 400 }
    );
  }

  const { data: updated, error } = await supabase
    .from('spec_features')
    .update({ status })
    .eq('id', featureId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, feature: updated });
}
