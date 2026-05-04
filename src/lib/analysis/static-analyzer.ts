import { callClaude, estimateTokens } from './claude-client';
import {
  ANALYSIS_RESULT_TOOL,
  buildStaticAnalysisSystem,
  buildStaticAnalysisMessage,
} from './prompts';
import type { AnalysisMode } from './prompts';
import { parseAnalysisResponse, applyLevelLimits, getLevelLimits } from './parse-response';
import type { DetectedIssue, AnalysisResult } from './parse-response';

/**
 * 토큰 예산 구조 — Anthropic Sonnet의 큰 컨텍스트 윈도우 환경에 맞춤.
 *
 * - DIFF_SOFT_LIMIT 이하: 단일 호출 (압축 없음)
 * - DIFF_SOFT_LIMIT ~ DIFF_HARD_LIMIT: 단일 호출 유지 + "Large diff" 정보 경고
 * - DIFF_HARD_LIMIT 초과: 청크 분할 진입 (우선순위 정렬 → CHUNK_TARGET 단위)
 *
 * MAX_INPUT은 sanity ceiling — 초과 시에도 청크 분할로 처리되므로
 * 강제 차단하지 않고 내부 분기에 의존.
 *
 * CONTEXT_LINES_*는 현재 git diff default(3 라인)와 일치 — 직접 조작은
 * 별도 단계(컨텍스트 trim)로 이연. 의도/기준 문서화 목적의 상수.
 */
const TOKEN_BUDGET = {
  MAX_INPUT: 32_000,
  DIFF_SOFT_LIMIT: 10_000,
  DIFF_HARD_LIMIT: 20_000,
  CHUNK_TARGET: 10_000,
  OUTPUT_BUFFER_FULL: 8_192,
  OUTPUT_BUFFER_PROBLEMS_ONLY: 4_096,
  CONTEXT_LINES_BEFORE: 3,
  CONTEXT_LINES_AFTER: 3,
} as const;

const MAX_API_CALLS = 5; // 분할 시 최대 호출 횟수 — 자동 분석 비용 폭주 방지

function getOutputBudget(mode: AnalysisMode): number {
  return mode === 'problems_only'
    ? TOKEN_BUDGET.OUTPUT_BUFFER_PROBLEMS_ONLY
    : TOKEN_BUDGET.OUTPUT_BUFFER_FULL;
}

interface DiffItem {
  file_path: string;
  diff_content: string;
}

interface StaticAnalysisInput {
  projectName: string;
  sessionTitle: string;
  filesChanged: string[];
  diffs: DiffItem[];
}

/**
 * 정적 분석을 수행합니다.
 * diff 크기에 따라 단일 호출 또는 분할 호출합니다.
 */
export async function analyzeStatic(
  input: StaticAnalysisInput,
  mode: AnalysisMode = 'full'
): Promise<AnalysisResult> {
  if (input.diffs.length === 0) {
    return { issues: [], tokenUsage: { input: 0, output: 0 }, warnings: ['No diffs to analyze'] };
  }

  // diff를 하나의 문자열로 합쳐서 크기 확인
  const combinedDiff = formatDiffs(input.diffs);
  const estimatedTokenCount = estimateTokens(combinedDiff);

  // SOFT 이하 → 단일 호출
  // SOFT < x <= HARD → 단일 호출 + 큰 diff 정보 경고
  // HARD 초과 → 청크 분할
  if (estimatedTokenCount <= TOKEN_BUDGET.DIFF_HARD_LIMIT) {
    const result = await callStaticAnalysis(input, combinedDiff, mode);
    if (estimatedTokenCount > TOKEN_BUDGET.DIFF_SOFT_LIMIT) {
      result.warnings.unshift(
        `Large diff: ~${estimatedTokenCount} tokens (soft limit ${TOKEN_BUDGET.DIFF_SOFT_LIMIT}); single-call analysis may have reduced quality`
      );
    }
    return result;
  }

  // 분할 호출: 파일별로 분할
  return await callStaticAnalysisSplit(input, mode);
}

/**
 * 단일 Claude API 호출로 정적 분석
 */
async function callStaticAnalysis(
  input: StaticAnalysisInput,
  diffsText: string,
  mode: AnalysisMode
): Promise<AnalysisResult> {
  const userMessage = buildStaticAnalysisMessage({
    projectName: input.projectName,
    sessionTitle: input.sessionTitle,
    filesChanged: input.filesChanged,
    diffs: diffsText,
  });

  const result = await callClaude({
    systemPrompt: buildStaticAnalysisSystem(mode),
    userMessage,
    tools: [ANALYSIS_RESULT_TOOL],
    maxTokens: getOutputBudget(mode),
  });

  return parseAnalysisResponse(result, mode);
}

/**
 * diff가 큰 경우 파일별로 분할하여 여러 번 호출
 */
async function callStaticAnalysisSplit(
  input: StaticAnalysisInput,
  mode: AnalysisMode
): Promise<AnalysisResult> {
  // ts/tsx 파일 우선 정렬 (코드 파일 우선)
  const sorted = [...input.diffs].sort((a, b) => {
    const aScore = getFilePriority(a.file_path);
    const bScore = getFilePriority(b.file_path);
    return bScore - aScore;
  });

  // 청크 분할: 각 청크가 MAX_DIFF_TOKENS 이내
  const chunks = chunkDiffs(sorted);

  const allIssues: DetectedIssue[] = [];
  const allWarnings: string[] = [];
  let totalInput = 0;
  let totalOutput = 0;
  let callCount = 0;

  for (const chunk of chunks) {
    if (callCount >= MAX_API_CALLS) {
      allWarnings.push(`Reached max API calls (${MAX_API_CALLS}), ${chunks.length - callCount} chunks skipped`);
      break;
    }

    const chunkDiffText = formatDiffs(chunk);
    const chunkFiles = chunk.map((d) => d.file_path);

    const result = await callStaticAnalysis(
      {
        ...input,
        filesChanged: chunkFiles,
      },
      chunkDiffText,
      mode
    );

    allIssues.push(...result.issues);
    allWarnings.push(...result.warnings);
    totalInput += result.tokenUsage.input;
    totalOutput += result.tokenUsage.output;
    callCount++;
  }

  // 중복 제거: 같은 file + 같은 title (confidence 높은 쪽 유지)
  const deduplicated = deduplicateIssues(allIssues);

  // 분할 호출 결과 합산 후 다시 한 번 레벨별 상한 적용
  // (각 청크별로 이미 상한이 걸려있어도 합치면 다시 초과할 수 있음)
  const { issues: limited, truncationWarnings } = applyLevelLimits(
    deduplicated,
    getLevelLimits(mode)
  );
  allWarnings.push(...truncationWarnings);

  return {
    issues: limited,
    tokenUsage: { input: totalInput, output: totalOutput },
    warnings: allWarnings,
  };
}

// ─── 헬퍼 ───

function formatDiffs(diffs: DiffItem[]): string {
  return diffs
    .map((d) => `--- ${d.file_path} ---\n${d.diff_content}`)
    .join('\n\n');
}

function getFilePriority(filePath: string): number {
  if (/\.(ts|tsx)$/.test(filePath)) return 3;
  if (/\.(js|jsx)$/.test(filePath)) return 2;
  if (/\.(json|sql|env)/.test(filePath)) return 1;
  return 0;
}

function chunkDiffs(diffs: DiffItem[]): DiffItem[][] {
  const chunks: DiffItem[][] = [];
  let current: DiffItem[] = [];
  let currentTokens = 0;

  for (const diff of diffs) {
    const tokens = estimateTokens(diff.diff_content);

    if (currentTokens + tokens > TOKEN_BUDGET.CHUNK_TARGET && current.length > 0) {
      chunks.push(current);
      current = [];
      currentTokens = 0;
    }

    current.push(diff);
    currentTokens += tokens;
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks;
}

function deduplicateIssues(issues: DetectedIssue[]): DetectedIssue[] {
  // 같은 (file, title) 키에서 confidence가 더 높은 이슈를 유지
  const byKey = new Map<string, DetectedIssue>();

  for (const issue of issues) {
    const key = `${issue.file}::${issue.title}`;
    const existing = byKey.get(key);
    if (!existing || issue.confidence > existing.confidence) {
      byKey.set(key, issue);
    }
  }

  return Array.from(byKey.values());
}
