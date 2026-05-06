import { describe, it, expect } from 'vitest';
import { countDiffLines, countDiffLinesInContent } from '../diff-stats';
import type { DiffEntry } from '../validate-payload';

describe('countDiffLinesInContent', () => {
  it('returns 0 for empty content', () => {
    expect(countDiffLinesInContent('')).toBe(0);
  });

  it('counts only +/- lines, ignoring +++/--- and @@ headers', () => {
    const diff = [
      '--- a/file.ts',
      '+++ b/file.ts',
      '@@ -1,3 +1,4 @@',
      ' unchanged',
      '+added line',
      '+another added',
      '-removed line',
      ' context',
    ].join('\n');
    expect(countDiffLinesInContent(diff)).toBe(3);
  });

  it('counts pure addition diff', () => {
    const diff = '--- /dev/null\n+++ b/new.ts\n@@ -0,0 +1,2 @@\n+line1\n+line2';
    expect(countDiffLinesInContent(diff)).toBe(2);
  });

  it('counts pure deletion diff', () => {
    const diff = '--- a/old.ts\n+++ /dev/null\n@@ -1,2 +0,0 @@\n-line1\n-line2';
    expect(countDiffLinesInContent(diff)).toBe(2);
  });

  it('handles mixed +/- across multiple hunks', () => {
    const diff = [
      '--- a/file.ts',
      '+++ b/file.ts',
      '@@ -1,2 +1,2 @@',
      '-old1',
      '+new1',
      '@@ -10,2 +10,2 @@',
      '-old2',
      '+new2',
    ].join('\n');
    expect(countDiffLinesInContent(diff)).toBe(4);
  });
});

describe('countDiffLines', () => {
  it('returns 0 for null/undefined/empty', () => {
    expect(countDiffLines(null)).toBe(0);
    expect(countDiffLines(undefined)).toBe(0);
    expect(countDiffLines([])).toBe(0);
  });

  it('sums across multiple diff entries', () => {
    const diffs: DiffEntry[] = [
      {
        file_path: 'a.ts',
        diff_content: '--- a/a.ts\n+++ b/a.ts\n@@\n+x\n-y',
        change_type: 'modified',
      },
      {
        file_path: 'b.ts',
        diff_content: '+only added\n+another',
        change_type: 'added',
      },
    ];
    expect(countDiffLines(diffs)).toBe(4);
  });
});
