import type { Project } from '@/src/lib/mock-data';

interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  agent_status: 'connected' | 'disconnected';
  agent_last_seen: string | null;
  agent_path: string | null;
  created_at: string;
  updated_at: string;
}

/** DB Row → 프론트엔드 Project 타입 변환 */
function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    agentStatus: row.agent_status,
    lastAnalysis: row.agent_last_seen
      ? formatRelativeTime(row.agent_last_seen)
      : undefined,
    issueCount: { critical: 0, warning: 0, info: 0 },
    implementationRate: 0,
    createdAt: row.created_at.slice(0, 10),
  };
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

/** 프로젝트 목록 조회 */
export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch('/api/projects');
  if (!res.ok) {
    throw new Error('프로젝트 목록을 불러올 수 없습니다');
  }
  const rows: ProjectRow[] = await res.json();
  return rows.map(toProject);
}

/** 프로젝트 생성 */
export async function createProject(name: string): Promise<Project> {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || '프로젝트 생성에 실패했습니다');
  }
  const row: ProjectRow = await res.json();
  return toProject(row);
}

/** 프로젝트 이름 수정 */
export async function updateProject(id: string, name: string): Promise<Project> {
  const res = await fetch(`/api/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || '프로젝트 수정에 실패했습니다');
  }
  const row: ProjectRow = await res.json();
  return toProject(row);
}

/** 프로젝트 삭제 */
export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`/api/projects/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || '프로젝트 삭제에 실패했습니다');
  }
}
