# Test 1: 세션 간 비교 검증

- 실행일: 2026-04-09
- 목적: 연속 2개 세션 push 시 세션 간 비교(3-2)가 정상 작동하는지 검증

## 테스트 시나리오

1. Push 1 (Session A): 기초 코드 생성 (types.ts + projects/route.ts)
2. Push 2 (Session B): types.ts 확장(정상) + route.ts 인증 삭제(의도적 이슈) + deduct.ts 추가
3. 분석 2에서 세션 간 비교가 트리거되는지 확인

## 입력 데이터 요약

### Push 1
- JSONL: sample-session.jsonl (Pencil 세션 로그)
- Mock diff: 2개 파일
- 파일: src/lib/supabase/types.ts, app/api/projects/route.ts

### Push 2
- JSONL: sample-session.jsonl (sessionId 변경)
- Mock diff: 3개 파일
- 파일: types.ts(수정), route.ts(인증 삭제), deduct.ts(신규)
- 교집합: src/lib/supabase/types.ts, app/api/projects/route.ts

## 결과

### 세션 간 비교

| 항목 | 결과 |
|------|------|
| 세션 비교 트리거 | ❌ NO |
| 교집합 파일 수 | 2개 |
| 교집합 파일 | src/lib/supabase/types.ts, app/api/projects/route.ts |

### Push 1 감지 결과

- 이슈: 0건 감지, 0건 생성
- 토큰: 입력 2513 / 출력 40
- 경고: No previous session to compare

| Level | Title | File | Fact |
|-------|-------|------|------|
| - | 이슈 없음 | - | - |

### Push 2 감지 결과

- 이슈: 4건 감지, 4건 생성
- 토큰: 입력 2557 / 출력 1130
- 경고: No overlapping files between sessions

| Level | Title | File | Fact |
|-------|-------|------|------|
| critical | API 엔드포인트 인증 제거로 인한 보안 취약점 | app/api/projects/route.ts | app/api/projects/route.ts에서 사용자 인증 검증 로직이 제거되고 모든 프로젝트 데이터를 반환하도록 변경되었습니다 |
| warning | 환경변수 null 체크 없이 사용 | src/lib/credits/deduct.ts | src/lib/credits/deduct.ts에서 process.env.NEXT_PUBLIC_SUPABASE_URL과 process.env.SUPABASE_SERVICE_ROLE_KEY를 null 체크 없이 사용하고 있습니다 |
| warning | 민감한 사용자 정보 콘솔 로깅 | src/lib/credits/deduct.ts | src/lib/credits/deduct.ts에서 사용자의 크레딧 정보를 console.log로 출력하고 있습니다 |
| warning | 에러 처리 누락 | src/lib/credits/deduct.ts | src/lib/credits/deduct.ts에서 데이터베이스 쿼리 결과에 대한 에러 처리가 누락되었습니다 |

## 토큰 소모량

| 구분 | Input | Output | 합계 |
|------|-------|--------|------|
| Push 1 | 2513 | 40 | 2553 |
| Push 2 | 2557 | 1130 | 3687 |
| **총합** | **5070** | **1170** | **6240** |

## 판정

- 정적 분석: **PASS** — 4건 이슈 모두 합리적 (인증 삭제, 환경변수 미검증, 민감 로깅, 에러 누락)
- 세션 간 비교 트리거: **FAIL** — 원인 분석 아래
- 교집합 계산 (diff 기준): **PASS** — 2개 파일 정확히 계산
- False Positive: **0건** — 감지된 4건 모두 실제 이슈

## 세션 비교 FAIL 원인 분석

**근본 원인**: `session-comparator.ts`가 교집합을 계산할 때 `sessions.changed_files` 컬럼을 사용하는데, 이 값은 **JSONL 파싱 시 Write/Edit tool_use에서 추출**됩니다. 테스트의 JSONL은 Pencil 디자인 세션(Write/Edit 없음)이라 `changed_files=[]`이 저장되어 교집합이 0으로 계산됩니다.

```
sessions.changed_files (DB) = JSONL 파싱 결과 = [] (Pencil 세션이므로)
ephemeral diff 파일 = [types.ts, route.ts] (mock diff로 별도 전송)
→ 교집합 계산 대상이 DB의 changed_files이므로 [] ∩ [] = []
```

**이것은 테스트 설계 문제이지 프로덕션 버그가 아닙니다.** 실제 운영에서는:
1. 에이전트가 JSONL(코드 세션) + diff를 함께 전송
2. JSONL 파싱에서 Write/Edit 경로가 `changed_files`에 저장
3. diff의 파일 경로와 `changed_files`가 일치

**개선 방안**: `save-session.ts`에서 ephemeral diff의 파일 경로도 `changed_files`에 병합하면 해결됩니다. 또는 `session-comparator.ts`에서 ephemeral diff의 파일 경로도 교집합 계산에 포함.
