-- spec_documents에 agent 자동 수집 + 변경 감지 + soft delete 지원 컬럼 추가
--
-- agent가 docs/*.md를 push할 때마다 path 기반 upsert. content_hash로 변경 감지하여
-- 변경된 파일만 기능 추출 재실행 (크레딧 절감).
-- source 컬럼으로 manual 업로드와 agent 수집을 구분 — 같이 보임, 향후 FE에서 분기.

ALTER TABLE public.spec_documents
  ADD COLUMN content text,                              -- markdown 본문 (변경 감지용)
  ADD COLUMN content_hash text,                         -- SHA-256 hex (64자)
  ADD COLUMN path text,                                 -- 'docs/prd_v3.md' (agent 수집 시)
  ADD COLUMN source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'agent')),
  ADD COLUMN modified_at timestamptz,                   -- 파일 mtime (agent 수집 시)
  ADD COLUMN deleted_at timestamptz;                    -- soft delete

-- agent 수집 row의 upsert 키 — 같은 프로젝트 내 같은 경로는 1건만 active
CREATE UNIQUE INDEX idx_spec_documents_agent_path
  ON public.spec_documents (project_id, path)
  WHERE source = 'agent' AND deleted_at IS NULL;

-- 빠른 active 조회 (deleted 제외)
CREATE INDEX idx_spec_documents_active
  ON public.spec_documents (project_id, deleted_at)
  WHERE deleted_at IS NULL;
