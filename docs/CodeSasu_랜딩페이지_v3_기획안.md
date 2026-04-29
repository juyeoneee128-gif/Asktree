# CodeSasu 랜딩 페이지 v3 기획안

> 피봇 논의 반영 + Memory.inc / Manyfast 레퍼런스
> 목적: 사전 등록 페이지로 배포하여 수요 검증

---

## 디자인 방향

- **Memory.inc**: 미니멀 + 감성적. 여백 많고, 모션/인터랙션으로 기대감 조성
- **Manyfast**: 기능별 좌우 교차 레이아웃 + 터미널 스크린샷
- **혼합 적용**: Memory의 여백/모션 감각 + Manyfast의 기능 설명 구조
- **톤**: 따뜻하고 신뢰감. "사수가 옆에 있는" 안심감. 기술 용어 최소화.

---

## 로고

- SVG 파일: Claude Design에서 export된 9종
- 헤더: Primary lockup (light) 사용 — `assets/logo-lockup-light.svg`
- 파비콘: `assets/favicon.svg`
- 다크 배경 섹션: Lockup (dark) — `assets/logo-lockup-dark.svg`
- SVG 파일을 `public/brand/` 에 배치

---

## 상단 네비게이션

```
[CodeSasu 로고 lockup]   기능 소개   FAQ          [사전 등록하기]
```

- 스크롤 시 sticky
- 기능 소개: `#features` 앵커 스크롤
- FAQ: `#faq` 앵커 스크롤
- 사전 등록하기: `#register` 앵커 스크롤 (또는 모달)
- MVP에서는 최소한의 메뉴만 (가격 정책은 Beta 이후)

---

## 섹션 구성

### 섹션 1: 히어로

**Memory.inc 스타일**: 대형 타이포 + 여백 + 최소한의 요소

```
[Beta]

내 손안의 사수 개발자

내 코딩 과정을 기억하는 사수:
코드를 몰라도 괜찮아요. 사수가 지켜보고 있으니까.

[사전 등록하기]          [더 알아보기 ↓]
```

- "Beta" pill 배지 (주황 배경)
- 헤드라인: "내 손안의 사수 개발자" (40~56px, bold)
- 서브 헤드라인: 서브 카피 (18~20px, muted)
- CTA: "사전 등록하기" (primary 버튼, #E67D22)
- "더 알아보기 ↓" 텍스트 링크 → 스크롤 유도
- 하단: 제품 스크린샷 placeholder (macOS 윈도우 프레임)

### 섹션 2: 문제 제기 (공감)

**Memory.inc 스타일**: 한 줄씩 강조, 감성적 톤

```
"AI한테 '이거 만들어줘' 하면 뚝딱 나오는데,
 왜 자꾸 어딘가가 망가져 있을까요?"
```

- 큰 따옴표 + 대형 텍스트 (28~36px)
- 아래에 3가지 고충 카드:
  1. "리팩토링했더니 결제 기능이 사라졌는데, 이틀 뒤에 발견"
  2. "빌드는 되는데, 뭐가 잘못된 건지 알 수가 없음"
  3. "컨텍스트가 길어지면서 코드가 슬금슬금 변형됨"
- 각 카드: 아이콘 + 짧은 텍스트 (Memory 스타일의 미니멀 카드)

### 섹션 3: 핵심 가치 한 줄 (전환)

```
CodeSasu는 AI가 코딩하는 모든 순간을
수집하고, 정돈하고, 감시합니다.
```

- 중앙 정렬, 큰 텍스트 (28~32px)
- 배경색 전환 (흰 → 라이트 그레이)

### 섹션 4: 기능 소개 (핵심) — `#features`

**Manyfast + Memory 혼합**: 좌우 교차 레이아웃 + 모션 힌트

각 기능 블록: 텍스트(좌/우) + 시각 자료(우/좌) 교차 배치
시각 자료는 스크린샷 placeholder (macOS 윈도우 프레임)

**기능 1: 자동 수집**
```
[좌: 텍스트]                    [우: 시각화]
에이전트가 알아서 수집합니다     CLI 터미널 이미지
                                (에이전트 로그 표시)
터미널에 한 줄 설치하면, 
Claude Code 세션이 끝날 때마다
코드 변경과 작업 내역을 
자동으로 수집합니다.
기획서(docs/*.md)도 함께 가져옵니다.
```

**기능 2: 세션 정돈 + 트래킹**
```
[좌: 시각화]                    [우: 텍스트]
세션 요약 화면 이미지            내 코딩 과정을 기억합니다

                                "이번 세션에서: 결제 모듈 추가,
                                 인증 미들웨어 수정"
                                
                                세션마다 무엇을 했는지
                                자동으로 정리합니다.
                                코드를 몰라도 프로젝트의
                                현재 상태를 한눈에 파악하세요.
```

**기능 3: 이슈 감지 + Fix**
```
[좌: 텍스트]                    [우: 시각화]
보이지 않는 위험을               이슈 탭 화면 이미지
먼저 알려줍니다                  (Fact → Detail → Fix)

빌드는 되지만 기능이 깨진 문제,
보안 취약점, 환경변수 누락까지
자동으로 감지합니다.
Fix 명령어를 복사해서
Claude Code에 붙여넣기만 하세요.
```

**기능 4: 현황 트래킹**
```
[좌: 시각화]                    [우: 텍스트]
현황 탭 화면 이미지              기획 대비 어디까지 왔는지
(구현률 바 + 기능 목록)          한눈에 보여줍니다

                                기획서에 적은 기능이
                                실제로 얼마나 구현되었는지
                                PRD vs 코드를 자동 대조합니다.
```

**기능 5: 보호 규칙**
```
[좌: 텍스트]                    [우: 시각화]
한 번 당한 문제는               CLAUDE.md 탭 화면 이미지
두 번 없게 지켜줍니다           (보호 규칙 목록)

감지된 문제를 보호 규칙으로
자동 생성합니다.
규칙이 쌓일수록 AI가
함부로 건드리지 못하는
선순환이 만들어집니다.
```

### 섹션 5: 작동 방식 (How it works)

**Memory 스타일**: 좌측에 단계 번호 고정 + 우측에 설명 스크롤

```
사용법은 단순합니다.

01  에이전트 설치        터미널에 한 줄 붙여넣기. 3분이면 끝.
02  평소처럼 코딩        Claude Code로 작업하세요.
                         백그라운드에서 자동 수집.
03  웹에서 확인          코딩이 끝나면 CodeSasu를 열어보세요.
                         이슈, 현황, 세션 요약이 이미 준비되어 있습니다.
```

### 섹션 6: 데이터 정책

**Memory 스타일**: 신뢰감 있는 톤, 아이콘 + 짧은 텍스트

```
당신의 코드는 안전합니다.

🔒 코드 원본은 저장하지 않습니다
   분석 후 즉시 파기 (Ephemeral Processing)

🔐 암호화된 통신
   HTTPS + AES-256 암호화 저장

📋 투명한 수집 범위
   수집: 세션 로그, 변경 diff, docs 문서
   미수집: .env, 비밀번호, 개인정보
```

### 섹션 7: FAQ — `#faq`

아코디언 형식 (현재와 동일, 질문 업데이트):

1. "코드를 모르는데 쓸 수 있나요?"
2. "내 코드가 서버에 저장되나요?"
3. "Claude Code 외에 다른 도구도 지원하나요?"
4. "무료로 쓸 수 있나요?"
5. "기존 SonarQube나 ESLint와 뭐가 다른가요?"

### 섹션 8: 사전 등록 CTA — `#register`

**Memory.inc 스타일**: 감성적 마무리 + 이메일 입력

```
사수가 준비되고 있습니다.

Beta 출시 시 가장 먼저 알려드립니다.
사전 등록하시면 무료 500 크레딧을 드립니다.

[이메일 입력]  [사전 등록하기]

현재 N명이 등록했습니다.
```

- 이메일 입력 필드 + "사전 등록하기" 버튼
- 등록 시 Supabase `waitlist` 테이블에 저장
- 등록 완료 시 "등록 완료! Beta 출시 시 이메일로 알려드리겠습니다." 토스트

---

## 푸터

```
[CodeSasu 로고]
내 손안의 사수 개발자

이용약관  |  개인정보처리방침  |  피드백

hello@codesasu.app

© 2026 CodeSasu. All rights reserved.
```

---

## 기술 구현 노트

### 사전 등록 백엔드
- Supabase에 `waitlist` 테이블 추가: id, email, created_at
- `POST /api/waitlist` 엔드포인트 신규
- 이메일 중복 체크 + 유효성 검증

### 모션/인터랙션 (가능한 범위)
- 히어로: 스크롤 시 fade-in
- 기능 소개: 각 블록 scroll-triggered fade-in (Intersection Observer)
- 사전 등록 완료: confetti 또는 체크마크 애니메이션

### SVG 로고 적용
- `public/brand/` 에 SVG 파일 배치
- LandingHeader: `<Image src="/brand/logo-lockup-light.svg" />`
- LandingFooter: 동일
- Favicon: `app/favicon.svg` 교체

### 기존 코드 수정 범위
- `app/(landing)/page.tsx` — 섹션 구성 변경
- `src/components/features/landing/LandingHeader.tsx` — 로고 + 메뉴 변경
- `src/components/features/landing/LandingFooter.tsx` — 로고 변경
- `src/components/features/landing/sections/` — 각 섹션 컴포넌트 전면 재작성
- 신규: `src/components/features/landing/sections/Register.tsx` — 사전 등록 폼
- 신규: `app/api/waitlist/route.ts` — 사전 등록 API

---

## 참고 레퍼런스
- Memory.inc (memory.inc): 여백, 모션, 감성적 톤, 사전 등록 CTA
- Manyfast (manyfast.io): 좌우 교차 기능 설명, 터미널 스크린샷, 상단 네비 구조
