-- ESLint 통합: 에이전트가 로컬 실행한 ESLint 결과를 ephemeral_data에 저장
-- data_type CHECK 제약에 'eslint' 추가. 기존 'file_tree'/'diff'와 동일한 TTL/RLS 정책 적용.

-- PostgreSQL은 CHECK 제약을 직접 수정할 수 없으므로 drop → add
ALTER TABLE public.ephemeral_data
  DROP CONSTRAINT IF EXISTS ephemeral_data_data_type_check;

ALTER TABLE public.ephemeral_data
  ADD CONSTRAINT ephemeral_data_data_type_check
  CHECK (data_type IN ('file_tree', 'diff', 'eslint'));
