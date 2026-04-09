import { callClaude, estimateTokens } from './claude-client';
import {
  ANALYSIS_RESULT_TOOL,
  STATIC_ANALYSIS_SYSTEM,
  buildStaticAnalysisMessage,
} from './prompts';
import { parseAnalysisResponse } from './parse-response';
import type { DetectedIssue, AnalysisResult } from './parse-response';

const MAX_DIFF_TOKENS = 12_000; // ~50KB, 단일 호출 상한
const MAX_API_CALLS = 5;        // 분할 시 최대 호출 횟수

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
  input: StaticAnalysisInput
): Promise<AnalysisResult> {
  if (input.diffs.length === 0) {
    return { issues: [], tokenUsage: { input: 0, output: 0 }, warnings: ['No diffs to analyze'] };
  }

  // diff를 하나의 문자열로 합쳐서 크기 확인
  const combinedDiff = formatDiffs(input.diffs);
  const estimatedTokenCount = estimateTokens(combinedDiff);

  if (estimatedTokenCount <= MAX_DIFF_TOKENS) {
    // 단일 호출
    return await callStaticAnalysis(input, combinedDiff);
  }

  // 분할 호출: 파일별로 분할
  return await callStaticAnalysisSplit(input);
}

/**
 * 단일 Claude API 호출로 정적 분석
 */
async function callStaticAnalysis(
  input: StaticAnalysisInput,
  diffsText: string
): Promise<AnalysisResult> {
  const userMessage = buildStaticAnalysisMessage({
    projectName: input.projectName,
    sessionTitle: input.sessionTitle,
    filesChanged: input.filesChanged,
    diffs: diffsText,
  });

  const result = await callClaude({
    systemPrompt: STATIC_ANALYSIS_SYSTEM,
    userMessage,
    tools: [ANALYSIS_RESULT_TOOL],
  });

  return parseAnalysisResponse(result);
}

/**
 * diff가 큰 경우 파일별로 분할하여 여러 번 호출
 */
async function callStaticAnalysisSplit(
  input: StaticAnalysisInput
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
      chunkDiffText
    );

    allIssues.push(...result.issues);
    allWarnings.push(...result.warnings);
    totalInput += result.tokenUsage.input;
    totalOutput += result.tokenUsage.output;
    callCount++;
  }

  // 중복 제거: 같은 file + 같은 title
  const deduplicated = deduplicateIssues(allIssues);

  return {
    issues: deduplicated,
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

    if (currentTokens + tokens > MAX_DIFF_TOKENS && current.length > 0) {
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
  const seen = new Set<string>();
  const result: DetectedIssue[] = [];

  for (const issue of issues) {
    const key = `${issue.file}::${issue.title}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(issue);
    }
  }

  return result;
}
