import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';
import type { DetectedIssue } from './parse-response';

function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface SaveIssuesResult {
  created: number;
  redetected: number;
  warnings: string[];
}

/**
 * 감지된 이슈를 DB에 저장합니다.
 * 기존 이슈와 (file + title 키워드)가 매칭되면 재감지(is_redetected) 처리합니다.
 */
export async function saveDetectedIssues(
  projectId: string,
  sessionId: string,
  issues: DetectedIssue[]
): Promise<SaveIssuesResult> {
  if (issues.length === 0) {
    return { created: 0, redetected: 0, warnings: [] };
  }

  const supabase = createAdminClient();
  const warnings: string[] = [];
  let created = 0;
  let redetected = 0;

  // 기존 미해결 이슈 조회 (resolved 제외)
  const { data: existingIssues } = await supabase
    .from('issues')
    .select('id, title, file, status')
    .eq('project_id', projectId)
    .in('status', ['unconfirmed', 'confirmed']);

  const existing = existingIssues ?? [];

  for (const issue of issues) {
    // 재감지 매칭: 같은 file + title 키워드 유사
    const match = findMatchingIssue(existing, issue);

    if (match) {
      // 재감지: status → unconfirmed, is_redetected = true, 내용 갱신
      const { error } = await supabase
        .from('issues')
        .update({
          status: 'unconfirmed',
          is_redetected: true,
          fact: issue.fact,
          detail: issue.detail,
          fix_command: issue.fix_command,
          basis: issue.basis,
          confidence: issue.confidence,
          start_line: issue.start_line,
          end_line: issue.end_line,
          detected_at: new Date().toISOString(),
          confirmed_at: null,
        } as any)
        .eq('id', match.id);

      if (error) {
        warnings.push(`Failed to update redetected issue ${match.id}: ${error.message}`);
      } else {
        redetected++;
      }
    } else {
      // 신규 이슈 INSERT
      const { error } = await supabase.from('issues').insert({
        project_id: projectId,
        session_id: sessionId,
        title: issue.title,
        level: issue.level,
        status: 'unconfirmed',
        fact: issue.fact,
        detail: issue.detail,
        fix_command: issue.fix_command,
        file: issue.file,
        basis: issue.basis,
        is_redetected: false,
        confidence: issue.confidence,
        start_line: issue.start_line,
        end_line: issue.end_line,
        detected_at: new Date().toISOString(),
      });

      if (error) {
        warnings.push(`Failed to insert issue "${issue.title}": ${error.message}`);
      } else {
        created++;
      }
    }
  }

  return { created, redetected, warnings };
}

// ─── 재감지 매칭 ───

interface ExistingIssue {
  id: string;
  title: string;
  file: string;
  status: string;
}

/**
 * 기존 이슈와 매칭합니다.
 * 1. file 경로 완전 일치
 * 2. title 키워드 포함 비교 (어느 한 쪽이 다른 쪽을 포함)
 */
function findMatchingIssue(
  existing: ExistingIssue[],
  newIssue: DetectedIssue
): ExistingIssue | null {
  for (const ex of existing) {
    if (ex.file !== newIssue.file) continue;

    const exWords = extractKeywords(ex.title);
    const newWords = extractKeywords(newIssue.title);

    // 키워드 50% 이상 겹치면 매칭
    const overlap = exWords.filter((w) => newWords.includes(w));
    const overlapRatio = overlap.length / Math.min(exWords.length, newWords.length);

    if (overlapRatio >= 0.5) {
      return ex;
    }
  }
  return null;
}

/**
 * 제목에서 키워드 추출 (조사, 공백 제거)
 */
function extractKeywords(title: string): string[] {
  return title
    .replace(/[^가-힣a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}
