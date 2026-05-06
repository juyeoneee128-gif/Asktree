import { describe, it, expect } from 'vitest';
import { maskSensitiveData, applyMaskingToDiffs } from '../mask-sensitive';

describe('maskSensitiveData', () => {
  it('빈 입력은 그대로 반환', () => {
    expect(maskSensitiveData('').masked).toBe('');
    expect(maskSensitiveData('').maskCount).toBe(0);
  });

  it('일반 텍스트는 변경 없음', () => {
    const text = 'function add(a, b) { return a + b; }';
    const r = maskSensitiveData(text);
    expect(r.masked).toBe(text);
    expect(r.maskCount).toBe(0);
  });

  // ─── 1. PEM private key ───
  it('PEM private key 블록을 마스킹한다', () => {
    const text =
      '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\nABC123\n-----END RSA PRIVATE KEY-----';
    const r = maskSensitiveData(text);
    expect(r.masked).toBe('[PRIVATE_KEY_MASKED]');
    expect(r.byPattern.private_key).toBe(1);
  });

  it('OPENSSH 변형도 마스킹', () => {
    const text =
      '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXk...\n-----END OPENSSH PRIVATE KEY-----';
    expect(maskSensitiveData(text).masked).toBe('[PRIVATE_KEY_MASKED]');
  });

  // ─── 2. JWT ───
  it('JWT 3-segment 토큰을 마스킹한다', () => {
    const jwt =
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTYifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const r = maskSensitiveData(`token = ${jwt}`);
    expect(r.masked).toBe('token = [JWT_MASKED]');
    expect(r.byPattern.jwt).toBe(1);
  });

  // ─── 3. AWS ───
  it('AWS Access Key를 마스킹한다', () => {
    const r = maskSensitiveData('aws_key = AKIAIOSFODNN7EXAMPLE');
    expect(r.masked).toBe('aws_key = [AWS_KEY_MASKED]');
    expect(r.byPattern.aws_key).toBe(1);
  });

  // ─── 4. Bearer ───
  it('Bearer 토큰을 마스킹하고 Bearer 키워드는 유지', () => {
    const r = maskSensitiveData('Authorization: Bearer eyJhbGciOiJIUzI1NiJ9abcdefghij');
    expect(r.masked).toContain('Bearer [TOKEN_MASKED]');
    expect(r.masked).not.toContain('eyJhbG');
  });

  // ─── 5. API key prefix ───
  it('sk- 접두사 API 키를 마스킹', () => {
    const r = maskSensitiveData('OPENAI_KEY = sk-abc123def456ghi789jklmnopq');
    expect(r.masked).toContain('[ENV_MASKED]');
  });

  it('pk_live_ stripe 키를 마스킹', () => {
    const r = maskSensitiveData('const key = pk_live_abc123def456ghi789jkl;');
    expect(r.masked).toBe('const key = [API_KEY_MASKED];');
    expect(r.byPattern.api_key).toBe(1);
  });

  // ─── 6. password ───
  it('password: "value" 패턴에서 값만 마스킹, 키 보존', () => {
    const r = maskSensitiveData('password: "mySecret123"');
    expect(r.masked).toBe('password: "[PASSWORD_MASKED]"');
    expect(r.byPattern.password).toBe(1);
  });

  it('JSON 형식 "secret":"xxx"도 처리', () => {
    const r = maskSensitiveData('{"secret":"abc123"}');
    expect(r.masked).toBe('{"secret":"[PASSWORD_MASKED]"}');
  });

  // ─── 7. ENV — 좌변 보존 ───
  it('DATABASE_URL=value 형태에서 좌변 보존, 우변만 마스킹', () => {
    const r = maskSensitiveData('DATABASE_URL=postgres://user:pass@host/db');
    expect(r.masked).toBe('DATABASE_URL=[ENV_MASKED]');
    expect(r.byPattern.env).toBe(1);
  });

  it('따옴표로 감싼 ENV 값도 처리', () => {
    const r = maskSensitiveData('API_TOKEN="abc123def"');
    expect(r.masked).toBe('API_TOKEN=[ENV_MASKED]');
  });

  it('등호 주변 공백도 허용', () => {
    const r = maskSensitiveData('STRIPE_SECRET = sk_test_xxxxx');
    expect(r.masked).toBe('STRIPE_SECRET = [ENV_MASKED]');
  });

  it('민감 접미사 없는 ENV 변수는 마스킹 안 함 (오탐 방지)', () => {
    const r = maskSensitiveData('NODE_ENV=production');
    expect(r.masked).toBe('NODE_ENV=production');
    expect(r.maskCount).toBe(0);
  });

  it('소문자 이름은 ENV로 인식 안 함', () => {
    const r = maskSensitiveData('database_url=foo');
    expect(r.byPattern.env).toBeUndefined();
  });

  // ─── 8. 이메일 ───
  it('이메일을 마스킹', () => {
    const r = maskSensitiveData('contact: dev@example.com');
    expect(r.masked).toBe('contact: [EMAIL_MASKED]');
    expect(r.byPattern.email).toBe(1);
  });

  it('여러 이메일 모두 카운트', () => {
    const r = maskSensitiveData('a@b.com / c@d.com');
    expect(r.byPattern.email).toBe(2);
  });

  // ─── 통합 ───
  it('여러 패턴이 한 텍스트에 섞여있을 때 모두 처리', () => {
    const text = [
      'DATABASE_URL=postgres://x:y@h/d',
      'token = AKIAIOSFODNN7EXAMPLE',
      'email: u@example.com',
      'password = "hunter2"',
    ].join('\n');

    const r = maskSensitiveData(text);
    expect(r.masked).toContain('DATABASE_URL=[ENV_MASKED]');
    expect(r.masked).toContain('[AWS_KEY_MASKED]');
    expect(r.masked).toContain('[EMAIL_MASKED]');
    expect(r.masked).toContain('"[PASSWORD_MASKED]"');
    expect(r.maskCount).toBe(4);
  });

  it('우선순위: PEM이 다른 패턴보다 먼저 적용', () => {
    // PEM 안에 base64로 보이는 문자열이 있어도 PEM으로 통째 마스킹
    const text =
      '-----BEGIN PRIVATE KEY-----\neyJhbGciOiJIUzI1NiJ9\n-----END PRIVATE KEY-----';
    const r = maskSensitiveData(text);
    expect(r.masked).toBe('[PRIVATE_KEY_MASKED]');
    expect(r.byPattern.private_key).toBe(1);
    expect(r.byPattern.jwt).toBeUndefined();
  });
});

describe('applyMaskingToDiffs', () => {
  it('file_path 보존, diff_content만 마스킹', () => {
    const diffs = [
      {
        file_path: '.env',
        diff_content: '+DATABASE_URL=postgres://x:y@h/d\n-OLD_TOKEN=abc',
        change_type: 'modified' as const,
      },
      {
        file_path: 'README.md',
        diff_content: '+docs',
        change_type: 'added' as const,
      },
    ];

    const r = applyMaskingToDiffs(diffs);
    expect(r.diffs[0].file_path).toBe('.env');
    expect(r.diffs[0].diff_content).toContain('DATABASE_URL=[ENV_MASKED]');
    expect(r.diffs[0].diff_content).not.toContain('postgres://');
    expect(r.diffs[1].diff_content).toBe('+docs');
    expect(r.maskCount).toBe(2);
  });
});
