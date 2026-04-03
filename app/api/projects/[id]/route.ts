import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import type { Database } from '@/src/lib/supabase/types';

type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

type Params = { params: Promise<{ id: string }> };

// GET /api/projects/[id] — 프로젝트 상세 조회
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다' }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PATCH /api/projects/[id] — 프로젝트 수정
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const body = await request.json();
  const updates: ProjectUpdate = {};

  if (typeof body.name === 'string') updates.name = body.name;
  if (body.agent_status === 'connected' || body.agent_status === 'disconnected') updates.agent_status = body.agent_status;
  if ('agent_last_seen' in body) updates.agent_last_seen = body.agent_last_seen;
  if ('agent_path' in body) updates.agent_path = body.agent_path;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: '수정할 항목이 없습니다' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('projects')
    .update(updates as Database['public']['Tables']['projects']['Update'])
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다' }, { status: 404 });
  }

  return NextResponse.json(data);
}

// DELETE /api/projects/[id] — 프로젝트 삭제
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
