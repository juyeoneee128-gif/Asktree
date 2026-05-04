import type { Issue, IssueStatus } from '@/src/lib/mock-data';

interface IssueRow {
  id: string;
  project_id: string;
  session_id: string | null;
  title: string;
  level: 'critical' | 'warning' | 'info';
  status: IssueStatus;
  fact: string;
  detail: string;
  fix_command: string;
  file: string | null;
  basis: string;
  is_redetected: boolean;
  confidence: number | null;
  start_line: number | null;
  end_line: number | null;
  detected_at: string;
  confirmed_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IssueCounts {
  total: number;
  by_status: { unconfirmed: number; confirmed: number; resolved: number };
  by_level: { critical: number; warning: number; info: number };
}

export interface GuidelineSuggestion {
  guideline_id: string;
  title: string;
  rule: string;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

function toIssue(row: IssueRow): Issue {
  return {
    id: row.id,
    title: row.title,
    level: row.level,
    status: row.status,
    fact: row.fact,
    detail: row.detail,
    fixCommand: row.fix_command,
    file: row.file ?? '',
    basis: row.basis,
    detectedAt: formatRelativeTime(row.detected_at),
    isRedetected: row.is_redetected || undefined,
    confidence: row.confidence ?? undefined,
    startLine: row.start_line ?? undefined,
    endLine: row.end_line ?? undefined,
  };
}

export async function fetchIssues(projectId: string): Promise<{ issues: Issue[]; counts: IssueCounts }> {
  const res = await fetch(`/api/projects/${projectId}/issues`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || '이슈 목록을 불러올 수 없습니다');
  }
  const data: { issues: IssueRow[]; counts: IssueCounts } = await res.json();
  return {
    issues: data.issues.map(toIssue),
    counts: data.counts,
  };
}

export async function patchIssue(
  projectId: string,
  issueId: string,
  status: 'confirmed' | 'resolved'
): Promise<{ issue: Issue; guideline_suggestion: GuidelineSuggestion | null }> {
  const res = await fetch(`/api/projects/${projectId}/issues/${issueId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || '이슈 상태 변경에 실패했습니다');
  }
  const data: {
    success: boolean;
    issue: IssueRow;
    guideline_suggestion: GuidelineSuggestion | null;
  } = await res.json();
  return {
    issue: toIssue(data.issue),
    guideline_suggestion: data.guideline_suggestion,
  };
}
