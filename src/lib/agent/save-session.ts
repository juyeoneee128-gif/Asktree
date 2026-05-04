import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';
import type { ParsedSession } from './parse-session';

function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface SavedSession {
  id: string;
  project_id: string;
  number: number;
  title: string;
  external_session_id: string | null;
}

/**
 * ParsedSession → sessions INSERT 페이로드 빌더.
 *
 * **컬럼명 교차 매핑 주의** — 직관에 반대됨:
 * - DB `changed_files` (jsonb)        ← ParsedSession.files_changed (string[])  // 파일 경로 배열
 * - DB `files_changed` (integer)      ← ParsedSession.changed_files (number)    // 카운트
 *
 * 이 교차는 history적 사유로 굳어진 것 — 컬럼명을 바꾸면 backward compat 깨짐.
 * 신규 코드는 ParsedSession 필드명을 진실 소스로 보고, 이 함수에서만 매핑.
 */
function buildInsertRow(
  projectId: string,
  number: number,
  parsed: ParsedSession
): Database['public']['Tables']['sessions']['Insert'] {
  return {
    project_id: projectId,
    number,
    title: parsed.title,
    summary: parsed.summary,
    raw_log: parsed.raw_log,
    files_changed: parsed.changed_files, //  카운트 → DB integer 컬럼
    changed_files:                         // 경로 배열 → DB jsonb 컬럼
      parsed.files_changed as unknown as Database['public']['Tables']['sessions']['Insert']['changed_files'],
    prompts: parsed.prompts as unknown as Database['public']['Tables']['sessions']['Insert']['prompts'],
    external_session_id: parsed.session_id_from_log,
    // 신규: 정렬/필터용 컬럼 + 구조화 jsonb (parsed_summary는 상세 응답에서만 노출)
    duration_seconds: parsed.duration_seconds,
    prompt_count: parsed.prompt_count,
    total_tokens: parsed.total_tokens,
    parsed_summary: {
      files_read: parsed.files_read,
      tool_usage: parsed.tool_usage,
      errors: parsed.errors,
      prompts_meta: parsed.prompts_meta,
    } as unknown as Database['public']['Tables']['sessions']['Insert']['parsed_summary'],
  };
}

/**
 * 파싱된 세션을 DB에 저장합니다.
 * 중복 감지: external_session_id (JSONL 내 sessionId)가 같으면 409.
 */
export async function saveSession(
  projectId: string,
  parsed: ParsedSession
): Promise<{ saved: SavedSession } | { duplicate: true; existing_session_id: string }> {
  const supabase = createAdminClient();

  // 중복 감지
  if (parsed.session_id_from_log) {
    const { data: existing } = await supabase
      .from('sessions')
      .select('id')
      .eq('project_id', projectId)
      .eq('external_session_id', parsed.session_id_from_log)
      .single();

    if (existing) {
      return { duplicate: true, existing_session_id: existing.id };
    }
  }

  // 세션 번호 채번
  const { data: maxRow } = await supabase
    .from('sessions')
    .select('number')
    .eq('project_id', projectId)
    .order('number', { ascending: false })
    .limit(1)
    .single();

  const nextNumber = (maxRow?.number ?? 0) + 1;

  // INSERT
  const { data, error } = await supabase
    .from('sessions')
    .insert(buildInsertRow(projectId, nextNumber, parsed))
    .select('id, project_id, number, title, external_session_id')
    .single();

  if (error) {
    // unique constraint 충돌 (race condition) → 1회 재시도
    if (error.code === '23505' && error.message.includes('number')) {
      const { data: retryMax } = await supabase
        .from('sessions')
        .select('number')
        .eq('project_id', projectId)
        .order('number', { ascending: false })
        .limit(1)
        .single();

      const retryNumber = (retryMax?.number ?? 0) + 1;

      const { data: retryData, error: retryError } = await supabase
        .from('sessions')
        .insert(buildInsertRow(projectId, retryNumber, parsed))
        .select('id, project_id, number, title, external_session_id')
        .single();

      if (retryError) {
        throw new Error(`Failed to save session after retry: ${retryError.message}`);
      }

      return { saved: retryData as SavedSession };
    }

    throw new Error(`Failed to save session: ${error.message}`);
  }

  return { saved: data as SavedSession };
}

/**
 * 세션의 changed_files에 추가 파일 경로를 병합합니다.
 * push 시 에이전트가 보낸 diff의 file_path를 반영하기 위해 사용합니다.
 */
export async function mergeChangedFiles(
  sessionId: string,
  extraFiles: string[]
): Promise<void> {
  if (extraFiles.length === 0) return;

  const supabase = createAdminClient();

  const { data: session } = await supabase
    .from('sessions')
    .select('changed_files')
    .eq('id', sessionId)
    .single();

  const existing = Array.isArray(session?.changed_files)
    ? (session.changed_files as string[])
    : [];

  const merged = [...new Set([...existing, ...extraFiles])].sort();

  await supabase
    .from('sessions')
    .update({
      changed_files: merged as unknown as Database['public']['Tables']['sessions']['Update']['changed_files'],
      files_changed: merged.length,
    })
    .eq('id', sessionId);
}

/**
 * 프로젝트의 에이전트 상태를 업데이트합니다.
 */
export async function updateAgentStatus(projectId: string): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from('projects')
    .update({
      agent_status: 'connected',
      agent_last_seen: new Date().toISOString(),
    })
    .eq('id', projectId);
}
