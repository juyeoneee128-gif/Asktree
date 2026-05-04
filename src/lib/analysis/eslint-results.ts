// ESLint 결과 처리 — 에이전트가 보낸 raw 결과를 받아 다음 3가지를 수행:
// 1. LLM 컨텍스트 빌더 (정적 분석 프롬프트의 user 메시지에 첨부)
// 2. 직접 이슈 변환 (severity → CodeSasu level/confidence 매핑)
// 3. dedupe 키 제공 (LLM이 같은 ESLint 이슈를 중복 보고하지 않도록)

import type { EslintIssueRaw } from '../agent/validate-payload';
import type { DetectedIssue } from './parse-response';

// LLM 컨텍스트에 표시할 ESLint 결과 최대 개수 (5단계 #7 결정)
const LLM_CONTEXT_LIMIT = 20;

// 직접 이슈 변환에서 제외할 룰 (Negative list 일관성, #4 결정)
// — 이 룰들은 LLM 컨텍스트로만 전달하고 자동 이슈로 만들지 않음
const EXCLUDED_FROM_DIRECT_CONVERSION = new Set([
  '@typescript-eslint/no-unused-vars',
  '@typescript-eslint/no-explicit-any',
]);

// LLM 컨텍스트 노출 시 우선순위 — severity 2(error) > critical 가능성 높은 ruleId 순
const RULE_PRIORITY: Record<string, number> = {
  'no-eval': 100,
  'no-implied-eval': 95,
  'no-unsafe-finally': 90,
  'no-unreachable': 85,
  'no-fallthrough': 80,
  'no-self-compare': 75,
  'no-constant-condition': 70,
  'no-duplicate-case': 65,
  'no-empty': 60,
  eqeqeq: 55,
  '@typescript-eslint/no-unused-vars': 30,
  '@typescript-eslint/no-explicit-any': 25,
};

function rulePriority(ruleId: string | null): number {
  if (!ruleId) return 50; // parser/null ruleId는 중간
  return RULE_PRIORITY[ruleId] ?? 40;
}

/**
 * LLM 컨텍스트에 첨부할 ESLint 결과 섹션을 빌드합니다.
 * 비어있으면 빈 문자열 반환.
 *
 * 정렬: severity 내림차순 → ruleId 우선순위 내림차순 → 파일 경로
 * 상한: 상위 LLM_CONTEXT_LIMIT(20)건. 잘린 건수는 표시.
 */
export function buildEslintContextSection(rawResults: EslintIssueRaw[]): string {
  if (rawResults.length === 0) return '';

  const sorted = [...rawResults].sort((a, b) => {
    if (a.severity !== b.severity) return b.severity - a.severity;
    const pa = rulePriority(a.rule_id);
    const pb = rulePriority(b.rule_id);
    if (pa !== pb) return pb - pa;
    return a.file_path.localeCompare(b.file_path);
  });

  const shown = sorted.slice(0, LLM_CONTEXT_LIMIT);
  const dropped = sorted.length - shown.length;

  const rows = shown
    .map((r) => {
      const severity = r.severity === 2 ? 'error' : 'warn';
      const rule = r.rule_id ?? 'parser';
      return `| ${r.file_path}:${r.line} | ${severity} | ${rule} | ${escapePipe(r.message)} |`;
    })
    .join('\n');

  const footer = dropped > 0 ? `\n\n총 ${rawResults.length}건 (상위 ${LLM_CONTEXT_LIMIT}건만 표시, ${dropped}건 생략)` : `\n\n총 ${rawResults.length}건`;

  return `## 정적 분석 결과 (ESLint)

다음은 사용자 머신에서 실행된 ESLint가 변경 파일에서 감지한 이슈입니다. 이 정보를 참고하여 **맥락적 이슈에만 집중**하세요. 아래 이슈는 자동으로 처리되므로 **중복 보고하지 마세요.**

| 파일:라인 | 심각도 | 규칙 | 메시지 |
|----------|-------|------|--------|
${rows}${footer}`;
}

function escapePipe(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/**
 * ESLint 결과를 CodeSasu DetectedIssue로 직접 변환합니다.
 *
 * - severity 2 → level: warning, confidence: 0.9
 * - severity 1 → level: info, confidence: 0.7
 *   (problems_only 모드는 info: 0이라 자동 truncate됨)
 * - 일부 룰(no-unused-vars, no-explicit-any)은 변환에서 제외 (Negative list 일관성)
 *
 * 중복 변환 방지: 같은 (file, ruleId, line)은 1건으로 합침.
 */
export function convertEslintToIssues(rawResults: EslintIssueRaw[]): DetectedIssue[] {
  const seen = new Set<string>();
  const issues: DetectedIssue[] = [];

  for (const r of rawResults) {
    if (!r.rule_id) continue; // parser 에러 등은 직접 변환 안 함
    if (EXCLUDED_FROM_DIRECT_CONVERSION.has(r.rule_id)) continue;

    const dedupKey = `${r.file_path}::${r.rule_id}::${r.line}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    const isError = r.severity === 2;
    issues.push({
      title: ruleTitle(r.rule_id),
      level: isError ? 'warning' : 'info',
      fact: `${r.file_path}:${r.line}에서 ESLint 규칙 \`${r.rule_id}\`가 감지되었습니다: ${r.message}`,
      detail: ruleDetail(r.rule_id, r.message),
      fix_command: ruleFixCommand(r.rule_id, r.file_path, r.line),
      file: r.file_path,
      basis: `ESLint: ${r.rule_id}`,
      confidence: isError ? 0.9 : 0.7,
      start_line: r.line >= 1 ? r.line : 1,
      end_line: r.line >= 1 ? r.line : 1,
    });
  }

  return issues;
}

/**
 * LLM이 같은 ESLint 이슈를 중복 보고했는지 판단할 dedupe 키 집합.
 * static-analyzer가 LLM 응답과 ESLint 변환 이슈를 합칠 때 사용.
 */
export function buildEslintIssueKeys(rawResults: EslintIssueRaw[]): Set<string> {
  const keys = new Set<string>();
  for (const r of rawResults) {
    if (!r.rule_id) continue;
    keys.add(`${r.file_path}::${r.rule_id}`);
  }
  return keys;
}

// ─── 룰별 사용자 친화 텍스트 ───

function ruleTitle(ruleId: string): string {
  const map: Record<string, string> = {
    'no-eval': 'eval 사용 금지',
    'no-implied-eval': '암시적 eval 사용',
    'no-unreachable': '도달 불가능한 코드',
    'no-constant-condition': '상수 조건문',
    'no-duplicate-case': '중복 case 절',
    'no-empty': '빈 블록',
    'no-fallthrough': 'switch fall-through',
    'no-self-compare': '자기 자신과 비교',
    'no-unsafe-finally': '안전하지 않은 finally',
    eqeqeq: '느슨한 동등성 비교',
  };
  return map[ruleId] ?? `ESLint: ${ruleId}`;
}

function ruleDetail(ruleId: string, message: string): string {
  const map: Record<string, string> = {
    'no-eval':
      'eval은 임의 코드를 실행하므로 보안 취약점(코드 인젝션)의 직접적 원인입니다. 입력값이 외부에서 올 수 있다면 RCE로 이어집니다.',
    'no-implied-eval':
      'setTimeout/setInterval에 문자열을 넘기면 내부적으로 eval과 동일하게 동작합니다. 콜백 함수를 직접 전달하세요.',
    'no-unreachable':
      'return/throw 이후 코드는 절대 실행되지 않습니다. 의도하지 않은 로직 누락 가능성이 있습니다.',
    'no-constant-condition':
      'if(true) 같은 상수 조건은 분기 의도가 의심됩니다. 디버그 코드를 잊었거나 변수를 잘못 쓴 것일 수 있습니다.',
    'no-duplicate-case':
      'switch 문에 중복된 case가 있어 두 번째 case는 절대 도달하지 않습니다.',
    'no-empty':
      '빈 catch/블록은 에러를 조용히 삼키거나 의도가 사라진 코드입니다.',
    'no-fallthrough':
      'switch case에 break/return 없이 다음 case로 떨어지는 패턴은 거의 항상 버그입니다.',
    'no-self-compare':
      'x === x는 NaN 체크가 아니면 항상 true. 다른 변수를 의도한 것이 아닌지 확인하세요.',
    'no-unsafe-finally':
      'finally 블록의 return/throw가 try/catch의 결과를 덮어쓰면 에러가 사라집니다.',
    eqeqeq:
      '== 비교는 타입 강제 변환 때문에 예상 못한 결과를 줍니다. ===를 사용하세요. (null/undefined 체크는 예외로 허용)',
  };
  return map[ruleId] ?? `ESLint 메시지: ${message}`;
}

function ruleFixCommand(ruleId: string, filePath: string, line: number): string {
  const lineRef = `${filePath}:${line}`;
  const map: Record<string, string> = {
    'no-eval': `${lineRef}에서 eval 호출을 안전한 대안으로 교체해줘. 입력이 JSON이면 JSON.parse, 함수 동적 실행이면 함수 매핑 객체로 바꿔줘.`,
    'no-implied-eval': `${lineRef}의 setTimeout/setInterval 인자를 문자열에서 함수로 바꿔줘.`,
    'no-unreachable': `${lineRef}의 도달 불가능한 코드를 제거하거나, 누락된 분기 로직을 복구해줘.`,
    'no-constant-condition': `${lineRef}의 상수 조건 if/while을 실제 변수 기반 조건으로 바꿔줘. 디버그 코드라면 제거해줘.`,
    'no-duplicate-case': `${lineRef}의 중복 case 절을 제거하거나 서로 다른 값으로 분리해줘.`,
    'no-empty': `${lineRef}의 빈 블록을 제거하거나, 에러 처리/로깅 로직을 추가해줘.`,
    'no-fallthrough': `${lineRef}의 case에 break나 return을 추가해줘. 의도한 fall-through라면 // falls through 주석을 명시해줘.`,
    'no-self-compare': `${lineRef}에서 같은 변수끼리 비교하는 부분을 다른 의도된 변수로 수정해줘. NaN 체크라면 Number.isNaN을 써줘.`,
    'no-unsafe-finally': `${lineRef}의 finally 블록에서 return/throw를 제거하고, try/catch 본문에서 처리하도록 옮겨줘.`,
    eqeqeq: `${lineRef}의 ==/!=를 ===/!==로 교체해줘. null/undefined 체크라면 그대로 둬도 좋아.`,
  };
  return map[ruleId] ?? `${lineRef}에서 ESLint 규칙 ${ruleId} 위반을 수정해줘.`;
}
