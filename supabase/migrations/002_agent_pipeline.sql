-- Tier 2: 데이터 수집 파이프라인
-- agent_token, external_session_id, ephemeral_data

-- ─── 1. projects 테이블에 agent_token 추가 ───
ALTER TABLE public.projects
  ADD COLUMN agent_token UUID DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX idx_projects_agent_token
  ON public.projects (agent_token);

-- ─── 2. sessions 테이블에 external_session_id 추가 (중복 감지) ───
ALTER TABLE public.sessions
  ADD COLUMN external_session_id TEXT;

CREATE UNIQUE INDEX idx_sessions_external
  ON public.sessions (project_id, external_session_id)
  WHERE external_session_id IS NOT NULL;

-- ─── 3. ephemeral_data 테이블 ───
CREATE TABLE public.ephemeral_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL CHECK (data_type IN ('file_tree', 'diff')),
  content JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 hour'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ephemeral_expires ON public.ephemeral_data (expires_at);
CREATE INDEX idx_ephemeral_session ON public.ephemeral_data (session_id);

-- ─── 4. ephemeral_data RLS (service_role 전용) ───
ALTER TABLE public.ephemeral_data ENABLE ROW LEVEL SECURITY;

-- 일반 사용자 접근 차단, service_role_key로만 접근
CREATE POLICY "Service role only" ON public.ephemeral_data
  FOR ALL USING (false);
