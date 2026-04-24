import type { Session } from '@/src/lib/mock-data';

interface SessionRowBase {
  id: string;
  number: number;
  title: string;
  summary: string | null;
  files_changed: number;
  changed_files: unknown;
  prompts: unknown;
  created_at: string;
  updated_at: string;
}

interface SessionRowDetail extends SessionRowBase {
  project_id: string;
  raw_log: string | null;
  external_session_id: string | null;
}

function formatDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '.');
}

function normalizeChangedFiles(
  raw: unknown
): { name: string; type: 'new' | 'modified' }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (typeof entry === 'string') {
        return { name: entry, type: 'modified' as const };
      }
      if (
        entry &&
        typeof entry === 'object' &&
        'name' in entry &&
        typeof (entry as { name: unknown }).name === 'string'
      ) {
        const obj = entry as { name: string; type?: string };
        const type = obj.type === 'new' ? 'new' : 'modified';
        return { name: obj.name, type };
      }
      return null;
    })
    .filter((x): x is { name: string; type: 'new' | 'modified' } => x !== null);
}

function normalizePrompts(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string');
}

function toSession(row: SessionRowBase): Session {
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    date: formatDate(row.created_at),
    filesChanged: row.files_changed,
    toolUseCount: 0, // DB에 컬럼 없음 — 필요 시 raw_log 파싱
    summary: row.summary ?? '',
    changedFiles: normalizeChangedFiles(row.changed_files),
    prompts: normalizePrompts(row.prompts),
    log: [], // raw_log는 별도 반환
  };
}

export async function fetchSessions(projectId: string): Promise<Session[]> {
  const res = await fetch(`/api/projects/${projectId}/sessions`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || '세션 목록을 불러올 수 없습니다');
  }
  const data: { sessions: SessionRowBase[] } = await res.json();
  return data.sessions.map(toSession);
}

export async function fetchSession(
  projectId: string,
  sessionId: string
): Promise<{ session: Session; rawLog: string }> {
  const res = await fetch(`/api/projects/${projectId}/sessions/${sessionId}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || '세션을 불러올 수 없습니다');
  }
  const row: SessionRowDetail = await res.json();
  return {
    session: toSession(row),
    rawLog: row.raw_log ?? '',
  };
}
