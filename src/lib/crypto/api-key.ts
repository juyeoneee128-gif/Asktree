import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('API_KEY_ENCRYPTION_SECRET must be at least 32 characters');
  }
  // 32바이트로 정규화 (SHA-256 대신 단순 슬라이스 — secret이 충분히 길다고 가정)
  return Buffer.from(secret.slice(0, 32), 'utf-8');
}

/**
 * API 키를 AES-256-GCM으로 암호화합니다.
 * 반환: base64(iv + authTag + ciphertext)
 */
export function encryptApiKey(plainKey: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainKey, 'utf-8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // iv(12) + authTag(16) + ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64');
}

/**
 * 암호화된 API 키를 복호화합니다.
 * 분석 실행 시 내부적으로만 호출됩니다.
 */
export function decryptApiKey(encryptedKey: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedKey, 'base64');

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf-8');
}

/**
 * API 키를 마스킹합니다.
 * "sk-ant-api03-xxxxx...xxxxx" → "sk-ant-***...xxx"
 */
export function maskApiKey(plainKey: string): string {
  if (plainKey.length <= 10) return '***';
  const prefix = plainKey.slice(0, 7);
  const suffix = plainKey.slice(-3);
  return `${prefix}***...${suffix}`;
}
