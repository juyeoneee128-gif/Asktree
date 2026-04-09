import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { createClient as createAdminSupabase } from '@supabase/supabase-js';
import type { Database } from '@/src/lib/supabase/types';

// GET /api/user — 프로필 조회
export async function GET() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, avatar_url, login_method, credits, total_credits, used_this_month, encrypted_api_key, created_at')
    .eq('id', authUser.id)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다' }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar_url: user.avatar_url,
    login_method: user.login_method,
    credits: user.credits,
    total_credits: user.total_credits,
    used_this_month: user.used_this_month,
    has_api_key: !!user.encrypted_api_key,
    created_at: user.created_at,
  });
}

// PATCH /api/user — 프로필 수정
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (typeof body.name === 'string') updates.name = body.name.trim();
  if (typeof body.avatar_url === 'string') updates.avatar_url = body.avatar_url;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: '수정할 항목이 없습니다' }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', authUser.id)
    .select('id, name, email, avatar_url, login_method, credits, total_credits, used_this_month, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, user: updated });
}

// DELETE /api/user — 계정 삭제 (cascade)
export async function DELETE() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  // service_role로 auth.users 삭제 → cascade로 public.users + 모든 하위 데이터 삭제
  const adminClient = createAdminSupabase<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await adminClient.auth.admin.deleteUser(authUser.id);

  if (error) {
    return NextResponse.json({ error: `계정 삭제 실패: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
