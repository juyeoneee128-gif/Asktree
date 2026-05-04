import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';
import type { DocFile } from '../agent/validate-payload';

function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface DocSyncOutcome {
  document_id: string;
  path: string;
  type: 'FRD' | 'PRD';
  content: string;
  reason: 'inserted' | 'updated';
}

export interface SyncAgentDocsResult {
  changed: DocSyncOutcome[];   // 신규 + 본문 변경 — extract 재실행 대상
  unchanged_count: number;     // 동일 hash로 skip된 doc 수
  deleted_count: number;       // soft delete된 doc 수 (이전엔 있었으나 이번 push에 없음)
  errors: string[];
}

/**
 * 에이전트가 수집한 docs/*.md를 spec_documents에 동기화합니다.
 *
 * - SHA-256 hash로 변경 감지 → 변경된 doc만 changed[]에 포함 (extract 재실행 대상)
 * - manual 업로드 row는 source 컬럼으로 분리되어 영향받지 않음
 * - 이전 push에 있었으나 이번엔 없는 agent 수집 doc은 soft delete (deleted_at)
 * - 본문 변경 시 기존 spec_features는 cascade 삭제 (새 추출이 곧 INSERT)
 */
export async function syncAgentDocs(
  projectId: string,
  docFiles: DocFile[]
): Promise<SyncAgentDocsResult> {
  const supabase = createAdminClient();
  const errors: string[] = [];
  const changed: DocSyncOutcome[] = [];
  let unchangedCount = 0;
  let deletedCount = 0;

  // 1. 현재 active한 agent-source doc 조회 (path별 lookup용)
  const { data: existing, error: queryError } = await supabase
    .from('spec_documents')
    .select('id, path, content_hash, type')
    .eq('project_id', projectId)
    .eq('source', 'agent')
    .is('deleted_at', null);

  if (queryError) {
    return {
      changed: [],
      unchanged_count: 0,
      deleted_count: 0,
      errors: [`Failed to load existing agent docs: ${queryError.message}`],
    };
  }

  const byPath = new Map<string, { id: string; content_hash: string | null; type: 'FRD' | 'PRD' }>();
  for (const row of existing ?? []) {
    if (row.path) {
      byPath.set(row.path, { id: row.id, content_hash: row.content_hash, type: row.type });
    }
  }

  // 2. payload의 각 doc 처리 — 신규/변경/동일 분기
  const incomingPaths = new Set<string>();
  for (const doc of docFiles) {
    incomingPaths.add(doc.path);
    const hash = sha256(doc.content);
    const docType = inferDocType(doc.path);
    const existingDoc = byPath.get(doc.path);

    if (!existingDoc) {
      // 신규 — INSERT
      const { data: inserted, error: insertError } = await supabase
        .from('spec_documents')
        .insert({
          project_id: projectId,
          name: docNameFromPath(doc.path),
          type: docType,
          content: doc.content,
          content_hash: hash,
          path: doc.path,
          source: 'agent',
          modified_at: doc.modified_at,
        })
        .select('id')
        .single();

      if (insertError || !inserted) {
        errors.push(`Failed to insert ${doc.path}: ${insertError?.message ?? 'unknown'}`);
        continue;
      }

      changed.push({
        document_id: inserted.id,
        path: doc.path,
        type: docType,
        content: doc.content,
        reason: 'inserted',
      });
      continue;
    }

    if (existingDoc.content_hash === hash) {
      // 동일 — skip
      unchangedCount += 1;
      continue;
    }

    // 본문 변경 — UPDATE + 기존 features cascade 삭제 → 새 추출 대기
    const { error: deleteFeaturesError } = await supabase
      .from('spec_features')
      .delete()
      .eq('document_id', existingDoc.id);

    if (deleteFeaturesError) {
      errors.push(
        `Failed to clear features for ${doc.path}: ${deleteFeaturesError.message}`
      );
      // 그래도 UPDATE는 진행 — features 누락보다 stale 두기가 더 위험
    }

    const { error: updateError } = await supabase
      .from('spec_documents')
      .update({
        content: doc.content,
        content_hash: hash,
        modified_at: doc.modified_at,
        type: docType,
      })
      .eq('id', existingDoc.id);

    if (updateError) {
      errors.push(`Failed to update ${doc.path}: ${updateError.message}`);
      continue;
    }

    changed.push({
      document_id: existingDoc.id,
      path: doc.path,
      type: docType,
      content: doc.content,
      reason: 'updated',
    });
  }

  // 3. 이번 push에 없는 agent doc — soft delete
  for (const [path, existingDoc] of byPath) {
    if (incomingPaths.has(path)) continue;

    const { error: softDeleteError } = await supabase
      .from('spec_documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', existingDoc.id);

    if (softDeleteError) {
      errors.push(`Failed to soft-delete ${path}: ${softDeleteError.message}`);
      continue;
    }

    deletedCount += 1;
  }

  return {
    changed,
    unchanged_count: unchangedCount,
    deleted_count: deletedCount,
    errors,
  };
}

// ─── 헬퍼 ───

function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/**
 * 파일 경로 기반 type 추론.
 * - 'frd_*' 또는 'frd' 포함 → 'FRD'
 * - 그 외 (prd_*, prd 포함, 일반) → 'PRD' (기본)
 *
 * 디렉토리/확장자 제외한 basename에서만 매칭 (대소문자 무관).
 */
export function inferDocType(path: string): 'FRD' | 'PRD' {
  const base = path.split('/').pop() ?? path;
  const noExt = base.replace(/\.md$/i, '').toLowerCase();
  if (/^frd[_-]|frd/.test(noExt)) return 'FRD';
  return 'PRD';
}

function docNameFromPath(path: string): string {
  const base = path.split('/').pop() ?? path;
  return base.replace(/\.md$/i, '');
}
