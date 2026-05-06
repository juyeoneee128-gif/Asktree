import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * HMAC-SHA256 페이로드 서명 검증.
 *
 * 서명 입력은 `{timestamp}.{rawBody}` 형태 — timestamp만 바꿔치기하는 공격 차단.
 * 5분 이내 timestamp만 허용 (replay attack 완화 + clock skew 허용).
 *
 * 에이전트 0.4.0+가 X-CodeSasu-Signature / X-CodeSasu-Timestamp 헤더 송신.
 * 0.3.x는 헤더 없음 → 호출 측에서 별도 분기 (하위 호환).
 */

export const SIGNATURE_TTL_MS = 5 * 60 * 1000; // 5분

export type SignatureFailure = 'expired' | 'mismatch' | 'malformed';

export type SignatureResult =
  | { valid: true }
  | { valid: false; reason: SignatureFailure };

/**
 * 에이전트와 동일한 방식으로 서명을 계산합니다.
 * 테스트와 디버깅에서 export.
 */
export function computeSignature(
  timestamp: string,
  rawBody: string,
  signingKey: string
): string {
  return createHmac('sha256', signingKey)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
}

export function verifyHmacSignature(
  rawBody: string,
  signature: string,
  timestamp: string,
  signingKey: string,
  now: number = Date.now()
): SignatureResult {
  // 1. timestamp 파싱
  const ts = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(ts) || ts <= 0) {
    return { valid: false, reason: 'malformed' };
  }

  // 2. timestamp 윈도우 검사 (5분 이내, 미래 timestamp도 동일 허용)
  if (Math.abs(now - ts) > SIGNATURE_TTL_MS) {
    return { valid: false, reason: 'expired' };
  }

  // 3. signature 형식 검증 (hex 64자)
  if (!/^[a-f0-9]{64}$/i.test(signature)) {
    return { valid: false, reason: 'malformed' };
  }

  // 4. timing-safe compare
  const expected = computeSignature(timestamp, rawBody, signingKey);
  const expectedBuf = Buffer.from(expected, 'hex');
  const actualBuf = Buffer.from(signature, 'hex');

  // 길이 다르면 timingSafeEqual이 throw → mismatch로 처리
  if (expectedBuf.length !== actualBuf.length) {
    return { valid: false, reason: 'mismatch' };
  }

  return timingSafeEqual(expectedBuf, actualBuf)
    ? { valid: true }
    : { valid: false, reason: 'mismatch' };
}
