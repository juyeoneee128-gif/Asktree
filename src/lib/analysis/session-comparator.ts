import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';
import { callClaude } from './claude-client';
import { ANALYSIS_MODELS } from './models';
import {
  ANALYSIS_RESULT_TOOL,
  buildSessionComparisonSystem,
  buildSessionComparisonMessage,
} from './prompts';
import type { AnalysisMode } from './prompts';
import { parseAnalysisResponse } from './parse-response';
import type { AnalysisResult } from './parse-response';
import {
  applyMaskingToDiffs,
  maskSensitiveData,
} from '../security/mask-sensitive';

function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface DiffItem {
  file_path: string;
  diff_content: string;
}

interface SessionComparisonInput {
  projectId: string;
  currentSessionId: string;
  currentDiffs: DiffItem[];
}

interface SessionComparisonOptions {
  /** BYOK 키 — 있으면 유저 키로 호출, 크레딧 미차감. */
  apiKey?: string;
}

/**
 * 현재 세션과 이전 세션을 비교 분석합니다.
 * 이전 세션이 없거나 겹치는 파일이 없으면 빈 결과를 반환합니다.
 */
export async function analyzeSessionDiff(
  input: SessionComparisonInput,
  mode: AnalysisMode = 'full',
  options: SessionComparisonOptions = {}
): Promise<AnalysisResult> {
  const supabase = createAdminClient();

  // 현재 세션 조회
  const { data: currentSession } = await supabase
    .from('sessions')
    .select('number, title, summary, changed_files')
    .eq('id', input.currentSessionId)
    .single();

  if (!currentSession) {
    return { issues: [], tokenUsage: { input: 0, output: 0 }, warnings: ['Current session not found'] };
  }

  // 이전 세션 조회 (같은 프로젝트, number - 1)
  const { data: prevSession } = await supabase
    .from('sessions')
    .select('title, summary, changed_files')
    .eq('project_id', input.projectId)
    .eq('number', currentSession.number - 1)
    .single();

  if (!prevSession) {
    return { issues: [], tokenUsage: { input: 0, output: 0 }, warnings: ['No previous session to compare'] };
  }

  // 변경 파일 교집합 계산
  const prevFiles = toStringArray(prevSession.changed_files);
  const currentFiles = toStringArray(currentSession.changed_files);
  const overlapping = currentFiles.filter((f) => prevFiles.includes(f));

  if (overlapping.length === 0) {
    return { issues: [], tokenUsage: { input: 0, output: 0 }, warnings: ['No overlapping files between sessions'] };
  }

  // 교집합에 해당하는 diff만 필터
  const overlappingDiffs = input.currentDiffs.filter((d) =>
    overlapping.includes(d.file_path)
  );

  if (overlappingDiffs.length === 0) {
    return { issues: [], tokenUsage: { input: 0, output: 0 }, warnings: ['No diffs for overlapping files'] };
  }

  // 보안: LLM 전송 직전 민감 데이터 마스킹 (diff + summary 둘 다)
  const { diffs: maskedDiffs, maskCount: diffMaskCount } =
    applyMaskingToDiffs(overlappingDiffs);
  const prevSummaryMasked = maskSensitiveData(prevSession.summary ?? '');
  const currentSummaryMasked = maskSensitiveData(currentSession.summary ?? '');
  const totalMaskCount =
    diffMaskCount + prevSummaryMasked.maskCount + currentSummaryMasked.maskCount;

  // Claude API 호출
  const diffsText = maskedDiffs
    .map((d) => `--- ${d.file_path} ---\n${d.diff_content}`)
    .join('\n\n');

  const userMessage = buildSessionComparisonMessage({
    prevSessionTitle: prevSession.title,
    prevFilesChanged: prevFiles,
    prevSummary: prevSummaryMasked.masked,
    currentSessionTitle: currentSession.title,
    currentFilesChanged: currentFiles,
    currentSummary: currentSummaryMasked.masked,
    currentDiffs: diffsText,
  });

  const result = await callClaude({
    systemPrompt: buildSessionComparisonSystem(mode),
    userMessage,
    tools: [ANALYSIS_RESULT_TOOL],
    model: ANALYSIS_MODELS.SESSION_COMPARISON,
    apiKey: options.apiKey,
  });

  const parsed = parseAnalysisResponse(result, mode);
  if (totalMaskCount > 0) {
    parsed.warnings.unshift(
      `Security: masked ${totalMaskCount} sensitive value(s) before LLM call`
    );
  }
  return parsed;
}

// ─── 헬퍼 ───

/**
 * JSONB(Json) 타입을 string[]로 변환
 */
function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string');
  }
  return [];
}
