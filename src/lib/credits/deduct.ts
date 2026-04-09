import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';

function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export class InsufficientCreditsError extends Error {
  remaining: number;

  constructor(remaining: number) {
    super('크레딧이 부족합니다');
    this.name = 'InsufficientCreditsError';
    this.remaining = remaining;
  }
}

/**
 * 크레딧 잔여량을 확인합니다.
 * 부족하면 InsufficientCreditsError를 throw합니다.
 */
export async function checkCredits(userId: string, required: number = 1): Promise<number> {
  const supabase = createAdminClient();

  const { data: user, error } = await supabase
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw new Error(`User not found: ${userId}`);
  }

  if (user.credits < required) {
    throw new InsufficientCreditsError(user.credits);
  }

  return user.credits;
}

/**
 * 크레딧을 차감합니다.
 * 분석 완료 후 호출합니다.
 */
export async function deductCredit(userId: string, amount: number = 1): Promise<{ remaining: number }> {
  const supabase = createAdminClient();

  // 현재 크레딧 조회
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('credits, used_this_month')
    .eq('id', userId)
    .single();

  if (fetchError || !user) {
    throw new Error(`User not found: ${userId}`);
  }

  const newCredits = Math.max(0, user.credits - amount);
  const newUsed = user.used_this_month + amount;

  const { error: updateError } = await supabase
    .from('users')
    .update({
      credits: newCredits,
      used_this_month: newUsed,
    })
    .eq('id', userId);

  if (updateError) {
    throw new Error(`Failed to deduct credit: ${updateError.message}`);
  }

  return { remaining: newCredits };
}

/**
 * 사용자의 크레딧 정보를 조회합니다.
 */
export async function getCreditInfo(userId: string) {
  const supabase = createAdminClient();

  const { data: user, error } = await supabase
    .from('users')
    .select('credits, total_credits, used_this_month')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw new Error(`User not found: ${userId}`);
  }

  return {
    remaining: user.credits,
    total: user.total_credits,
    used_this_month: user.used_this_month,
  };
}
