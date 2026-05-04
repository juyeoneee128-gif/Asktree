import { describe, it, expect } from 'vitest';
import { inferDocType } from '../sync-docs';

describe('inferDocType', () => {
  it('frd_ 접두사는 FRD', () => {
    expect(inferDocType('docs/frd_v1.md')).toBe('FRD');
    expect(inferDocType('docs/frd_v2_final.md')).toBe('FRD');
    expect(inferDocType('docs/frd-v1.md')).toBe('FRD');
  });

  it('파일명에 frd 포함되면 FRD', () => {
    expect(inferDocType('docs/specs/my_frd_doc.md')).toBe('FRD');
    expect(inferDocType('docs/FRD.md')).toBe('FRD'); // 대소문자 무관
  });

  it('prd_ 접두사 또는 prd 포함은 PRD', () => {
    expect(inferDocType('docs/prd_v3.md')).toBe('PRD');
    expect(inferDocType('docs/PRD_v1_final.md')).toBe('PRD');
    expect(inferDocType('docs/my_prd_doc.md')).toBe('PRD');
  });

  it('패턴 매칭 안 되면 PRD가 기본', () => {
    expect(inferDocType('docs/architecture.md')).toBe('PRD');
    expect(inferDocType('docs/specs/feature_list.md')).toBe('PRD');
    expect(inferDocType('docs/README.md')).toBe('PRD');
  });

  it('디렉토리 경로는 매칭에 영향 없음 — basename만 사용', () => {
    // 디렉토리에 frd 있어도 파일명이 prd면 PRD
    expect(inferDocType('docs/frd_archive/prd_v1.md')).toBe('PRD');
    // 반대
    expect(inferDocType('docs/prd_archive/frd_v1.md')).toBe('FRD');
  });

  it('확장자 .md는 매칭에서 제외', () => {
    // 확장자 없는 frd는 인식
    expect(inferDocType('docs/frd_v1.md')).toBe('FRD');
    // .md를 제거한 noExt에 대해서만 매칭
    expect(inferDocType('docs/MyDoc.md')).toBe('PRD');
  });
});
