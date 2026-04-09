import { describe, it, expect } from 'vitest';
import { validatePayload, validatePayloadSize, MAX_PAYLOAD_SIZE } from '../validate-payload';
import { MOCK_PUSH_PAYLOAD } from './mock-jsonl';

describe('validatePayload', () => {
  it('유효한 페이로드를 통과시킨다', () => {
    const result = validatePayload(MOCK_PUSH_PAYLOAD);

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.payload.project_id).toBe('test-project-uuid');
      expect(result.payload.session_data.jsonl_log.length).toBeGreaterThan(0);
    }
  });

  it('null/undefined body를 거부한다', () => {
    expect(validatePayload(null).valid).toBe(false);
    expect(validatePayload(undefined).valid).toBe(false);
  });

  it('project_id 누락 시 에러를 반환한다', () => {
    const result = validatePayload({
      session_data: { jsonl_log: 'test' },
      metadata: { agent_version: '1.0', pushed_at: '2026-01-01' },
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContain('project_id is required and must be a string');
    }
  });

  it('jsonl_log 누락 시 에러를 반환한다', () => {
    const result = validatePayload({
      project_id: 'test',
      session_data: {},
      metadata: { agent_version: '1.0', pushed_at: '2026-01-01' },
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('jsonl_log'))).toBe(true);
    }
  });

  it('빈 jsonl_log를 거부한다', () => {
    const result = validatePayload({
      project_id: 'test',
      session_data: { jsonl_log: '   ' },
      metadata: { agent_version: '1.0', pushed_at: '2026-01-01' },
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('empty'))).toBe(true);
    }
  });

  it('metadata 누락 시 에러를 반환한다', () => {
    const result = validatePayload({
      project_id: 'test',
      session_data: { jsonl_log: 'test' },
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('metadata'))).toBe(true);
    }
  });

  it('잘못된 diffs 구조를 거부한다', () => {
    const result = validatePayload({
      project_id: 'test',
      session_data: {
        jsonl_log: 'test',
        diffs: [{ file_path: 'a.ts' }], // diff_content, change_type 누락
      },
      metadata: { agent_version: '1.0', pushed_at: '2026-01-01' },
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('diff_content'))).toBe(true);
      expect(result.errors.some((e) => e.includes('change_type'))).toBe(true);
    }
  });

  it('여러 필드 누락 시 모든 에러를 한번에 반환한다', () => {
    const result = validatePayload({});

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('validatePayloadSize', () => {
  it('10MB 이하를 허용한다', () => {
    expect(validatePayloadSize('small payload')).toBe(true);
  });

  it('10MB 초과를 거부한다', () => {
    const largePayload = 'x'.repeat(MAX_PAYLOAD_SIZE + 1);
    expect(validatePayloadSize(largePayload)).toBe(false);
  });
});
