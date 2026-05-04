export interface DiffEntry {
  file_path: string;
  diff_content: string;
  change_type: 'added' | 'modified' | 'deleted';
}

export interface FileTreeEntry {
  path: string;
  type: 'file' | 'directory';
  size?: number;
}

/**
 * 에이전트가 로컬 실행한 ESLint 결과 단건. agent/eslint-collector.js의 출력 형식과 일치.
 */
export interface EslintIssueRaw {
  file_path: string;
  line: number;
  column: number;
  rule_id: string | null;
  severity: 1 | 2; // 1=warn, 2=error
  message: string;
}

/**
 * 에이전트가 수집한 docs/*.md 파일. agent/docs-collector.js 출력 형식과 일치.
 * 서버는 SHA-256 해시로 변경을 감지하여 변경된 파일만 기능 추출 재실행.
 */
export interface DocFile {
  path: string;        // 'docs/prd_v3.md' (POSIX 슬래시)
  content: string;     // markdown 본문
  modified_at: string; // ISO 타임스탬프 (파일 mtime)
}

export interface AgentPushPayload {
  project_id: string;
  session_data: {
    jsonl_log: string;
    file_tree?: FileTreeEntry[];
    diffs?: DiffEntry[];
    eslint_results?: EslintIssueRaw[];
    docs_files?: DocFile[];
  };
  metadata: {
    agent_version: string;
    pushed_at: string;
    cli_version?: string;
    entrypoint?: string;
  };
}

const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * 에이전트 push 페이로드를 검증합니다.
 * 유효하면 파싱된 payload를 반환, 아니면 에러 목록을 반환합니다.
 */
export function validatePayload(
  body: unknown
): { valid: true; payload: AgentPushPayload } | { valid: false; errors: string[] } {
  const errors: string[] = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object'] };
  }

  const obj = body as Record<string, unknown>;

  // project_id
  if (!obj.project_id || typeof obj.project_id !== 'string') {
    errors.push('project_id is required and must be a string');
  }

  // session_data
  if (!obj.session_data || typeof obj.session_data !== 'object') {
    errors.push('session_data is required and must be an object');
  } else {
    const sd = obj.session_data as Record<string, unknown>;

    if (!sd.jsonl_log || typeof sd.jsonl_log !== 'string') {
      errors.push('session_data.jsonl_log is required and must be a string');
    } else if (sd.jsonl_log.trim().length === 0) {
      errors.push('session_data.jsonl_log must not be empty');
    }

    if (sd.diffs !== undefined) {
      if (!Array.isArray(sd.diffs)) {
        errors.push('session_data.diffs must be an array');
      } else {
        for (let i = 0; i < sd.diffs.length; i++) {
          const d = sd.diffs[i] as Record<string, unknown>;
          if (!d.file_path || typeof d.file_path !== 'string') {
            errors.push(`session_data.diffs[${i}].file_path is required`);
          }
          if (!d.diff_content || typeof d.diff_content !== 'string') {
            errors.push(`session_data.diffs[${i}].diff_content is required`);
          }
          if (!['added', 'modified', 'deleted'].includes(d.change_type as string)) {
            errors.push(`session_data.diffs[${i}].change_type must be 'added', 'modified', or 'deleted'`);
          }
        }
      }
    }

    if (sd.file_tree !== undefined) {
      if (!Array.isArray(sd.file_tree)) {
        errors.push('session_data.file_tree must be an array');
      }
    }

    if (sd.docs_files !== undefined) {
      if (!Array.isArray(sd.docs_files)) {
        errors.push('session_data.docs_files must be an array');
      } else {
        for (let i = 0; i < sd.docs_files.length; i++) {
          const d = sd.docs_files[i] as Record<string, unknown>;
          if (!d.path || typeof d.path !== 'string') {
            errors.push(`session_data.docs_files[${i}].path is required`);
          }
          if (typeof d.content !== 'string') {
            errors.push(`session_data.docs_files[${i}].content must be a string`);
          } else if (d.content.length > 60_000) {
            // agent의 50KB 한도 + 여유. 초과는 페이로드 정합성 의심
            errors.push(
              `session_data.docs_files[${i}].content exceeds 60_000 chars (${d.content.length})`
            );
          }
          if (!d.modified_at || typeof d.modified_at !== 'string') {
            errors.push(`session_data.docs_files[${i}].modified_at is required`);
          } else if (Number.isNaN(Date.parse(d.modified_at))) {
            errors.push(
              `session_data.docs_files[${i}].modified_at must be a valid ISO date string`
            );
          }
        }
      }
    }

    if (sd.eslint_results !== undefined) {
      if (!Array.isArray(sd.eslint_results)) {
        errors.push('session_data.eslint_results must be an array');
      } else {
        for (let i = 0; i < sd.eslint_results.length; i++) {
          const r = sd.eslint_results[i] as Record<string, unknown>;
          if (!r.file_path || typeof r.file_path !== 'string') {
            errors.push(`session_data.eslint_results[${i}].file_path is required`);
          }
          if (typeof r.line !== 'number') {
            errors.push(`session_data.eslint_results[${i}].line must be a number`);
          }
          if (typeof r.column !== 'number') {
            errors.push(`session_data.eslint_results[${i}].column must be a number`);
          }
          // rule_id can be null (e.g. parser errors)
          if (r.rule_id !== null && typeof r.rule_id !== 'string') {
            errors.push(`session_data.eslint_results[${i}].rule_id must be string or null`);
          }
          if (r.severity !== 1 && r.severity !== 2) {
            errors.push(`session_data.eslint_results[${i}].severity must be 1 or 2`);
          }
          if (!r.message || typeof r.message !== 'string') {
            errors.push(`session_data.eslint_results[${i}].message is required`);
          }
        }
      }
    }
  }

  // metadata
  if (!obj.metadata || typeof obj.metadata !== 'object') {
    errors.push('metadata is required and must be an object');
  } else {
    const md = obj.metadata as Record<string, unknown>;
    if (!md.agent_version || typeof md.agent_version !== 'string') {
      errors.push('metadata.agent_version is required');
    }
    if (!md.pushed_at || typeof md.pushed_at !== 'string') {
      errors.push('metadata.pushed_at is required');
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, payload: obj as unknown as AgentPushPayload };
}

/**
 * 페이로드 바이트 크기를 검증합니다.
 */
export function validatePayloadSize(rawBody: string): boolean {
  const byteSize = new TextEncoder().encode(rawBody).length;
  return byteSize <= MAX_PAYLOAD_SIZE;
}

export { MAX_PAYLOAD_SIZE };
