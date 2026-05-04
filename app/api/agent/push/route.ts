import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/src/lib/supabase/types';
import { extractBearerToken, verifyAgentToken } from '@/src/lib/agent/auth-agent';
import { validatePayload, validatePayloadSize, MAX_PAYLOAD_SIZE } from '@/src/lib/agent/validate-payload';
import { parseSession } from '@/src/lib/agent/parse-session';
import { saveSession, updateAgentStatus, mergeChangedFiles } from '@/src/lib/agent/save-session';
import { saveEphemeralDiffs, saveEphemeralFileTree, cleanupExpiredEphemeral } from '@/src/lib/agent/ephemeral';
import { runAnalysis } from '@/src/lib/analysis/run-analysis';
import { assessFeatures } from '@/src/lib/specs/assess-features';

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

  // 8. Ephemeral 데이터 저장 (diffs, file_tree)
  try {
    if (payload.session_data.diffs && payload.session_data.diffs.length > 0) {
      await saveEphemeralDiffs(saved.id, payload.session_data.diffs);
    }
    if (payload.session_data.file_tree && payload.session_data.file_tree.length > 0) {
      await saveEphemeralFileTree(saved.id, payload.session_data.file_tree);
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

  // 10. 자동 분석 트리거 (비동기, 응답 차단 안 함)
  // 자동 분석은 problems_only 모드 — critical 위주 + 상한 축소로 크레딧 절감.
  // 수동 재분석(analyze 라우트)은 full 모드.
  // 기획서가 업로드된 프로젝트는 분석 후 자동으로 구현 현황 재판정.
  if (payload.session_data.diffs && payload.session_data.diffs.length > 0) {
    (async () => {
      try {
        await runAnalysis(payload.project_id, saved.id, 'problems_only');

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
        console.error('[push] Auto analysis failed:', (err as Error).message);
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
