import { getEphemeral, deleteEphemeral } from '../agent/ephemeral';
import { analyzeStatic } from './static-analyzer';
import { analyzeSessionDiff } from './session-comparator';
import { saveDetectedIssues } from './save-issues';
import type { DetectedIssue } from './parse-response';
import type { AnalysisMode } from './prompts';
import type { EslintIssueRaw } from '../agent/validate-payload';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';

function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface AnalysisRunResult {
  mode: AnalysisMode;
  issues_created: number;
  issues_redetected: number;
  total_issues_found: number;
  token_usage: { input: number; output: number };
  warnings: string[];
  /**
   * 토큰 예산 초과 등으로 분석되지 않은 파일 경로 목록.
   * 청크 분할이 발생하지 않은 경우 undefined.
   */
  unprocessed_files?: string[];
}

interface DiffItem {
  file_path: string;
  diff_content: string;
}

export interface RunAnalysisOptions {
  /** true면 정적 분석에 Haiku 모델 사용 (small diff용). 세션 비교는 항상 Haiku. */
  useLightModel?: boolean;
  /** BYOK API 키. 있으면 모든 분석 호출이 유저 키로 실행됨. */
  apiKey?: string;
}

/**
 * 전체 분석 파이프라인을 실행합니다.
 *
 * 1. ephemeral_data에서 diff 로드
 * 2. 정적 분석 (3-1)
 * 3. 세션 간 비교 (3-2)
 * 4. 이슈 저장 (3-3)
 * 5. ephemeral_data 삭제
 *
 * mode:
 * - 'full' (기본값): 13개 카테고리 전체 분석. 수동 재분석 시 사용.
 * - 'problems_only': critical 위주 + 상한 축소. 자동 분석(push) 시 크레딧 절감용.
 */
export async function runAnalysis(
  projectId: string,
  sessionId: string,
  mode: AnalysisMode = 'full',
  options: RunAnalysisOptions = {}
): Promise<AnalysisRunResult> {
  const warnings: string[] = [];
  let totalInput = 0;
  let totalOutput = 0;

  // 1. ephemeral diff + eslint 결과 로드 (메모리에 보관 — 분석 중 cron 삭제 대비)
  const ephemeralRows = await getEphemeral(sessionId);
  const diffs: DiffItem[] = [];
  let eslintResults: EslintIssueRaw[] = [];

  for (const row of ephemeralRows) {
    if (row.data_type === 'diff') {
      const content = row.content as Record<string, unknown>;
      if (
        typeof content.file_path === 'string' &&
        typeof content.diff_content === 'string'
      ) {
        diffs.push({
          file_path: content.file_path,
          diff_content: content.diff_content,
        });
      }
    } else if (row.data_type === 'eslint') {
      // eslint 결과는 단일 row의 content에 배열로 저장됨 (saveEphemeralEslint 참고)
      if (Array.isArray(row.content)) {
        eslintResults = row.content as unknown as EslintIssueRaw[];
      }
    }
  }

  // 프로젝트명 + 세션 정보 조회
  const supabase = createAdminClient();

  const { data: project } = await supabase
    .from('projects')
    .select('name')
    .eq('id', projectId)
    .single();

  const { data: session } = await supabase
    .from('sessions')
    .select('title, changed_files')
    .eq('id', sessionId)
    .single();

  const projectName = project?.name ?? 'Unknown';
  const sessionTitle = session?.title ?? 'Untitled';
  const filesChanged = Array.isArray(session?.changed_files)
    ? (session.changed_files as string[])
    : [];

  // 2. 정적 분석
  const allIssues: DetectedIssue[] = [];
  const unprocessedFiles: string[] = [];

  if (diffs.length > 0 || eslintResults.length > 0) {
    try {
      const staticResult = await analyzeStatic(
        {
          projectName,
          sessionTitle,
          filesChanged,
          diffs,
          eslintResults,
        },
        mode,
        { useLightModel: options.useLightModel, apiKey: options.apiKey }
      );

      allIssues.push(...staticResult.issues);
      warnings.push(...staticResult.warnings);
      totalInput += staticResult.tokenUsage.input;
      totalOutput += staticResult.tokenUsage.output;
      if (staticResult.unprocessed_files) {
        unprocessedFiles.push(...staticResult.unprocessed_files);
      }
    } catch (err) {
      warnings.push(`Static analysis failed: ${(err as Error).message}`);
    }
  } else {
    warnings.push('No diffs available for static analysis');
  }

  // 3. 세션 간 비교
  if (diffs.length > 0) {
    try {
      const compResult = await analyzeSessionDiff(
        {
          projectId,
          currentSessionId: sessionId,
          currentDiffs: diffs,
        },
        mode,
        { apiKey: options.apiKey }
      );

      allIssues.push(...compResult.issues);
      warnings.push(...compResult.warnings);
      totalInput += compResult.tokenUsage.input;
      totalOutput += compResult.tokenUsage.output;
      if (compResult.unprocessed_files) {
        unprocessedFiles.push(...compResult.unprocessed_files);
      }
    } catch (err) {
      warnings.push(`Session comparison failed: ${(err as Error).message}`);
    }
  }

  // 4. 이슈 저장
  const saveResult = await saveDetectedIssues(projectId, sessionId, allIssues);
  warnings.push(...saveResult.warnings);

  // 5. ephemeral 삭제 (분석 완료)
  try {
    await deleteEphemeral(sessionId);
  } catch (err) {
    warnings.push(`Ephemeral cleanup failed: ${(err as Error).message}`);
  }

  // 중복 제거 (정적 분석과 세션 비교가 같은 파일을 동시에 미처리할 수 있음)
  const uniqueUnprocessed = Array.from(new Set(unprocessedFiles));

  return {
    mode,
    issues_created: saveResult.created,
    issues_redetected: saveResult.redetected,
    total_issues_found: allIssues.length,
    token_usage: { input: totalInput, output: totalOutput },
    warnings,
    ...(uniqueUnprocessed.length > 0 ? { unprocessed_files: uniqueUnprocessed } : {}),
  };
}
