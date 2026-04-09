import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

type Params = { params: Promise<{ id: string; guidelineId: string }> };

// ─── 공통: 소유권 + 가이드라인 존재 확인 ───

async function verifyGuidelineAccess(projectId: string, guidelineId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: '인증이 필요합니다', status: 401 } as const;

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (!project) return { error: '프로젝트를 찾을 수 없습니다', status: 404 } as const;

  const { data: guideline } = await supabase
    .from('guidelines')
    .select('*')
    .eq('id', guidelineId)
    .eq('project_id', projectId)
    .single();

  if (!guideline) return { error: '가이드라인을 찾을 수 없습니다', status: 404 } as const;

  return { supabase, guideline } as const;
}

// GET /api/projects/[id]/guidelines/[guidelineId] — 가이드라인 상세
export async function GET(_request: Request, { params }: Params) {
  const { id: projectId, guidelineId } = await params;
  const result = await verifyGuidelineAccess(projectId, guidelineId);

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.guideline);
}

// PATCH /api/projects/[id]/guidelines/[guidelineId] — 상태 변경
export async function PATCH(request: Request, { params }: Params) {
  const { id: projectId, guidelineId } = await params;
  const result = await verifyGuidelineAccess(projectId, guidelineId);

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  const { status: newStatus } = body;

  if (!newStatus || !['unapplied', 'applied'].includes(newStatus)) {
    return NextResponse.json(
      { error: 'status는 "unapplied" 또는 "applied"만 허용됩니다' },
      { status: 400 }
    );
  }

  const { data: updated, error } = await result.supabase
    .from('guidelines')
    .update({ status: newStatus })
    .eq('id', guidelineId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, guideline: updated });
}

// DELETE /api/projects/[id]/guidelines/[guidelineId] — 가이드라인 삭제
export async function DELETE(_request: Request, { params }: Params) {
  const { id: projectId, guidelineId } = await params;
  const result = await verifyGuidelineAccess(projectId, guidelineId);

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { error } = await result.supabase
    .from('guidelines')
    .delete()
    .eq('id', guidelineId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
