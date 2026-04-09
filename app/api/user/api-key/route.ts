import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { encryptApiKey, maskApiKey } from '@/src/lib/crypto/api-key';

// GET /api/user/api-key — 마스킹된 키 조회
export async function GET() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('encrypted_api_key')
    .eq('id', authUser.id)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다' }, { status: 404 });
  }

  if (!user.encrypted_api_key) {
    return NextResponse.json({ has_key: false, masked_key: null });
  }

  // 원본 복호화 없이 등록 여부만 반환 + 마스킹은 저장 시 별도 처리 불가
  // → 마스킹 정보는 PUT 시 응답에서만 제공, GET에서는 등록 여부만
  return NextResponse.json({
    has_key: true,
    masked_key: 'sk-ant-***...***', // 보안을 위해 고정 마스킹
  });
}

// PUT /api/user/api-key — 키 등록/변경
export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const body = await request.json();
  const { api_key } = body;

  if (!api_key || typeof api_key !== 'string' || api_key.trim().length === 0) {
    return NextResponse.json({ error: 'api_key는 필수입니다' }, { status: 400 });
  }

  // 기본 형식 검증
  if (!api_key.startsWith('sk-ant-')) {
    return NextResponse.json({ error: 'Anthropic API 키 형식이 아닙니다 (sk-ant- 접두사 필요)' }, { status: 400 });
  }

  // 암호화 + 저장
  const encrypted = encryptApiKey(api_key);
  const masked = maskApiKey(api_key);

  const { error } = await supabase
    .from('users')
    .update({ encrypted_api_key: encrypted })
    .eq('id', authUser.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, masked_key: masked });
}

// DELETE /api/user/api-key — 키 삭제
export async function DELETE() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const { error } = await supabase
    .from('users')
    .update({ encrypted_api_key: null })
    .eq('id', authUser.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
