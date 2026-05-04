// CodeSasu 표준 ESLint 규칙셋 (Option B: agent에서 실행)
//
// 사용자의 로컬 .eslintrc를 무시하고 이 규칙만 적용. 비개발자 사용자가
// ESLint를 직접 설정해두지 않아도 분석이 작동하도록 보장.
//
// 규칙 선정 기준 (5단계 ESLint 통합 계획서):
// - 명백한 버그/보안 패턴만 (no-eval, no-unreachable 등)
// - 타입 추론 불필요한 syntactic 규칙만 (parserOptions.project 무관)
// - Prettier/스타일 영역 제외 (Negative list와 일관)

import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export const ESLINT_FLAT_CONFIG = [
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // 미사용 변수 / 명시적 any — LLM 컨텍스트로만 활용 (직접 이슈 변환 X, 서버에서 필터)
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',

      // 명백한 버그
      'no-unreachable': 'error',
      'no-constant-condition': 'error',
      'no-duplicate-case': 'error',
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-fallthrough': 'error',
      'no-self-compare': 'error',
      'no-unsafe-finally': 'error',

      // 보안
      'no-eval': 'error',
      'no-implied-eval': 'error',

      // 동등성 비교 (null/undefined 체크는 허용)
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
    },
  },
];

// agent/eslint-collector.js가 이 확장자만 분석 대상으로 처리
export const LINTABLE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
