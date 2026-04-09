import { describe, it, expect } from 'vitest';
import { estimateTokens } from '../claude-client';

describe('estimateTokens', () => {
  it('빈 문자열은 0 토큰이다', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('4글자당 약 1 토큰으로 추정한다', () => {
    const text = 'a'.repeat(100);
    expect(estimateTokens(text)).toBe(25);
  });

  it('한글도 글자 수 기반으로 추정한다', () => {
    const text = '가나다라마바사아자차'; // 10글자
    expect(estimateTokens(text)).toBe(3); // ceil(10/4) = 3
  });

  it('긴 diff 텍스트의 토큰을 추정한다', () => {
    const diff = `@@ -1,10 +1,15 @@
+import { auth } from './middleware';
+
 export async function getUsers(req, res) {
-  const users = await db.query("SELECT * FROM users");
+  const user = await auth(req);
+  if (!user) return res.status(401).json({ error: 'Unauthorized' });
+  const users = await db.query("SELECT * FROM users WHERE org = $1", [user.orgId]);
   res.json(users);
 }`;
    const tokens = estimateTokens(diff);
    expect(tokens).toBeGreaterThan(50);
    expect(tokens).toBeLessThan(200);
  });
});
