/**
 * 민감 데이터 마스킹 — LLM 전송 직전에만 적용.
 *
 * 정책:
 * - DB 저장(ephemeral_data)에는 원본 유지 (분석 재실행 가능)
 * - 마스킹 후 분석 품질이 다소 떨어질 수 있으나 보안 우선
 * - 패턴 우선순위: 긴 매치(PEM) → 구체적 패턴(JWT, AWS) → 일반 패턴 순
 *
 * ENV 패턴(#7)은 등호 좌측 변수명을 보존하고 우측 값만 치환.
 */

export type MaskTag =
  | 'private_key'
  | 'jwt'
  | 'aws_key'
  | 'bearer_token'
  | 'api_key'
  | 'password'
  | 'env'
  | 'email';

const TAG_TO_PLACEHOLDER: Record<MaskTag, string> = {
  private_key: '[PRIVATE_KEY_MASKED]',
  jwt: '[JWT_MASKED]',
  aws_key: '[AWS_KEY_MASKED]',
  bearer_token: '[TOKEN_MASKED]',
  api_key: '[API_KEY_MASKED]',
  password: '[PASSWORD_MASKED]',
  env: '[ENV_MASKED]',
  email: '[EMAIL_MASKED]',
};

interface MaskRule {
  tag: MaskTag;
  pattern: RegExp;
  /**
   * 캡처 그룹을 사용해 부분 치환할 때의 replacer.
   * 미정의면 전체 매치를 placeholder로 치환.
   */
  replacer?: (match: string, ...groups: string[]) => string;
}

// ─── 패턴 정의 (적용 순서 = 배열 순서) ───
// 긴 매치를 먼저 적용해야 짧은 패턴이 부분 매치되지 않음.

const RULES: MaskRule[] = [
  // 1. PEM 블록 (다행, BEGIN/END 매칭)
  {
    tag: 'private_key',
    pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED |)PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH |ENCRYPTED |)PRIVATE KEY-----/g,
  },

  // 2. JWT — base64url 3 segments
  {
    tag: 'jwt',
    pattern: /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
  },

  // 3. AWS Access Key (20자)
  {
    tag: 'aws_key',
    pattern: /\bAKIA[A-Z0-9]{16}\b/g,
  },

  // 4. Bearer 토큰
  {
    tag: 'bearer_token',
    pattern: /\bBearer\s+[\w\-.+/=]{20,}/g,
    replacer: () => `Bearer ${TAG_TO_PLACEHOLDER.bearer_token}`,
  },

  // 5. API 키 prefix — sk-, pk_live_, pk_test_, rk_
  {
    tag: 'api_key',
    pattern: /\b(?:sk-[A-Za-z0-9_\-]{20,}|pk_(?:live|test)_[A-Za-z0-9]{20,}|rk_[A-Za-z0-9]{20,})\b/g,
  },

  // 6. password / passwd / secret 키워드 뒤 따옴표 값
  // password: "xxx" / password = 'xxx' / "secret":"xxx" 등
  {
    tag: 'password',
    pattern: /(["']?(?:password|passwd|secret)["']?\s*[:=]\s*)(["'])([^"'\n\r]+)\2/gi,
    replacer: (_match, prefix: string, quote: string) =>
      `${prefix}${quote}${TAG_TO_PLACEHOLDER.password}${quote}`,
  },

  // 7. ENV 라인 — 대문자 변수명 + 민감 접미사 한정 (오탐 방지)
  // 좌변 보존, 우변만 치환: DATABASE_URL=postgres://... → DATABASE_URL=[ENV_MASKED]
  {
    tag: 'env',
    pattern: /(\b[A-Z][A-Z0-9_]*(?:_KEY|_SECRET|_TOKEN|_URL|_PASSWORD)\s*=\s*)(?:"[^"\n\r]*"|'[^'\n\r]*'|[^\s"'\n\r]+)/g,
    replacer: (_match, lhs: string) => `${lhs}${TAG_TO_PLACEHOLDER.env}`,
  },

  // 8. 이메일
  {
    tag: 'email',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  },
];

export interface MaskResult {
  masked: string;
  maskCount: number;
  byPattern: Partial<Record<MaskTag, number>>;
}

/**
 * 텍스트에서 민감 데이터를 마스킹합니다.
 * 패턴 우선순위 순으로 순차 적용 — 이전 단계에서 치환된 placeholder는 다음 패턴에 매치되지 않도록
 * placeholder가 일반 토큰과 다르도록 설계됨.
 */
export function maskSensitiveData(text: string): MaskResult {
  if (!text) return { masked: text ?? '', maskCount: 0, byPattern: {} };

  let masked = text;
  let total = 0;
  const byPattern: Partial<Record<MaskTag, number>> = {};

  for (const rule of RULES) {
    let count = 0;
    masked = masked.replace(rule.pattern, (match, ...groups) => {
      count++;
      if (rule.replacer) {
        return rule.replacer(match, ...groups);
      }
      return TAG_TO_PLACEHOLDER[rule.tag];
    });

    if (count > 0) {
      byPattern[rule.tag] = count;
      total += count;
    }
  }

  return { masked, maskCount: total, byPattern };
}

/**
 * diff 배열에 마스킹을 적용합니다.
 * file_path는 보존, diff_content만 마스킹.
 */
export function applyMaskingToDiffs<T extends { file_path: string; diff_content: string }>(
  diffs: T[]
): { diffs: T[]; maskCount: number } {
  let total = 0;
  const masked = diffs.map((d) => {
    const result = maskSensitiveData(d.diff_content);
    total += result.maskCount;
    return { ...d, diff_content: result.masked };
  });
  return { diffs: masked, maskCount: total };
}
