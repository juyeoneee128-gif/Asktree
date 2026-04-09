# Test 3: OWASP/CWE 보안 감지 정확도

- 실행일: 2026-04-09
- 목적: 7개 실전 보안 취약점에 대한 정적 분석 감지율 측정

## 감지율: 7/7 (100%)

| 판정 | 취약점 | OWASP | CWE | 프롬프트 명시 | 감지된 이슈 |
|------|--------|-------|-----|-------------|------------|
| PASS | 1. XSS (dangerouslySetInnerHTML) | A03:2021 | CWE-79 | ✅ | [critical] XSS 취약점 - 사용자 입력 미검증<br>[warning] 에러 처리 누락 - 비동기 작업 |
| PASS | 2. SSRF (서버 사이드 요청 위조) | A10:2021 | CWE-918 | ❌ | [critical] SSRF 취약점 - URL 검증 부재<br>[warning] 에러 처리 누락 - 비동기 작업 |
| PASS | 3. Path Traversal (경로 조작) | A01:2021 | CWE-22 | ❌ | [critical] 경로 순회 공격 취약점 |
| PASS | 4. Insecure Deserialization (eval/Function) | A08:2021 | CWE-502 | ❌ | [critical] 코드 인젝션 취약점 - eval 사용 |
| PASS | 5. JWT Secret 하드코딩 | A02:2021 | CWE-798 | ✅ | [critical] 하드코딩된 JWT 시크릿 키 노출 |
| PASS | 6. CORS 와일드카드 | A05:2021 | CWE-942 | ❌ | [warning] CORS 설정 과도한 허용 |
| PASS | 7. Race Condition (TOCTOU) | A04:2021 | CWE-362 | ❌ | [critical] 인증 부재 - API 엔드포인트 무보호 |

## 전체 감지 이슈 (8건)

| Level | Title | File | Fact | Basis |
|-------|-------|------|------|-------|
| critical | 하드코딩된 JWT 시크릿 키 노출 | src/lib/jwt.ts | JWT_SECRET과 REFRESH_SECRET이 하드코딩된 문자열로 소스코드에 노출되었습니다 | OWASP A02:2021 Cryptographic Failures |
| critical | XSS 취약점 - 사용자 입력 미검증 | src/components/Comment.tsx | Comment 컴포넌트에서 dangerouslySetInnerHTML을 통해 검증되지 않은 사용자 입력을 직접 렌더링하고 있습니다 | OWASP A03:2021 Injection |
| critical | SSRF 취약점 - URL 검증 부재 | src/api/proxy/route.ts | proxy API에서 사용자가 제공한 URL을 검증 없이 fetch하고 있습니다 | OWASP A10:2021 Server-Side Request Forgery |
| critical | 경로 순회 공격 취약점 | src/api/files/route.ts | files API에서 사용자 입력 name 파라미터를 검증 없이 파일 경로로 사용하고 있습니다 | OWASP A01:2021 Broken Access Control |
| critical | 코드 인젝션 취약점 - eval 사용 | src/utils/config-loader.ts | config-loader에서 eval과 Function 생성자를 사용하여 사용자 입력을 실행하고 있습니다 | OWASP A03:2021 Injection |
| critical | 인증 부재 - API 엔드포인트 무보호 | src/api/credits/deduct/route.ts | credits deduct API에서 사용자 인증 없이 userId를 받아 크레딧을 차감하고 있습니다 | OWASP A01:2021 Broken Access Control |
| warning | CORS 설정 과도한 허용 | src/middleware/cors.ts | CORS 미들웨어에서 모든 도메인('*')에 대해 credentials를 허용하고 있습니다 | OWASP A05:2021 Security Misconfiguration |
| warning | 에러 처리 누락 - 비동기 작업 | src/components/Comment.tsx | Comment 컴포넌트의 fetch 요청과 여러 API 엔드포인트에서 에러 처리가 누락되었습니다 | OWASP A09:2021 Security Logging and Monitoring Failures |

## False Positive

| Level | Title | File | Fact |
|-------|-------|------|------|
| - | False Positive 없음 | - | - |

## 토큰 소모

| Input | Output | 합계 |
|-------|--------|------|
| 2838 | 2120 | 4958 |



## 경고

- No previous session to compare

## 테스트 중 발견 및 수정한 이슈

### static-analyzer.ts maxTokens 부족
- 최초 실행 시 0/7 감지 (issues field is not an array)
- 원인: `callStaticAnalysis`가 기본 `maxTokens: 4096` 사용 → 7파일 분석 시 출력 잘림
- 수정: `maxTokens: 8192`로 변경
- 추가 발견: diff 텍스트에 template literal 이스케이프 문자가 많으면 JSONB 저장 시 깨질 수 있음 → compact diff 형식 사용 권장

### 프롬프트 개선 불필요 (7/7)
- 프롬프트에 명시되지 않은 5개 카테고리(SSRF, Path Traversal, eval, CORS, Race Condition)도 Claude Sonnet이 자체 판단으로 감지
- 현재 프롬프트의 "OWASP Top 10" 언급만으로도 충분한 보안 감지 범위 확보
