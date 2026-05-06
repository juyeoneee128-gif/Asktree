-- 보안 보강 — HMAC signing_key + RLS 정책 검증/보강
--
-- 1. projects.signing_key — 에이전트 push payload HMAC-SHA256 서명용
--    - 기존 프로젝트는 자동 생성 (gen_random_bytes 32 → hex 64자)
--    - 신규 프로젝트는 default로 자동 생성
--    - 에이전트는 setup 시 dashboard에서 키를 받아 config.env에 저장
--
-- 2. RLS 정책 보강 — IF NOT EXISTS 패턴으로 idempotent
--    - users INSERT/DELETE 명시적 차단 (handle_new_user는 security definer라 영향 없음)
--    - 기존 정책은 유지

-- ─── 1. projects.signing_key ───
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS signing_key text;

-- 기존 NULL 행 자동 채움
UPDATE public.projects
SET signing_key = encode(gen_random_bytes(32), 'hex')
WHERE signing_key IS NULL;

-- 신규 INSERT 시 자동 생성 + NOT NULL 강제
ALTER TABLE public.projects
  ALTER COLUMN signing_key SET DEFAULT encode(gen_random_bytes(32), 'hex'),
  ALTER COLUMN signing_key SET NOT NULL;

-- ─── 2. RLS 보강 ───
-- users 테이블 — INSERT/DELETE 차단 (security definer 트리거는 영향 없음)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Block direct user insert'
  ) THEN
    CREATE POLICY "Block direct user insert" ON public.users
      FOR INSERT WITH CHECK (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Block direct user delete'
  ) THEN
    CREATE POLICY "Block direct user delete" ON public.users
      FOR DELETE USING (false);
  END IF;
END $$;
