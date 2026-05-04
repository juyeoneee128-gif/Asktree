import { describe, it, expect } from 'vitest';
import {
  buildEslintContextSection,
  convertEslintToIssues,
  buildEslintIssueKeys,
} from '../eslint-results';
import type { EslintIssueRaw } from '../../agent/validate-payload';

function raw(overrides: Partial<EslintIssueRaw> = {}): EslintIssueRaw {
  return {
    file_path: 'src/foo.ts',
    line: 1,
    column: 1,
    rule_id: 'no-eval',
    severity: 2,
    message: 'eval can be harmful',
    ...overrides,
  };
}

describe('buildEslintContextSection', () => {
  it('빈 배열이면 빈 문자열을 반환한다', () => {
    expect(buildEslintContextSection([])).toBe('');
  });

  it('헤더와 테이블 형식을 포함한다', () => {
    const ctx = buildEslintContextSection([
      raw({ file_path: 'src/a.ts', line: 12, rule_id: 'no-eval', message: 'eval used' }),
    ]);
    expect(ctx).toContain('## 정적 분석 결과 (ESLint)');
    expect(ctx).toContain('| 파일:라인 | 심각도 | 규칙 | 메시지 |');
    expect(ctx).toContain('src/a.ts:12');
    expect(ctx).toContain('no-eval');
    expect(ctx).toContain('eval used');
    expect(ctx).toContain('총 1건');
  });

  it('severity 2(error)가 severity 1(warn)보다 먼저 정렬된다', () => {
    const ctx = buildEslintContextSection([
      raw({ file_path: 'src/a.ts', rule_id: 'eqeqeq', severity: 1, message: 'use ===' }),
      raw({ file_path: 'src/b.ts', rule_id: 'no-eval', severity: 2, message: 'eval' }),
    ]);
    const errorIdx = ctx.indexOf('no-eval');
    const warnIdx = ctx.indexOf('eqeqeq');
    expect(errorIdx).toBeGreaterThan(0);
    expect(warnIdx).toBeGreaterThan(errorIdx);
  });

  it('같은 severity 내에서는 룰 우선순위가 높은 게 먼저', () => {
    // no-eval(100) > no-unreachable(85) > no-empty(60)
    const ctx = buildEslintContextSection([
      raw({ rule_id: 'no-empty', message: 'empty' }),
      raw({ rule_id: 'no-eval', message: 'eval' }),
      raw({ rule_id: 'no-unreachable', message: 'unreachable' }),
    ]);
    const evalIdx = ctx.indexOf('| no-eval |');
    const unreachIdx = ctx.indexOf('| no-unreachable |');
    const emptyIdx = ctx.indexOf('| no-empty |');
    expect(evalIdx).toBeLessThan(unreachIdx);
    expect(unreachIdx).toBeLessThan(emptyIdx);
  });

  it('20건 초과 시 상위 20건만 표시 + 잘린 건수 안내', () => {
    // 우선순위가 높은 25건과 낮은 1건 → 상위 20건은 high priority, 낮은 건 잘림
    const items = [
      ...Array.from({ length: 25 }, (_, i) =>
        raw({ file_path: `src/file_${String(i).padStart(2, '0')}.ts`, rule_id: 'no-eval', message: `high-${i}` })
      ),
      raw({ file_path: 'src/lo.ts', rule_id: 'eqeqeq', severity: 1, message: 'low-priority' }),
    ];
    const ctx = buildEslintContextSection(items);
    expect(ctx).toContain('총 26건');
    expect(ctx).toContain('상위 20건만 표시');
    expect(ctx).toContain('6건 생략');
    // 우선순위가 낮은 eqeqeq는 잘림 컷오프 뒤로 밀려 본문에 없어야 함
    expect(ctx).not.toContain('low-priority');
  });

  it('rule_id가 null이면 "parser"로 표시', () => {
    const ctx = buildEslintContextSection([
      raw({ rule_id: null, message: 'unexpected token' }),
    ]);
    expect(ctx).toContain('parser');
  });

  it('파이프(|) 문자는 escape', () => {
    const ctx = buildEslintContextSection([
      raw({ message: 'pipe | inside' }),
    ]);
    expect(ctx).toContain('pipe \\| inside');
  });
});

describe('convertEslintToIssues', () => {
  it('빈 배열이면 빈 배열 반환', () => {
    expect(convertEslintToIssues([])).toEqual([]);
  });

  it('severity 2 → warning + confidence 0.9', () => {
    const issues = convertEslintToIssues([
      raw({ rule_id: 'no-eval', severity: 2, line: 8 }),
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0].level).toBe('warning');
    expect(issues[0].confidence).toBe(0.9);
    expect(issues[0].start_line).toBe(8);
    expect(issues[0].end_line).toBe(8);
    expect(issues[0].basis).toBe('ESLint: no-eval');
  });

  it('severity 1 → info + confidence 0.7', () => {
    const issues = convertEslintToIssues([
      raw({ rule_id: 'eqeqeq', severity: 1 }),
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0].level).toBe('info');
    expect(issues[0].confidence).toBe(0.7);
  });

  it('rule_id가 null인 (parser 에러) 케이스는 변환에서 제외', () => {
    const issues = convertEslintToIssues([
      raw({ rule_id: null, severity: 2, message: 'unexpected token' }),
    ]);
    expect(issues).toHaveLength(0);
  });

  it('no-unused-vars / no-explicit-any는 직접 변환 제외 (Negative list 일관성)', () => {
    const issues = convertEslintToIssues([
      raw({ rule_id: '@typescript-eslint/no-unused-vars' }),
      raw({ rule_id: '@typescript-eslint/no-explicit-any' }),
      raw({ rule_id: 'no-eval' }), // 이건 변환됨
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0].basis).toBe('ESLint: no-eval');
  });

  it('같은 (file, ruleId, line) 키는 1건으로 dedupe', () => {
    const issues = convertEslintToIssues([
      raw({ file_path: 'a.ts', rule_id: 'no-eval', line: 10 }),
      raw({ file_path: 'a.ts', rule_id: 'no-eval', line: 10, message: 'duplicate' }),
      raw({ file_path: 'a.ts', rule_id: 'no-eval', line: 11 }), // 다른 라인은 별건
    ]);
    expect(issues).toHaveLength(2);
  });

  it('변환된 이슈는 사용자 친화 title/detail/fix_command를 갖는다', () => {
    const issues = convertEslintToIssues([
      raw({ rule_id: 'no-eval', file_path: 'src/api/x.ts', line: 5 }),
    ]);
    expect(issues[0].title).toContain('eval');
    expect(issues[0].detail).toContain('보안');
    expect(issues[0].fix_command).toContain('src/api/x.ts:5');
    expect(issues[0].fix_command).not.toContain('eval(');  // 코드 블록 금지 — 자연어
  });

  it('line이 0/누락이어도 start_line/end_line은 1 이상으로 정규화', () => {
    const issues = convertEslintToIssues([
      raw({ rule_id: 'no-eval', line: 0 }),
    ]);
    expect(issues[0].start_line).toBeGreaterThanOrEqual(1);
    expect(issues[0].end_line).toBeGreaterThanOrEqual(1);
    expect(issues[0].end_line).toBeGreaterThanOrEqual(issues[0].start_line);
  });
});

describe('buildEslintIssueKeys', () => {
  it('빈 배열이면 빈 Set 반환', () => {
    expect(buildEslintIssueKeys([]).size).toBe(0);
  });

  it('(file, ruleId) 키를 생성한다', () => {
    const keys = buildEslintIssueKeys([
      raw({ file_path: 'a.ts', rule_id: 'no-eval' }),
      raw({ file_path: 'b.ts', rule_id: 'no-empty' }),
    ]);
    expect(keys.has('a.ts::no-eval')).toBe(true);
    expect(keys.has('b.ts::no-empty')).toBe(true);
    expect(keys.size).toBe(2);
  });

  it('rule_id가 null이면 키에서 제외', () => {
    const keys = buildEslintIssueKeys([
      raw({ file_path: 'a.ts', rule_id: null }),
      raw({ file_path: 'b.ts', rule_id: 'no-eval' }),
    ]);
    expect(keys.size).toBe(1);
    expect(keys.has('b.ts::no-eval')).toBe(true);
  });
});
