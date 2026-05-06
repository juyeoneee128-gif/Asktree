/**
 * 크레딧 정책 상수
 */

export const CREDIT_COSTS = {
  PUSH_ANALYSIS: 1,
  MANUAL_ANALYSIS: 2,
} as const;

export const DAILY_PUSH_LIMIT = 15;

/**
 * diff 줄 수가 이 값 미만이면 경량 분석 (Haiku) 모드로 전환.
 * 추가+삭제 라인 합산 기준.
 */
export const SMALL_DIFF_THRESHOLD = 20;

export const SIGNUP_BONUS = 30;
