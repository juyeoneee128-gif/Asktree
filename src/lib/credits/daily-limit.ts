import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';

function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * 오늘(UTC) 기준 date 문자열 (YYYY-MM-DD).
 */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 오늘자 카운트를 조회합니다. row가 없으면 0.
 */
export async function getDailyCount(projectId: string): Promise<number> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('daily_analysis_count')
    .select('count')
    .eq('project_id', projectId)
    .eq('date', todayUtc())
    .maybeSingle();

  return data?.count ?? 0;
}

/**
 * 일일 카운트를 1 증가시킵니다. row가 없으면 1로 INSERT.
 * 반환: 증가 후 카운트.
 *
 * UPSERT는 (project_id, date) PK 충돌 시 count = count + 1로 갱신.
 * Postgres의 EXCLUDED를 활용한 UPDATE 절이 필요하므로 raw 쿼리 대신
 * 2단계 시도(insert → conflict 시 update)로 구현.
 */
export async function incrementDailyCount(projectId: string): Promise<number> {
  const supabase = createAdminClient();
  const date = todayUtc();

  // INSERT 시도 — 충돌 시 fallback
  const { error: insertError } = await supabase
    .from('daily_analysis_count')
    .insert({ project_id: projectId, date, count: 1 });

  if (!insertError) return 1;

  // 23505 = unique_violation (PK 중복) → 기존 row의 count++
  // PostgREST는 code 직접 노출 안 하므로 message로 분기.
  // 그 외 에러는 throw.
  if (!insertError.message.includes('duplicate') && insertError.code !== '23505') {
    throw new Error(`incrementDailyCount insert failed: ${insertError.message}`);
  }

  // 현재 값 + 1로 update
  const { data: current, error: selectError } = await supabase
    .from('daily_analysis_count')
    .select('count')
    .eq('project_id', projectId)
    .eq('date', date)
    .single();

  if (selectError || !current) {
    throw new Error(`incrementDailyCount select failed: ${selectError?.message}`);
  }

  const next = current.count + 1;
  const { error: updateError } = await supabase
    .from('daily_analysis_count')
    .update({ count: next })
    .eq('project_id', projectId)
    .eq('date', date);

  if (updateError) {
    throw new Error(`incrementDailyCount update failed: ${updateError.message}`);
  }

  return next;
}

/**
 * 일일 상한 도달 여부. count >= limit 이면 true.
 */
export async function checkDailyLimit(
  projectId: string,
  limit: number
): Promise<boolean> {
  const count = await getDailyCount(projectId);
  return count >= limit;
}

/**
 * 사용자의 모든 프로젝트 오늘자 카운트를 조회합니다.
 */
export async function getDailyCountsForUser(
  userId: string
): Promise<Array<{ project_id: string; name: string; count: number }>> {
  const supabase = createAdminClient();

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('user_id', userId);

  if (!projects || projects.length === 0) return [];

  const date = todayUtc();
  const projectIds = projects.map((p) => p.id);
  const { data: counts } = await supabase
    .from('daily_analysis_count')
    .select('project_id, count')
    .eq('date', date)
    .in('project_id', projectIds);

  const countMap = new Map<string, number>();
  for (const c of counts ?? []) countMap.set(c.project_id, c.count);

  return projects.map((p) => ({
    project_id: p.id,
    name: p.name,
    count: countMap.get(p.id) ?? 0,
  }));
}
