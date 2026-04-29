import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/waitlist — 사전 등록
export async function POST(request: Request) {
  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: '잘못된 요청 형식입니다.' },
      { status: 400 }
    );
  }

  const rawEmail = typeof body.email === 'string' ? body.email.trim() : '';
  if (!rawEmail) {
    return NextResponse.json(
      { error: '이메일을 입력해주세요.' },
      { status: 400 }
    );
  }
  if (!EMAIL_REGEX.test(rawEmail)) {
    return NextResponse.json(
      { error: '올바른 이메일 형식이 아닙니다.' },
      { status: 400 }
    );
  }

  const email = rawEmail.toLowerCase();
  const supabase = await createClient();

  const { error } = await supabase.from('waitlist').insert({ email });

  if (error) {
    // Postgres unique_violation
    if (error.code === '23505') {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: '등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
