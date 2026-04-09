import { describe, it, expect, beforeAll } from 'vitest';
import { encryptApiKey, decryptApiKey, maskApiKey } from '../api-key';

beforeAll(() => {
  // 테스트용 encryption secret 설정
  process.env.API_KEY_ENCRYPTION_SECRET = 'test-encryption-secret-32-chars!';
});

describe('encryptApiKey / decryptApiKey', () => {
  it('암호화→복호화 라운드트립이 성공한다', () => {
    const original = 'sk-ant-api03-test-key-1234567890';
    const encrypted = encryptApiKey(original);
    const decrypted = decryptApiKey(encrypted);

    expect(decrypted).toBe(original);
  });

  it('같은 키를 두 번 암호화하면 다른 결과가 나온다 (랜덤 IV)', () => {
    const original = 'sk-ant-api03-test-key';
    const encrypted1 = encryptApiKey(original);
    const encrypted2 = encryptApiKey(original);

    expect(encrypted1).not.toBe(encrypted2);
  });

  it('암호화된 결과는 base64 형식이다', () => {
    const encrypted = encryptApiKey('sk-ant-api03-test');
    expect(() => Buffer.from(encrypted, 'base64')).not.toThrow();
    expect(encrypted.length).toBeGreaterThan(0);
  });

  it('빈 문자열도 암호화/복호화할 수 있다', () => {
    const encrypted = encryptApiKey('');
    const decrypted = decryptApiKey(encrypted);
    expect(decrypted).toBe('');
  });

  it('긴 키도 정상 처리한다', () => {
    const longKey = 'sk-ant-api03-' + 'a'.repeat(200);
    const encrypted = encryptApiKey(longKey);
    const decrypted = decryptApiKey(encrypted);
    expect(decrypted).toBe(longKey);
  });
});

describe('maskApiKey', () => {
  it('일반 키를 마스킹한다', () => {
    const masked = maskApiKey('sk-ant-api03-xxxxx-12345');
    expect(masked).toBe('sk-ant-***...345');
  });

  it('짧은 키는 ***로 반환한다', () => {
    expect(maskApiKey('short')).toBe('***');
    expect(maskApiKey('1234567890')).toBe('***');
  });

  it('마스킹 결과에 원본 키가 포함되지 않는다', () => {
    const key = 'sk-ant-api03-my-secret-key-value';
    const masked = maskApiKey(key);
    expect(masked).not.toContain('secret');
    expect(masked).not.toContain('api03');
  });
});
