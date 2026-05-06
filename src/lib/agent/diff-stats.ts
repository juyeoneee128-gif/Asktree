import type { DiffEntry } from './validate-payload';

/**
 * 통합 diff에서 추가/삭제 라인 수를 합산합니다.
 *
 * 헤더 라인은 제외:
 * - `+++` / `---`: 파일 헤더
 * - `@@`: hunk 헤더
 * - 그 외 `+ ` / `- ` 시작 라인은 변경 라인으로 카운트
 *
 * 빈 라인은 한 글자도 없을 수 있으므로 trim 후 prefix 검사.
 */
export function countDiffLinesInContent(diffContent: string): number {
  if (!diffContent) return 0;

  const lines = diffContent.split('\n');
  let count = 0;

  for (const line of lines) {
    if (line.startsWith('+++') || line.startsWith('---')) continue;
    if (line.startsWith('+') || line.startsWith('-')) count++;
  }

  return count;
}

/**
 * 모든 diff entry의 변경 라인 합.
 */
export function countDiffLines(diffs: DiffEntry[] | undefined | null): number {
  if (!diffs || diffs.length === 0) return 0;
  return diffs.reduce((sum, d) => sum + countDiffLinesInContent(d.diff_content), 0);
}
