/**
 * 분석 호출별 모델 라우팅 설정.
 *
 * 환경변수로 덮어쓸 수 있어서 Haiku 품질 이슈 시 Sonnet으로 즉시 전환 가능.
 * 기본값:
 * - RUN_ANALYSIS_FULL: Sonnet — 핵심 가치 (뉘앙스/번역 품질)
 * - 그 외 모두 Haiku — 경량/구조화 작업
 */
export const ANALYSIS_MODELS = {
  RUN_ANALYSIS_FULL: process.env.MODEL_RUN_ANALYSIS || 'claude-sonnet-4-20250514',
  RUN_ANALYSIS_LIGHT: process.env.MODEL_RUN_ANALYSIS_LIGHT || 'claude-haiku-4-5-20251001',
  SESSION_COMPARISON: process.env.MODEL_SESSION_COMPARISON || 'claude-haiku-4-5-20251001',
  EXTRACT_FEATURES: process.env.MODEL_EXTRACT_FEATURES || 'claude-haiku-4-5-20251001',
  ASSESS_FEATURES: process.env.MODEL_ASSESS_FEATURES || 'claude-haiku-4-5-20251001',
} as const;
