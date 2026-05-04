import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/src/lib/supabase/types';
import { extractBearerToken, verifyAgentToken } from '@/src/lib/agent/auth-agent';
import { validatePayload, validatePayloadSize, MAX_PAYLOAD_SIZE } from '@/src/lib/agent/validate-payload';
import { parseSession } from '@/src/lib/agent/parse-session';
import { saveSession, updateAgentStatus, mergeChangedFiles } from '@/src/lib/agent/save-session';
import {
  saveEphemeralDiffs,
  saveEphemeralEslint,
  saveEphemeralFileTree,
  cleanupExpiredEphemeral,
} from '@/src/lib/agent/ephemeral';
import { runAnalysis } from '@/src/lib/analysis/run-analysis';
import { assessFeatures } from '@/src/lib/specs/assess-features';
import { syncAgentDocs } from '@/src/lib/specs/sync-docs';
import { extractFeaturesForDocument } from '@/src/lib/specs/extract-features';

// extract API rate limit 방어용 동시 호출 상한 (사용자 지시: 3개씩 chunking)
const EXTRACT_CONCURRENCY = 3;

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += limit) {
    const chunk = items.slice(i, i + limit);
    await Promise.all(chunk.map(fn));
  }
}

// POST /api/agent/push — 에이전트 데이터 수신
export async function POST(request: Request) {
  // 1. 토큰 추출
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) {
    return NextResponse.json(
      { error: 'Missing or invalid Authorization header' },
      { status: 401 }
    );
  }

  // 2. 페이로드 크기 확인
  const rawBody = await request.text();
  if (!validatePayloadSize(rawBody)) {
    return NextResponse.json(
      { error: 'Payload too large', max_size: `${MAX_PAYLOAD_SIZE / 1024 / 1024}MB` },
      { status: 413 }
    );
  }

  // 3. JSON 파싱
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  // 4. 페이로드 검증
  const validation = validatePayload(body);
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Invalid payload', details: validation.errors },
      { status: 400 }
    );
  }

  const { payload } = validation;

  // 5. 토큰 검증 → project_id 확인
  const authResult = await verifyAgentToken(token);
  if (!authResult) {
    return NextResponse.json(
      { error: 'Invalid agent token' },
      { status: 401 }
    );
  }

  // 토큰의 project_id와 payload의 project_id 일치 확인
  if (authResult.project_id !== payload.project_id) {
    return NextResponse.json(
      { error: 'Agent token does not match project_id' },
      { status: 403 }
    );
  }

  // 6. JSONL 파싱
  let parsed;
  try {
    parsed = parseSession(payload.session_data.jsonl_log);
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to parse JSONL', detail: (err as Error).message },
      { status: 400 }
    );
  }

  // 7. 세션 저장 (중복 감지 포함)
  let saveResult;
  try {
    saveResult = await saveSession(payload.project_id, parsed);
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to save session', detail: (err as Error).message },
      { status: 500 }
    );
  }

  if ('duplicate' in saveResult) {
    return NextResponse.json(
      { error: 'Duplicate session', existing_session_id: saveResult.existing_session_id },
      { status: 409 }
    );
  }

  const { saved } = saveResult;

  // 8. Ephemeral 데이터 저장 (diffs, file_tree, eslint)
  try {
    if (payload.session_data.diffs && payload.session_data.diffs.length > 0) {
      await saveEphemeralDiffs(saved.id, payload.session_data.diffs);
    }
    if (payload.session_data.file_tree && payload.session_data.file_tree.length > 0) {
      await saveEphemeralFileTree(saved.id, payload.session_data.file_tree);
    }
    if (payload.session_data.eslint_results && payload.session_data.eslint_results.length > 0) {
      await saveEphemeralEslint(saved.id, payload.session_data.eslint_results);
    }
  } catch (err) {
    console.error('[push] Ephemeral save failed:', (err as Error).message);
    // ephemeral 저장 실패는 세션 저장에 영향 주지 않음
  }

  // 8.5. diff 파일 경로를 changed_files에 병합
  if (payload.session_data.diffs && payload.session_data.diffs.length > 0) {
    try {
      const diffFiles = payload.session_data.diffs.map((d) => d.file_path);
      await mergeChangedFiles(saved.id, diffFiles);
    } catch (err) {
      console.error('[push] Changed files merge failed:', (err as Error).message);
    }
  }

  // 9. 에이전트 상태 업데이트
  try {
    await updateAgentStatus(payload.project_id);
  } catch (err) {
    console.error('[push] Agent status update failed:', (err as Error).message);
  }

  // 10. 자동 파이프라인 트리거 (비동기, 응답 차단 안 함)
  //   순서: docs sync → 변경된 doc 병렬 extract → runAnalysis(problems_only)
  //         → assessFeatures(features 1건 이상 시).
  //   docs sync는 diffs 없어도 실행 가능 (사용자가 docs만 편집한 세션).
  //   자동 분석은 problems_only 모드, 수동 재분석은 full.
  const hasDiffs = !!(payload.session_data.diffs && payload.session_data.diffs.length > 0);
  const hasDocs = !!(
    payload.session_data.docs_files && payload.session_data.docs_files.length > 0
  );

  if (hasDiffs || hasDocs) {
    (async () => {
      try {
        // 10a. docs sync + 변경된 doc만 병렬 extract (동시 EXTRACT_CONCURRENCY건)
        if (hasDocs) {
          try {
            const sync = await syncAgentDocs(
              payload.project_id,
              payload.session_data.docs_files!
            );
            if (sync.errors.length > 0) {
              console.error('[push] docs sync errors:', sync.errors);
            }
            console.log(
              `[push] docs sync: ${sync.changed.length} changed, ${sync.unchanged_count} unchanged, ${sync.deleted_count} soft-deleted`
            );

            if (sync.changed.length > 0) {
              await runWithConcurrency(sync.changed, EXTRACT_CONCURRENCY, async (doc) => {
                try {
                  const result = await extractFeaturesForDocument(
                    payload.project_id,
                    doc.document_id,
                    doc.type,
                    doc.content
                  );
                  if (result.error) {
                    console.error(
                      `[push] extract ${doc.path} failed: ${result.error}`
                    );
                  } else {
                    console.log(
                      `[push] extract ${doc.path} (${doc.reason}) → ${result.features_count} features (in ${result.token_usage.input}/out ${result.token_usage.output} tokens)`
                    );
                  }
                } catch (err) {
                  console.error(
                    `[push] extract ${doc.path} threw:`,
                    (err as Error).message
                  );
                }
              });
            }
          } catch (err) {
            console.error('[push] docs sync failed:', (err as Error).message);
          }
        }

        // 10b. 분석 (diff 있을 때만)
        if (hasDiffs) {
          await runAnalysis(payload.project_id, saved.id, 'problems_only');
        }

        // 10c. assess (features 1건 이상 — extract 결과 + 기존 manual 모두 포함)
        const adminClient = createClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { count, error: countError } = await adminClient
          .from('spec_features')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', payload.project_id);

        if (countError) {
          console.error('[push] spec_features count failed:', countError.message);
          return;
        }

        if (count && count > 0) {
          await assessFeatures(payload.project_id);
        }
      } catch (err) {
        console.error('[push] Auto pipeline failed:', (err as Error).message);
      }
    })();
  }

  // 11. 기회적 삭제 (만료된 ephemeral 정리, fire-and-forget)
  cleanupExpiredEphemeral().catch((err) => {
    console.error('[push] Ephemeral cleanup failed:', err.message);
  });

  // 12. 응답
  return NextResponse.json(
    {
      success: true,
      session_id: saved.id,
      parsed: {
        title: parsed.title,
        prompts_count: parsed.prompts.length,
        files_changed_count: parsed.changed_files,
        warnings: parsed.warnings,
      },
    },
    { status: 201 }
  );
}
