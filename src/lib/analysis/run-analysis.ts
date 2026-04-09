import { getEphemeral, deleteEphemeral } from '../agent/ephemeral';
import { analyzeStatic } from './static-analyzer';
import { analyzeSessionDiff } from './session-comparator';
import { saveDetectedIssues } from './save-issues';
import type { DetectedIssue } from './parse-response';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';
import { checkCredits, deductCredit, InsufficientCreditsError } from '../credits/deduct';

function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface AnalysisRunResult {
  issues_created: number;
  issues_redetected: number;
  total_issues_found: number;
  token_usage: { input: number; output: number };
  warnings: string[];
}

interface DiffItem {
  file_path: string;
  diff_content: string;
}

/**
 * 전체 분석 파이프라인을 실행합니다.
 *
 * 1. ephemeral_data에서 diff 로드
 * 2. 정적 분석 (3-1)
 * 3. 세션 간 비교 (3-2)
 * 4. 이슈 저장 (3-3)
 * 5. ephemeral_data 삭제
 */
export async function runAnalysis(
  projectId: string,
  sessionId: string,
  userId?: string
): Promise<AnalysisRunResult> {
  const warnings: string[] = [];
  let totalInput = 0;
  let totalOutput = 0;

  // 0. 크레딧 확인 (userId가 제공된 경우)
  if (userId) {
    try {
      await checkCredits(userId, 1);
    } catch (err) {
      if (err instanceof InsufficientCreditsError) {
        return {
          issues_created: 0,
          issues_redetected: 0,
          total_issues_found: 0,
          token_usage: { input: 0, output: 0 },
          warnings: [`크레딧이 부족합니다 (잔여: ${err.remaining})`],
        };
      }
      throw err;
    }
  }

  // 1. ephemeral diff 로드 (메모리에 보관 — 분석 중 cron 삭제 대비)
  const ephemeralRows = await getEphemeral(sessionId);
  const diffs: DiffItem[] = [];

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

  if (diffs.length > 0) {
    try {
      const staticResult = await analyzeStatic({
        projectName,
        sessionTitle,
        filesChanged,
        diffs,
      });

      allIssues.push(...staticResult.issues);
      warnings.push(...staticResult.warnings);
      totalInput += staticResult.tokenUsage.input;
      totalOutput += staticResult.tokenUsage.output;
    } catch (err) {
      warnings.push(`Static analysis failed: ${(err as Error).message}`);
    }
  } else {
    warnings.push('No diffs available for static analysis');
  }

  // 3. 세션 간 비교
  if (diffs.length > 0) {
    try {
      const compResult = await analyzeSessionDiff({
        projectId,
        currentSessionId: sessionId,
        currentDiffs: diffs,
      });

      allIssues.push(...compResult.issues);
      warnings.push(...compResult.warnings);
      totalInput += compResult.tokenUsage.input;
      totalOutput += compResult.tokenUsage.output;
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

  // 6. 크레딧 차감 (분석 완료 후, userId가 제공된 경우)
  if (userId && allIssues.length >= 0) {
    try {
      const { remaining } = await deductCredit(userId, 1);
      warnings.push(`크레딧 1 차감 (잔여: ${remaining})`);
    } catch (err) {
      warnings.push(`크레딧 차감 실패: ${(err as Error).message}`);
    }
  }

  return {
    issues_created: saveResult.created,
    issues_redetected: saveResult.redetected,
    total_issues_found: allIssues.length,
    token_usage: { input: totalInput, output: totalOutput },
    warnings,
  };
}
