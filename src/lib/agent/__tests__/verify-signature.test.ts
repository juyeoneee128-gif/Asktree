import { describe, it, expect } from 'vitest';
import {
  verifyHmacSignature,
  computeSignature,
  SIGNATURE_TTL_MS,
} from '../verify-signature';

const KEY = 'a'.repeat(64); // 32바이트 hex
const BODY = JSON.stringify({ project_id: 'p-1', session_data: { jsonl_log: 'x' } });

describe('verifyHmacSignature — 정상 흐름', () => {
  it('현재 timestamp + 정상 서명이면 valid', () => {
    const now = Date.now();
    const ts = now.toString();
    const sig = computeSignature(ts, BODY, KEY);

    const r = verifyHmacSignature(BODY, sig, ts, KEY, now);
    expect(r.valid).toBe(true);
  });

  it('5분 이내 과거 timestamp는 허용 (clock skew)', () => {
    const now = Date.now();
    const ts = (now - 4 * 60 * 1000).toString(); // 4분 전
    const sig = computeSignature(ts, BODY, KEY);

    const r = verifyHmacSignature(BODY, sig, ts, KEY, now);
    expect(r.valid).toBe(true);
  });

  it('5분 이내 미래 timestamp도 허용 (서버보다 빠른 클라이언트)', () => {
    const now = Date.now();
    const ts = (now + 4 * 60 * 1000).toString();
    const sig = computeSignature(ts, BODY, KEY);

    const r = verifyHmacSignature(BODY, sig, ts, KEY, now);
    expect(r.valid).toBe(true);
  });
});

describe('verifyHmacSignature — 실패 케이스', () => {
  it('5분 초과 과거 timestamp는 expired', () => {
    const now = Date.now();
    const ts = (now - SIGNATURE_TTL_MS - 1000).toString();
    const sig = computeSignature(ts, BODY, KEY);

    const r = verifyHmacSignature(BODY, sig, ts, KEY, now);
    expect(r).toEqual({ valid: false, reason: 'expired' });
  });

  it('변조된 body는 mismatch', () => {
    const now = Date.now();
    const ts = now.toString();
    const sig = computeSignature(ts, BODY, KEY);

    const tampered = BODY.replace('p-1', 'p-2');
    const r = verifyHmacSignature(tampered, sig, ts, KEY, now);
    expect(r).toEqual({ valid: false, reason: 'mismatch' });
  });

  it('잘못된 signing key는 mismatch', () => {
    const now = Date.now();
    const ts = now.toString();
    const sig = computeSignature(ts, BODY, KEY);

    const r = verifyHmacSignature(BODY, sig, ts, 'b'.repeat(64), now);
    expect(r).toEqual({ valid: false, reason: 'mismatch' });
  });

  it('timestamp만 바꿔치기하면 mismatch (timestamp가 서명 입력에 포함됨)', () => {
    const now = Date.now();
    const ts1 = now.toString();
    const sig = computeSignature(ts1, BODY, KEY);

    // 다른 timestamp로 같은 서명 사용 시도 → 실패해야 함
    const ts2 = (now - 1000).toString();
    const r = verifyHmacSignature(BODY, sig, ts2, KEY, now);
    expect(r).toEqual({ valid: false, reason: 'mismatch' });
  });

  it('비숫자 timestamp는 malformed', () => {
    const r = verifyHmacSignature(BODY, 'a'.repeat(64), 'not-a-number', KEY);
    expect(r).toEqual({ valid: false, reason: 'malformed' });
  });

  it('hex 64자가 아닌 signature는 malformed', () => {
    const ts = Date.now().toString();
    const r = verifyHmacSignature(BODY, 'short', ts, KEY);
    expect(r).toEqual({ valid: false, reason: 'malformed' });
  });

  it('잘못된 hex 문자가 포함된 signature는 malformed', () => {
    const ts = Date.now().toString();
    const r = verifyHmacSignature(BODY, 'z'.repeat(64), ts, KEY);
    expect(r).toEqual({ valid: false, reason: 'malformed' });
  });

  it('빈 signature는 malformed', () => {
    const ts = Date.now().toString();
    const r = verifyHmacSignature(BODY, '', ts, KEY);
    expect(r).toEqual({ valid: false, reason: 'malformed' });
  });
});

describe('computeSignature — 결정성', () => {
  it('같은 입력은 항상 같은 서명', () => {
    const ts = '1234567890';
    const a = computeSignature(ts, BODY, KEY);
    const b = computeSignature(ts, BODY, KEY);
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('다른 키는 다른 서명', () => {
    const ts = '1234567890';
    const a = computeSignature(ts, BODY, 'a'.repeat(64));
    const b = computeSignature(ts, BODY, 'b'.repeat(64));
    expect(a).not.toBe(b);
  });
});
