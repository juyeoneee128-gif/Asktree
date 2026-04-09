import type { ClaudeCallResult } from './claude-client';

// ─── 분석 결과 타입 ───

export interface DetectedIssue {
  title: string;
  level: 'critical' | 'warning' | 'info';
  fact: string;
  detail: string;
  fix_command: string;
  file: string;
  basis: string;
}

export interface AnalysisResult {
  issues: DetectedIssue[];
  tokenUsage: { input: number; output: number };
  warnings: string[];
}

// ─── 보호 규칙 결과 타입 ───

export interface GeneratedGuideline {
  title: string;
  rule: string;
}

// ─── 분석 응답 파싱 ───

const VALID_LEVELS = new Set(['critical', 'warning', 'info']);
const REQUIRED_ISSUE_FIELDS = ['title', 'level', 'fact', 'detail', 'fix_command', 'file', 'basis'] as const;

/**
 * Claude API 응답에서 DetectedIssue 배열을 추출합니다.
 */
export function parseAnalysisResponse(result: ClaudeCallResult): AnalysisResult {
  const warnings: string[] = [];
  const issues: DetectedIssue[] = [];

  if (result.toolInputs.length === 0) {
    warnings.push('Claude did not call the analysis tool');
    return { issues: [], tokenUsage: result.tokenUsage, warnings };
  }

  for (const input of result.toolInputs) {
    const rawIssues = input.issues;

    if (!Array.isArray(rawIssues)) {
      warnings.push('issues field is not an array');
      continue;
    }

    for (let i = 0; i < rawIssues.length; i++) {
      const raw = rawIssues[i] as Record<string, unknown>;
      const validation = validateIssue(raw, i);

      if (validation.valid) {
        issues.push(validation.issue);
      } else {
        warnings.push(validation.error);
      }
    }
  }

  return { issues, tokenUsage: result.tokenUsage, warnings };
}

/**
 * 개별 이슈의 필수 필드와 값을 검증합니다.
 */
function validateIssue(
  raw: Record<string, unknown>,
  index: number
): { valid: true; issue: DetectedIssue } | { valid: false; error: string } {
  // 필수 필드 존재 확인
  for (const field of REQUIRED_ISSUE_FIELDS) {
    if (!raw[field] || typeof raw[field] !== 'string') {
      return {
        valid: false,
        error: `Issue[${index}]: missing or invalid field "${field}"`,
      };
    }
  }

  // level 값 검증
  if (!VALID_LEVELS.has(raw.level as string)) {
    return {
      valid: false,
      error: `Issue[${index}]: invalid level "${raw.level}"`,
    };
  }

  return {
    valid: true,
    issue: {
      title: raw.title as string,
      level: raw.level as DetectedIssue['level'],
      fact: raw.fact as string,
      detail: raw.detail as string,
      fix_command: raw.fix_command as string,
      file: raw.file as string,
      basis: raw.basis as string,
    },
  };
}

/**
 * Claude API 응답에서 보호 규칙을 추출합니다.
 */
export function parseGuidelineResponse(
  result: ClaudeCallResult
): GeneratedGuideline | null {
  if (result.toolInputs.length === 0) return null;

  const input = result.toolInputs[0];
  const title = input.title;
  const rule = input.rule;

  if (typeof title !== 'string' || typeof rule !== 'string') return null;
  if (title.trim().length === 0 || rule.trim().length === 0) return null;

  return { title: title.trim(), rule: rule.trim() };
}
