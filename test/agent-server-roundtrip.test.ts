import { describe, it, expect } from 'vitest';
import { signPayload } from '../agent/sender.js';
import {
  computeSignature,
  verifyHmacSignature,
} from '../src/lib/agent/verify-signature';

/**
 * 에이전트가 만든 서명을 서버가 정상 검증하는지 — 양측 알고리즘 일치 회귀 보호.
 * 알고리즘이 갈라지면 모든 0.4.0 push가 401로 막힌다.
 */
describe('agent ↔ server HMAC round-trip', () => {
  const KEY = 'a1b2c3d4'.repeat(8); // hex 64자
  const BODY = JSON.stringify({
    project_id: 'p-1',
    session_data: { jsonl_log: 'mock' },
    metadata: { agent_version: '0.4.0', pushed_at: '2026-05-06T00:00:00Z' },
  });

  it('agent의 signPayload === 서버의 computeSignature', () => {
    const ts = Date.now().toString();
    const agentSig = signPayload(ts, BODY, KEY);
    const serverSig = computeSignature(ts, BODY, KEY);
    expect(agentSig).toBe(serverSig);
  });

  it('agent가 서명한 payload를 서버가 valid로 인식', () => {
    const now = Date.now();
    const ts = now.toString();
    const sig = signPayload(ts, BODY, KEY);

    const result = verifyHmacSignature(BODY, sig, ts, KEY, now);
    expect(result.valid).toBe(true);
  });

  it('body 한 글자만 변조해도 서버 검증 실패', () => {
    const now = Date.now();
    const ts = now.toString();
    const sig = signPayload(ts, BODY, KEY);

    const tampered = BODY.replace('"p-1"', '"p-2"');
    const result = verifyHmacSignature(tampered, sig, ts, KEY, now);
    expect(result.valid).toBe(false);
  });

  it('signing key가 다르면 서버가 거부', () => {
    const now = Date.now();
    const ts = now.toString();
    const sig = signPayload(ts, BODY, KEY);

    const result = verifyHmacSignature(BODY, sig, ts, 'b'.repeat(64), now);
    expect(result.valid).toBe(false);
  });
});
