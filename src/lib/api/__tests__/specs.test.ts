import { describe, it, expect } from 'vitest';
import { normalizeImplementedItems } from '../specs';

/**
 * normalizeImplementedItems는 spec_features.implemented_items 컬럼(JSONB)을
 * UI FeatureItem 배열로 변환한다.
 *
 * 두 가지 입력 형식을 모두 수용해야 한다:
 *  1) LLM이 반환하는 실제 형식: 단순 문자열 배열 ["이메일 로그인", "세션 관리"]
 *  2) mock/옛 데이터 호환: { name, line?, checked } 객체 배열
 *
 * 1번이 빠지면 현황 탭이 "0/N"으로 표시되는 회귀가 발생하므로 강하게 보호.
 */
describe('normalizeImplementedItems', () => {
  it('string[] 입력을 모든 항목 checked=true인 FeatureItem[]로 변환한다 (LLM 형식 — 정상)', () => {
    const result = normalizeImplementedItems([
      '이메일 로그인',
      '소셜 로그인(Google)',
      '세션 관리',
    ]);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ name: '이메일 로그인', checked: true });
    expect(result[1]).toEqual({ name: '소셜 로그인(Google)', checked: true });
    expect(result[2]).toEqual({ name: '세션 관리', checked: true });
    // line 필드는 LLM이 반환하지 않으므로 누락되어야 함
    expect(result[0]).not.toHaveProperty('line');
  });

  it('{name, line?, checked} 객체 배열도 그대로 받는다 (mock 호환 — 정상)', () => {
    const result = normalizeImplementedItems([
      { name: 'Google OAuth 로그인', line: 15, checked: true },
      { name: '세션 관리', checked: false },
      { name: '로그아웃', line: 67, checked: true },
    ]);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ name: 'Google OAuth 로그인', line: 15, checked: true });
    // checked: false도 보존
    expect(result[1]).toEqual({ name: '세션 관리', checked: false });
    // line 누락 시 line 필드 자체가 없어야 함
    expect(result[1]).not.toHaveProperty('line');
    expect(result[2]).toEqual({ name: '로그아웃', line: 67, checked: true });
  });

  it('빈 배열·배열 아님·잘못된 항목은 빈 결과로 처리한다 (엣지/에러)', () => {
    // 빈 배열
    expect(normalizeImplementedItems([])).toEqual([]);
    // 배열 아님 — 안전하게 빈 배열
    expect(normalizeImplementedItems(null)).toEqual([]);
    expect(normalizeImplementedItems(undefined)).toEqual([]);
    expect(normalizeImplementedItems('not-array')).toEqual([]);
    expect(normalizeImplementedItems(42)).toEqual([]);
    // 잘못된 항목은 필터링되고 정상 항목만 유지
    const mixed = normalizeImplementedItems([
      '정상 문자열',
      null,
      42,
      { wrongKey: 'x' },
      { name: '정상 객체', checked: true },
    ]);
    expect(mixed).toEqual([
      { name: '정상 문자열', checked: true },
      { name: '정상 객체', checked: true },
    ]);
  });
});
