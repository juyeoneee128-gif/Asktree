# Test 2: 의도적 리팩토링 vs 실수 삭제 구분

- 실행일: 2026-04-09
- 목적: 세션 간 비교가 리팩토링/삭제/덮어쓰기를 정확히 구분하는지 검증

## 테스트 시나리오

### Push 1 (기존 코드)
- validation.ts: validateEmail (20줄) + validatePassword (15줄)
- auth-service.ts: login 함수 (82줄, 6단계 로직)
- auth/route.ts: API 라우트 (login 호출)

### Push 2 (3가지 변경)
| 변경 | 내용 | 기대 |
|------|------|------|
| A. 리팩토링 | validateEmail → isValidEmail (호출부 함께 수정) | 이슈 아님 |
| B. 실수 삭제 | validatePassword 삭제 (호출부 미수정) | critical |
| C. 부분 덮어쓰기 | login 82줄 → 12줄 (세션/토큰/로그 소실) | warning~critical |

## 판정 결과

| 판정 | 항목 | 기대 | 결과 |
|------|------|------|------|
| PASS | A. 의도적 리팩토링 (validateEmail→isValidEmail) | 이슈 아님 (false positive 0) | ✅ 이슈 없음 |
| PASS | B. 실수 삭제 (validatePassword 삭제, 호출부 미수정) | critical 이슈 감지 | ✅ 4건 감지 |
| PASS | C. 부분 덮어쓰기 (login 80줄→12줄) | warning~critical 이슈 감지 | ✅ 6건 감지 |
| PASS | 세션 비교 트리거 | YES | ✅ YES |

**전체: ALL PASS**

## 세션 간 비교

| 항목 | 결과 |
|------|------|
| 세션 비교 트리거 | YES |
| 교집합 파일 | src/utils/validation.ts, src/services/auth-service.ts, src/api/auth/route.ts |
| 교집합 수 | 3개 |

## Push 1 이슈

| Level | Title | File | Fact |
|-------|-------|------|------|
| critical | Supabase 서비스 키가 하드코딩됨 | src/services/auth-service.ts | src/services/auth-service.ts에서 process.env.SUPABASE_SERVICE_ROLE_KEY를 null 체크 없이 직접 사용하는 것이 감지되었습니다 |
| critical | 비밀번호 검증 로직이 주석 처리됨 | src/services/auth-service.ts | src/services/auth-service.ts의 login 함수에서 실제 비밀번호 검증 코드(bcrypt.compare)가 주석 처리되어 있는 것이 감지되었습니다 |
| warning | 사용자 ID가 로그에 노출됨 | src/services/auth-service.ts | src/services/auth-service.ts에서 console.log를 통해 사용자 ID가 로그에 기록되는 것이 감지되었습니다 |
| warning | 세션 토큰 생성이 안전하지 않음 | src/services/auth-service.ts | src/services/auth-service.ts에서 crypto.randomUUID()를 사용하여 세션 토큰을 생성하는 것이 감지되었습니다 |

## Push 2 이슈

| Level | Title | File | Fact |
|-------|-------|------|------|
| critical | validatePassword 함수 삭제로 인한 참조 오류 | src/services/auth-service.ts | src/utils/validation.ts에서 validatePassword 함수가 삭제되었지만 src/services/auth-service.ts에서 여전히 import하여 사용하고 있는 것이 감지되었습니다 |
| critical | 인증 로직 완전 제거로 보안 취약점 발생 | src/services/auth-service.ts | 로그인 함수에서 실제 사용자 인증, 비밀번호 검증, 세션 생성 등 핵심 보안 로직이 모두 제거되고 단순히 success: true만 반환하는 것이 감지되었습니다 |
| warning | 에러 처리 누락으로 예외 전파 위험 | src/api/auth/route.ts | src/api/auth/route.ts의 POST 함수에서 login 함수 호출 시 try-catch 블록이 없는 것이 감지되었습니다 |
| critical | validatePassword 함수 삭제됨 | src/utils/validation.ts | src/utils/validation.ts에서 validatePassword 함수가 삭제되었습니다 |
| critical | 로그인 핵심 기능들 삭제됨 | src/services/auth-service.ts | src/services/auth-service.ts에서 DB 조회, 비밀번호 검증, 세션 토큰 생성, 로그인 로그 기록 등 핵심 로직이 삭제되었습니다 |
| warning | LoginResult 인터페이스 삭제됨 | src/services/auth-service.ts | src/services/auth-service.ts에서 LoginResult 인터페이스가 삭제되었습니다 |

## 토큰 소모량

| 구분 | Input | Output | 합계 |
|------|-------|--------|------|
| Push 1 | 3583 | 1135 | 4718 |
| Push 2 | 7332 | 1705 | 9037 |
| **총합** | **10915** | **2840** | **13755** |

## Push 2 경고

- 없음
