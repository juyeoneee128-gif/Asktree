const AGENT_VERSION = '0.2.0';
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;

export async function pushSession({ apiUrl, token, projectId, sessionResult }) {
  const payload = {
    project_id: projectId,
    session_data: {
      jsonl_log: sessionResult.jsonlLog,
      diffs: sessionResult.diffs,
      eslint_results: sessionResult.eslintResults ?? [],
    },
    metadata: {
      agent_version: AGENT_VERSION,
      pushed_at: new Date().toISOString(),
      entrypoint: 'local-agent',
    },
  };

  const body = JSON.stringify(payload);
  const endpoint = `${apiUrl.replace(/\/$/, '')}/api/agent/push`;

  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        // non-JSON response
      }

      if (res.status === 201) {
        return { ok: true, sessionId: json?.session_id ?? sessionResult.sessionId, status: 201 };
      }
      if (res.status === 409) {
        // 서버에서 중복으로 판정 — 정상 처리로 간주
        return {
          ok: true,
          duplicate: true,
          sessionId: json?.existing_session_id ?? sessionResult.sessionId,
          status: 409,
        };
      }

      if (res.status >= 400 && res.status < 500) {
        // 클라이언트 에러는 재시도 안 함
        return { ok: false, status: res.status, body: json ?? text };
      }

      lastError = new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    } catch (err) {
      lastError = err;
    }

    if (attempt < MAX_RETRIES) {
      const delay = RETRY_BASE_MS * Math.pow(3, attempt);
      await sleep(delay);
    }
  }

  return { ok: false, error: lastError?.message ?? 'unknown error' };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
