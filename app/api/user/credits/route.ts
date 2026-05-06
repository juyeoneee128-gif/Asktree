import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { hasUserApiKey } from '@/src/lib/credits/byok';
import { getDailyCountsForUser } from '@/src/lib/credits/daily-limit';
import { DAILY_PUSH_LIMIT } from '@/src/lib/credits/constants';

// GET /api/user/credits — 크레딧 잔여/사용 + BYOK + 일일 카운트 조회
export async function GET() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('credits, total_credits, used_this_month')
    .eq('id', authUser.id)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다' }, { status: 404 });
  }

  const isByok = await hasUserApiKey(authUser.id);
  const dailyCounts = await getDailyCountsForUser(authUser.id);

  return NextResponse.json({
    remaining: user.credits,
    total: user.total_credits,
    used_this_month: user.used_this_month,
    is_byok: isByok,
    daily_counts: dailyCounts.map((d) => ({
      project_id: d.project_id,
      name: d.name,
      count: d.count,
      limit: DAILY_PUSH_LIMIT,
    })),
  });
}
