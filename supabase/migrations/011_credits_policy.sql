-- 크레딧 정책 — push 1크레딧 / 수동 재분석 2크레딧 / 일일 분석 상한
--
-- credit_usage         : 차감/충전 이력 (감사 + 디버깅)
-- daily_analysis_count : 프로젝트당 하루 push 횟수 (UTC date 자동 리셋)
-- users.credits/total_credits 기본값 10 → 30 (가입 보너스)
--   - 기존 사용자는 보정하지 않음 (이미 사용한 크레딧 복원 비정상)

-- ─── credit_usage ───
CREATE TABLE IF NOT EXISTS public.credit_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  reason text NOT NULL CHECK (reason IN (
    'push_analysis', 'manual_analysis', 'signup_bonus', 'admin_grant'
  )),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_usage_user
  ON public.credit_usage (user_id, created_at DESC);

ALTER TABLE public.credit_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own credit usage" ON public.credit_usage
  FOR SELECT USING (auth.uid() = user_id);

-- ─── daily_analysis_count ───
CREATE TABLE IF NOT EXISTS public.daily_analysis_count (
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, date)
);

ALTER TABLE public.daily_analysis_count ENABLE ROW LEVEL SECURITY;
-- 정책 없음 → service_role만 접근 (RLS는 service_role bypass)

-- ─── 가입 기본값 변경 ───
ALTER TABLE public.users ALTER COLUMN credits SET DEFAULT 30;
ALTER TABLE public.users ALTER COLUMN total_credits SET DEFAULT 30;

-- handle_new_user는 INSERT 시 default 사용 → 자동 30 적용
