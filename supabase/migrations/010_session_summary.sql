-- 세션 요약 구조화 — 규칙 기반 파서 결과 저장 (API 호출 없음, 크레딧 0)
--
-- parsed_summary jsonb : SessionSummary 전체 (tool_usage/errors/files_read/prompts_meta)
-- duration_seconds     : 첫 ~ 마지막 timestamp 차이 (정렬/필터 빠름)
-- prompt_count         : user 메시지 수
-- total_tokens         : input + output (cache 제외)

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS parsed_summary jsonb,
  ADD COLUMN IF NOT EXISTS duration_seconds integer,
  ADD COLUMN IF NOT EXISTS prompt_count integer,
  ADD COLUMN IF NOT EXISTS total_tokens integer;

CREATE INDEX IF NOT EXISTS idx_sessions_project_created
  ON public.sessions (project_id, created_at DESC);
