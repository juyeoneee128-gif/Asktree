import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LIMITS = {
  name: 100,
  email: 200,
  organization: 200,
  content: 5000,
};

// POST /api/inquiries — 문의 등록
export async function POST(request: Request) {
  let body: {
    name?: unknown;
    email?: unknown;
    organization?: unknown;
    content?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: '잘못된 요청 형식입니다.' },
      { status: 400 }
    );
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const rawEmail = typeof body.email === 'string' ? body.email.trim() : '';
  const organization =
    typeof body.organization === 'string' ? body.organization.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';

  if (!name) {
    return NextResponse.json(
      { error: '성함을 입력해주세요.' },
      { status: 400 }
    );
  }
  if (name.length > LIMITS.name) {
    return NextResponse.json(
      { error: '성함이 너무 깁니다.' },
      { status: 400 }
    );
  }
  if (!rawEmail) {
    return NextResponse.json(
      { error: '이메일을 입력해주세요.' },
      { status: 400 }
    );
  }
  if (rawEmail.length > LIMITS.email || !EMAIL_REGEX.test(rawEmail)) {
    return NextResponse.json(
      { error: '올바른 이메일 형식이 아닙니다.' },
      { status: 400 }
    );
  }
  if (organization.length > LIMITS.organization) {
    return NextResponse.json(
      { error: '소속이 너무 깁니다.' },
      { status: 400 }
    );
  }
  if (!content) {
    return NextResponse.json(
      { error: '문의 내용을 입력해주세요.' },
      { status: 400 }
    );
  }
  if (content.length > LIMITS.content) {
    return NextResponse.json(
      { error: '문의 내용이 너무 깁니다.' },
      { status: 400 }
    );
  }

  const email = rawEmail.toLowerCase();
  const supabase = await createClient();

  const { error } = await supabase.from('inquiries').insert({
    name,
    email,
    organization: organization || null,
    content,
  });

  if (error) {
    return NextResponse.json(
      { error: '등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
