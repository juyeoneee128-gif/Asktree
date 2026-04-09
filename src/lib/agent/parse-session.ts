import { createHash } from 'crypto';

// ─── JSONL 메시지 타입 정의 ───

interface JsnolContentText {
  type: 'text';
  text: string;
}

interface JsonlContentToolUse {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface JsonlContentToolResult {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

interface JsonlContentThinking {
  type: 'thinking';
  thinking: string;
}

type JsonlContent = JsnolContentText | JsonlContentToolUse | JsonlContentToolResult | JsonlContentThinking;

interface JsonlUserMessage {
  type: 'user';
  parentUuid: string | null;
  isSidechain?: boolean;
  promptId?: string;
  uuid: string;
  timestamp: string;
  message: {
    role: 'user';
    content: JsonlContent[];
  };
  toolUseResult?: unknown;
  permissionMode?: string;
  userType?: string;
  entrypoint?: string;
  cwd?: string;
  sessionId?: string;
  version?: string;
  gitBranch?: string;
}

interface JsonlAssistantMessage {
  type: 'assistant';
  parentUuid: string;
  isSidechain?: boolean;
  uuid: string;
  timestamp: string;
  requestId?: string;
  message: {
    model?: string;
    id?: string;
    type?: string;
    role: 'assistant';
    content: JsonlContent[];
    stop_reason?: string;
    usage?: {
      input_tokens: number;
      output_tokens: number;
    };
  };
}

interface JsonlQueueOperation {
  type: 'queue-operation';
  operation: 'enqueue' | 'dequeue';
  timestamp: string;
  sessionId: string;
}

interface JsonlAiTitle {
  type: 'ai-title';
  sessionId: string;
  aiTitle: string;
}

interface JsonlGeneric {
  type: string;
  timestamp?: string;
  [key: string]: unknown;
}

type JsonlEntry = JsonlUserMessage | JsonlAssistantMessage | JsonlQueueOperation | JsonlAiTitle | JsonlGeneric;

// ─── 파싱 결과 타입 ───

export interface ParsedSession {
  title: string;
  summary: string;
  raw_log: string;
  log_hash: string;
  files_changed: string[];
  changed_files: number;
  prompts: string[];
  warnings: string[];
  session_id_from_log: string | null;
  cli_version: string | null;
  entrypoint: string | null;
  model: string | null;
}

// ─── 시스템 태그 제거 ───

const SYSTEM_TAG_PATTERNS = [
  /<ide_opened_file>[\s\S]*?<\/ide_opened_file>/g,
  /<system-reminder>[\s\S]*?<\/system-reminder>/g,
  /<ide_selection>[\s\S]*?<\/ide_selection>/g,
];

function stripSystemTags(text: string): string {
  let result = text;
  for (const pattern of SYSTEM_TAG_PATTERNS) {
    result = result.replace(pattern, '');
  }
  return result.trim();
}

// ─── 절대 경로 → 상대 경로 ───

function toRelativePath(filePath: string, cwd: string | null): string {
  if (!cwd || !filePath.startsWith(cwd)) return filePath;
  const relative = filePath.slice(cwd.length);
  return relative.startsWith('/') ? relative.slice(1) : relative;
}

// ─── 메인 파싱 함수 ───

export function parseSession(jsonlLog: string): ParsedSession {
  const warnings: string[] = [];

  // Step 1: 줄 분리 + JSON 파싱
  const rawLines = jsonlLog.split('\n').filter((line) => line.trim().length > 0);

  if (rawLines.length === 0) {
    throw new Error('Empty log data');
  }

  const entries: JsonlEntry[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    try {
      const parsed = JSON.parse(rawLines[i]) as JsonlEntry;
      if (parsed && typeof parsed === 'object' && parsed.type) {
        entries.push(parsed);
      } else {
        warnings.push(`Line ${i + 1}: invalid structure`);
      }
    } catch {
      warnings.push(`Line ${i + 1}: parse error`);
    }
  }

  if (entries.length === 0) {
    throw new Error('No valid entries in log data');
  }

  // Step 2: 메시지 분류
  const userMessages: JsonlUserMessage[] = [];
  const assistantMessages: JsonlAssistantMessage[] = [];
  let aiTitle: string | null = null;
  let sessionIdFromLog: string | null = null;

  for (const entry of entries) {
    switch (entry.type) {
      case 'user':
        userMessages.push(entry as JsonlUserMessage);
        break;
      case 'assistant':
        assistantMessages.push(entry as JsonlAssistantMessage);
        break;
      case 'ai-title':
        aiTitle = (entry as JsonlAiTitle).aiTitle;
        break;
      case 'queue-operation':
        if (!sessionIdFromLog) {
          sessionIdFromLog = (entry as JsonlQueueOperation).sessionId;
        }
        break;
    }
  }

  // Step 3: 세션 제목
  const title = aiTitle ?? extractFirstPromptTitle(userMessages) ?? 'Untitled Session';

  // Step 4: 사용자 프롬프트 수집
  const prompts = extractPrompts(userMessages);

  // Step 5: 변경 파일 추출
  const cwd = extractCwd(userMessages);
  const filesChanged = extractChangedFiles(assistantMessages, cwd);

  // Step 6: 도구 사용 통계 + 요약
  const toolsUsed = countToolUsage(assistantMessages);
  const summary = buildSummary(prompts.length, filesChanged.length, toolsUsed);

  // Step 7: 메타데이터
  const firstUser = userMessages.find((m) => m.sessionId || m.version);
  const firstAssistant = assistantMessages[0];

  // log_hash
  const logHash = createHash('sha256').update(jsonlLog).digest('hex');

  return {
    title,
    summary,
    raw_log: jsonlLog,
    log_hash: logHash,
    files_changed: filesChanged,
    changed_files: filesChanged.length,
    prompts,
    warnings,
    session_id_from_log: sessionIdFromLog ?? firstUser?.sessionId ?? null,
    cli_version: firstUser?.version ?? null,
    entrypoint: firstUser?.entrypoint ?? null,
    model: firstAssistant?.message?.model ?? null,
  };
}

// ─── 헬퍼 함수들 ───

/**
 * 첫 번째 사용자 프롬프트에서 제목 추출 (50자 제한)
 */
function extractFirstPromptTitle(userMessages: JsonlUserMessage[]): string | null {
  for (const msg of userMessages) {
    if (msg.toolUseResult) continue;
    const texts = extractTextFromContent(msg.message.content);
    // 모든 text를 시스템 태그 제거 후 합쳐서 판단
    const clean = texts.map(stripSystemTags).filter((t) => t.length > 0).join('\n');
    if (clean.length > 0) {
      return clean.length > 50 ? clean.slice(0, 50) + '...' : clean;
    }
  }
  return null;
}

/**
 * 사용자 프롬프트만 추출 (tool_result 제외, 시스템 태그 제거)
 */
function extractPrompts(userMessages: JsonlUserMessage[]): string[] {
  const prompts: string[] = [];

  for (const msg of userMessages) {
    // toolUseResult가 있으면 도구 응답 → 스킵
    if (msg.toolUseResult) continue;

    // content에 tool_result만 있으면 스킵
    const hasText = msg.message.content.some((c) => c.type === 'text');
    const hasOnlyToolResult = msg.message.content.every(
      (c) => c.type === 'tool_result'
    );
    if (!hasText || hasOnlyToolResult) continue;

    const texts = extractTextFromContent(msg.message.content);
    const joined = texts.map(stripSystemTags).filter((t) => t.length > 0).join('\n');
    if (joined.length > 0) {
      prompts.push(joined);
    }
  }

  return prompts;
}

/**
 * content 배열에서 type="text"인 항목의 text를 추출
 */
function extractTextFromContent(content: JsonlContent[]): string[] {
  return content
    .filter((c): c is JsnolContentText => c.type === 'text')
    .map((c) => c.text);
}

/**
 * 첫 user 메시지에서 cwd 추출
 */
function extractCwd(userMessages: JsonlUserMessage[]): string | null {
  for (const msg of userMessages) {
    if (msg.cwd) return msg.cwd;
  }
  return null;
}

/**
 * assistant의 tool_use(Write/Edit)에서 변경 파일 경로 추출
 */
function extractChangedFiles(
  assistantMessages: JsonlAssistantMessage[],
  cwd: string | null
): string[] {
  const files = new Set<string>();

  for (const msg of assistantMessages) {
    for (const content of msg.message.content) {
      if (content.type !== 'tool_use') continue;
      const toolContent = content as JsonlContentToolUse;

      if (
        (toolContent.name === 'Write' || toolContent.name === 'Edit') &&
        typeof toolContent.input.file_path === 'string'
      ) {
        files.add(toRelativePath(toolContent.input.file_path, cwd));
      }
    }
  }

  return Array.from(files).sort();
}

/**
 * assistant의 tool_use 도구별 사용 횟수 카운트
 */
function countToolUsage(
  assistantMessages: JsonlAssistantMessage[]
): Record<string, number> {
  const tools: Record<string, number> = {};

  for (const msg of assistantMessages) {
    for (const content of msg.message.content) {
      if (content.type === 'tool_use') {
        const name = (content as JsonlContentToolUse).name;
        tools[name] = (tools[name] ?? 0) + 1;
      }
    }
  }

  return tools;
}

/**
 * 요약 문자열 생성
 */
function buildSummary(
  promptCount: number,
  fileCount: number,
  toolsUsed: Record<string, number>
): string {
  const parts: string[] = [
    `프롬프트 ${promptCount}개`,
    `파일 변경 ${fileCount}개`,
  ];

  // 도구 Top 3
  const topTools = Object.entries(toolsUsed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => `${name} ${count}회`);

  if (topTools.length > 0) {
    parts.push(topTools.join(', '));
  }

  return parts.join(' · ');
}
