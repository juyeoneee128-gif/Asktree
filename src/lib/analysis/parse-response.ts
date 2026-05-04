import type { ClaudeCallResult } from './claude-client';
import type { AnalysisMode } from './prompts';

// ─── 분석 결과 타입 ───

export interface DetectedIssue {
  title: string;
  level: 'critical' | 'warning' | 'info';
  fact: string;
  detail: string;
  fix_command: string;
  file: string;
  basis: string;
  confidence: number;
  start_line: number;
  end_line: number;
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
const REQUIRED_TEXT_FIELDS = ['title', 'level', 'fact', 'detail', 'fix_command', 'file', 'basis'] as const;

export type LevelLimits = Record<DetectedIssue['level'], number>;

export const LEVEL_LIMITS_FULL: LevelLimits = {
  critical: 5,
  warning: 10,
  info: 5,
};

export const LEVEL_LIMITS_PROBLEMS_ONLY: LevelLimits = {
  critical: 3,
  warning: 5,
  info: 0,
};

/**
 * 모드별 레벨 상한을 반환합니다.
 */
export function getLevelLimits(mode: AnalysisMode): LevelLimits {
  return mode === 'problems_only' ? LEVEL_LIMITS_PROBLEMS_ONLY : LEVEL_LIMITS_FULL;
}

/**
 * Claude API 응답에서 DetectedIssue 배열을 추출하고, 레벨별 상한을 적용합니다.
 */
export function parseAnalysisResponse(
  result: ClaudeCallResult,
  mode: AnalysisMode = 'full'
): AnalysisResult {
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

  const { issues: limited, truncationWarnings } = applyLevelLimits(
    issues,
    getLevelLimits(mode)
  );
  warnings.push(...truncationWarnings);

  return { issues: limited, tokenUsage: result.tokenUsage, warnings };
}

/**
 * 개별 이슈의 필수 필드와 값을 검증합니다.
 */
function validateIssue(
  raw: Record<string, unknown>,
  index: number
): { valid: true; issue: DetectedIssue } | { valid: false; error: string } {
  // 텍스트 필드 검증
  for (const field of REQUIRED_TEXT_FIELDS) {
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

  // confidence 검증 (0~1 사이 숫자)
  const confidence = raw.confidence;
  if (typeof confidence !== 'number' || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    return {
      valid: false,
      error: `Issue[${index}]: confidence must be a number between 0 and 1, got "${confidence}"`,
    };
  }

  // start_line / end_line 검증 (양의 정수, end >= start)
  const startLine = raw.start_line;
  const endLine = raw.end_line;
  if (!Number.isInteger(startLine) || (startLine as number) < 1) {
    return {
      valid: false,
      error: `Issue[${index}]: start_line must be an integer >= 1, got "${startLine}"`,
    };
  }
  if (!Number.isInteger(endLine) || (endLine as number) < 1) {
    return {
      valid: false,
      error: `Issue[${index}]: end_line must be an integer >= 1, got "${endLine}"`,
    };
  }
  if ((endLine as number) < (startLine as number)) {
    return {
      valid: false,
      error: `Issue[${index}]: end_line (${endLine}) must be >= start_line (${startLine})`,
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
      confidence: confidence,
      start_line: startLine as number,
      end_line: endLine as number,
    },
  };
}

/**
 * 레벨별 상한을 적용합니다.
 * 같은 레벨 내에서는 confidence 내림차순으로 상위 N개를 유지합니다.
 */
export function applyLevelLimits(
  issues: DetectedIssue[],
  limits: LevelLimits = LEVEL_LIMITS_FULL
): { issues: DetectedIssue[]; truncationWarnings: string[] } {
  const buckets: Record<DetectedIssue['level'], DetectedIssue[]> = {
    critical: [],
    warning: [],
    info: [],
  };

  for (const issue of issues) {
    buckets[issue.level].push(issue);
  }

  const truncationWarnings: string[] = [];
  const result: DetectedIssue[] = [];

  for (const level of ['critical', 'warning', 'info'] as const) {
    const limit = limits[level];
    const bucket = buckets[level];

    if (bucket.length <= limit) {
      result.push(...bucket);
      continue;
    }

    // confidence 내림차순 정렬 후 상위 limit개 유지
    const sorted = [...bucket].sort((a, b) => b.confidence - a.confidence);
    const dropped = bucket.length - limit;
    result.push(...sorted.slice(0, limit));
    truncationWarnings.push(
      `Truncated ${dropped} ${level} issue(s) over limit (${limit})`
    );
  }

  return { issues: result, truncationWarnings };
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
