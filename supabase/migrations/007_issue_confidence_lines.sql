-- Tier 3 고도화: 이슈 신뢰도 + 라인 위치 컬럼 추가
-- confidence: 0.0~1.0. 모델이 보고한 이슈의 확신도. 0.7 미만은 FE에서 "불확실" 태그 표시.
-- start_line/end_line: diff 새 파일 기준 라인 범위. 그룹 이슈는 대표 파일 기준.
-- 모두 nullable — 기존 행은 NULL 유지(측정 안 됨), 신규 INSERT부터 채워짐.

ALTER TABLE public.issues
  ADD COLUMN confidence numeric(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  ADD COLUMN start_line integer CHECK (start_line >= 1),
  ADD COLUMN end_line integer CHECK (end_line >= 1);

-- end_line >= start_line 제약은 둘 다 NULL 가능성이 있어 별도 CHECK로 분리
ALTER TABLE public.issues
  ADD CONSTRAINT issues_line_range_valid
  CHECK (end_line IS NULL OR start_line IS NULL OR end_line >= start_line);
