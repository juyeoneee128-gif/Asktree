import type { Guideline } from '@/src/lib/mock-data';

interface GuidelineRow {
  id: string;
  project_id: string;
  source_issue_id: string | null;
  title: string;
  rule: string;
  status: 'unapplied' | 'applied';
  created_at: string;
  updated_at: string;
}

export interface GuidelineCounts {
  total: number;
  unapplied: number;
  applied: number;
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

function toGuideline(row: GuidelineRow): Guideline {
  return {
    id: row.id,
    title: row.title,
    rule: row.rule,
    status: row.status,
    sourceIssueId: row.source_issue_id ?? '',
    detectedAt: formatRelativeTime(row.created_at),
  };
}

export async function fetchGuidelines(
  projectId: string
): Promise<{ guidelines: Guideline[]; counts: GuidelineCounts }> {
  const res = await fetch(`/api/projects/${projectId}/guidelines`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || '가이드라인을 불러올 수 없습니다');
  }
  const data: { guidelines: GuidelineRow[]; counts: GuidelineCounts } = await res.json();
  return {
    guidelines: data.guidelines.map(toGuideline),
    counts: data.counts,
  };
}

export async function patchGuideline(
  projectId: string,
  guidelineId: string,
  status: 'unapplied' | 'applied'
): Promise<Guideline> {
  const res = await fetch(`/api/projects/${projectId}/guidelines/${guidelineId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || '가이드라인 상태 변경에 실패했습니다');
  }
  const data: { success: boolean; guideline: GuidelineRow } = await res.json();
  return toGuideline(data.guideline);
}

export async function deleteGuideline(projectId: string, guidelineId: string): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/guidelines/${guidelineId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || '가이드라인 삭제에 실패했습니다');
  }
}
