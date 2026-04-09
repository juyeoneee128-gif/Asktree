import { describe, it, expect } from 'vitest';
import { parseSession } from '../parse-session';
import {
  MOCK_JSONL,
  MOCK_JSONL_NO_TITLE,
  MOCK_JSONL_WITH_CORRUPT,
  MOCK_JSONL_TOOL_ONLY,
} from './mock-jsonl';

describe('parseSession', () => {
  it('정상 JSONL을 올바르게 파싱한다', () => {
    const result = parseSession(MOCK_JSONL);

    // ai-title에서 제목 추출
    expect(result.title).toBe('로그인 에러 처리 추가');

    // 프롬프트: ide_opened_file 태그 제거 후 user text만
    expect(result.prompts).toHaveLength(1);
    expect(result.prompts[0]).toBe('로그인 에러 처리 추가해줘');

    // Write/Edit에서 변경 파일 추출 (cwd 기준 상대 경로)
    expect(result.files_changed).toEqual([
      'src/auth/error-handler.ts',
      'src/auth/login.ts',
    ]);
    expect(result.changed_files).toBe(2);

    // 메타데이터
    expect(result.session_id_from_log).toBe('test-session-001');
    expect(result.cli_version).toBe('2.1.90');
    expect(result.entrypoint).toBe('claude-vscode');
    expect(result.model).toBe('claude-sonnet-4-20250514');

    // 요약
    expect(result.summary).toContain('프롬프트 1개');
    expect(result.summary).toContain('파일 변경 2개');

    // 경고 없음
    expect(result.warnings).toHaveLength(0);

    // hash 존재
    expect(result.log_hash).toHaveLength(64);
  });

  it('ai-title이 없으면 첫 프롬프트 50자로 제목을 생성한다', () => {
    const result = parseSession(MOCK_JSONL_NO_TITLE);

    expect(result.title).toBe('로그인 에러 처리 추가해줘');
  });

  it('손상된 줄은 스킵하고 나머지를 정상 처리한다', () => {
    const result = parseSession(MOCK_JSONL_WITH_CORRUPT);

    expect(result.warnings.length).toBeGreaterThanOrEqual(2);
    expect(result.warnings.some((w) => w.includes('parse error'))).toBe(true);

    // ai-title은 포함되어 있으므로 제목 추출 가능
    expect(result.title).toBe('로그인 에러 처리 추가');
  });

  it('빈 JSONL은 에러를 던진다', () => {
    expect(() => parseSession('')).toThrow('Empty log data');
    expect(() => parseSession('\n\n')).toThrow('Empty log data');
  });

  it('tool_result만 있는 user 메시지는 프롬프트에서 제외된다', () => {
    const result = parseSession(MOCK_JSONL_TOOL_ONLY);

    expect(result.prompts).toHaveLength(0);
    expect(result.title).toBe('Untitled Session');
  });

  it('ide_opened_file 태그를 제거한다', () => {
    const result = parseSession(MOCK_JSONL);

    // 프롬프트에 ide_opened_file 태그가 포함되지 않아야 함
    for (const prompt of result.prompts) {
      expect(prompt).not.toContain('<ide_opened_file>');
      expect(prompt).not.toContain('</ide_opened_file>');
    }
  });

  it('절대 경로를 cwd 기준 상대 경로로 변환한다', () => {
    const result = parseSession(MOCK_JSONL);

    // /Users/dev/project/ 가 제거되어야 함
    for (const file of result.files_changed) {
      expect(file).not.toContain('/Users/');
      expect(file.startsWith('src/')).toBe(true);
    }
  });

  it('Write/Edit이 없는 세션은 files_changed가 빈 배열이다', () => {
    const result = parseSession(MOCK_JSONL_TOOL_ONLY);

    expect(result.files_changed).toEqual([]);
    expect(result.changed_files).toBe(0);
  });
});
