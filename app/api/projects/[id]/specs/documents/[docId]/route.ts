import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

type Params = { params: Promise<{ id: string; docId: string }> };

// DELETE /api/projects/[id]/specs/documents/[docId] — 문서 삭제 (cascade: features)
export async function DELETE(_request: Request, { params }: Params) {
  const { id: projectId, docId } = await params;
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

  const { data: doc } = await supabase
    .from('spec_documents')
    .select('id')
    .eq('id', docId)
    .eq('project_id', projectId)
    .single();

  if (!doc) {
    return NextResponse.json({ error: '문서를 찾을 수 없습니다' }, { status: 404 });
  }

  const { error } = await supabase
    .from('spec_documents')
    .delete()
    .eq('id', docId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
