# CodeSasu 랜딩 페이지 v3 — 최종 기획안

> 워딩 확정본. 이 문서를 기반으로 랜딩 페이지를 수정/재작성한다.
> 디자인 레퍼런스: Memory.inc (여백/모션/감성) + Manyfast (좌우 교차/기능 설명)

---

## 페이지 구조

| 경로 | 역할 |
|------|------|
| `/` | 기능 소개 (메인 랜딩) + 사전 등록 |
| `/about` | 소개글 (왜 만들었는가) — 신규 |
| `/contact` | 문의 폼 — 신규 |

---

## 헤더 (모든 페이지 공통)

```
[CodeSasu 로고 lockup]   소개   기능 소개   FAQ   문의          [사전 등록하기]
```

- 로고: `/logo/logo-lockup-light.svg` (라이트 버전)
- "소개" → `/about`
- "기능 소개" → `/#features` (메인 랜딩 앵커)
- "FAQ" → `/#faq` (메인 랜딩 앵커)
- "문의" → `/contact`
- "사전 등록하기" → `/#register` (메인 랜딩 앵커) — primary 버튼
- 메뉴는 좌측 정렬, "사전 등록하기"만 우측

---

## 메인 랜딩 (`/`)

### 섹션 1: 히어로

```
[Beta]

내 손안의 사수 개발자

AI가 내 코딩 과정을 지켜보고,
문제가 생기면 먼저 알려줍니다.

[사전 등록하기]     [더 알아보기 ↓]

[제품 스크린샷 placeholder — macOS 윈도우 프레임]
```

### 섹션 2: 문제 제기

```
"AI한테 '이거 만들어줘' 하면 뚝딱 나오는데,
 왜 자꾸 어딘가가 망가져 있을까요?"

카드 1: "리팩토링했더니 결제 기능이 사라졌는데, 이틀 뒤에 발견"
카드 2: "빌드는 되는데, 뭐가 잘못된 건지 알 수가 없음"
카드 3: "대화가 길어지면서 코드가 슬금슬금 변형됨"
```

### 섹션 3: 전환 문구

```
코딩하는 모든 순간,
사수가 지켜보고 있습니다.
```

### 섹션 4: 기능 소개 — `#features`

5개 블록, 좌우 교차 레이아웃.

```
01 · 자동 수집
에이전트가 알아서 수집합니다

터미널에 한 줄 설치하면,
Claude Code 세션이 끝날 때마다
코드 변경, 작업 내역, 기획서(docs/*.md)를
자동으로 수집합니다.
따로 업로드하거나 설정할 필요 없습니다.
```

```
02 · 세션 보관
내 코딩 과정을 아카이빙합니다

"이번 세션: 결제 모듈 추가, 인증 미들웨어 수정"
세션마다 무엇을 했는지 자동으로 정리합니다.
코드를 몰라도 프로젝트의 현재 상태를
한눈에 파악할 수 있습니다.
```

```
03 · 이슈 감지
보이지 않는 이슈를 먼저 알려줍니다

빌드는 되지만 기능이 깨진 문제,
인증을 우회하는 위험한 코드,
같은 기능이 중복으로 만들어진 구조까지.
코드를 몰라도 문제의 심각도와
해결 방법을 바로 확인할 수 있습니다.
```

```
04 · 현황 트래킹
기획 대비 어디까지 왔는지 한눈에

기획서에 적은 기능이 실제로
얼마나 구현되었는지 자동 대조합니다.
구현률 바와 기능 목록으로
진행 상황을 시각화합니다.
```

```
05 · 보호 규칙
한 번 발생한 문제는 두 번 없도록

감지된 문제를 CLAUDE.md 보호 규칙으로
자동 생성합니다. 규칙이 쌓일수록
AI가 같은 실수를 반복하지 않는
선순환이 만들어집니다.
```

### 섹션 5: 작동 방식

```
사용법은 단순합니다.

01  에이전트 설치
    터미널에 붙여넣어 간편하게 설치

02  평소처럼 코딩
    Claude Code로 작업하면, 백그라운드에서 자동 수집

03  웹에서 확인
    코딩이 끝나면 CodeSasu를 열어보세요.
    이슈, 현황, 세션 요약이 준비되어 있습니다!
```

### 섹션 6: 데이터 정책

```
당신의 코드는 안전합니다.

코드 원본 미저장          암호화 통신              투명한 수집 범위
분석 후 즉시 파기         HTTPS + AES-256          수집: 세션 로그, diff, docs
(Ephemeral Processing)   암호화 저장               미수집: .env, 비밀번호
```

### 섹션 7: FAQ — `#faq`

```
자주 묻는 질문

Q. 코드를 모르는데 쓸 수 있나요?
A. 네. CodeSasu의 모든 안내는 비개발자 언어로 제공됩니다.
   수정 명령어를 복사해서 Claude Code에 붙여넣기만 하면 됩니다.

Q. 내 코드가 서버에 저장되나요?
A. 아닙니다. 코드 원본은 분석 후 즉시 파기됩니다.
   분석 결과만 안전하게 저장됩니다.

Q. Claude Code 외에 다른 도구도 지원하나요?
A. 현재는 Claude Code 전용입니다.
   Cursor, Windsurf 등은 곧 지원 예정입니다.

Q. 무료로 쓸 수 있나요?
A. 사전 등록 시 500 크레딧을 무료로 드립니다.
   본인 Claude API 키를 등록하면 추가 비용 없이 계속 사용할 수 있습니다.

Q. 기존 코드 검사 도구와 뭐가 다른가요?
A. 기존 도구(SonarQube, ESLint 등)는 개발자용입니다.
   CodeSasu는 같은 가치를 비개발자가 이해할 수 있는 언어로 제공합니다.
```

### 섹션 8: 사전 등록 — `#register`

```
사수가 준비되고 있습니다.

Beta 출시 시 가장 먼저 알려드립니다.
사전 등록하시면 무료 500 크레딧을 드립니다.

[이메일 주소]  [사전 등록하기]

곧 출시 — 사전 등록하고 가장 먼저 만나보세요.

(등록 완료 후)
"더 자세한 정보를 알려주시면 맞춤 안내를 드려요" → 구글폼 링크
```

### 푸터

```
[CodeSasu 로고]
내 손안의 사수 개발자

이용약관 | 개인정보처리방침 | 피드백     hello@codesasu.app

© 2026 CodeSasu. All rights reserved.
```

---

## `/about` 페이지 — 소개

Memory.inc 스타일: 감성적 히어로 이미지 + CEO 에세이

### 상단 히어로
```
AI 시대의 코드 검증 체계를 만들고 있습니다.
```
(큰 텍스트, 배경 이미지 또는 그라데이션)

### 본문

AI로 누구나 코딩하는 시대, 그런데 왜 완성까지는 어려울까요?

AI에게 "이거 만들어줘" 명령하면 프로토타입의 상당 부분까지는 아주 빠르게 만들어줍니다. 그런데 '제대로 된 제품'까지 가는 후반 과정에서 막히곤 하는데요.

명확한 상태 관리 없이 반복 수정이 누적되면서 코드가 슬금슬금 변형됩니다. 어제까지 잘 되던 기능이 오늘 갑자기 안 됩니다. 빌드는 되는데, 뭐가 잘못된 건지 알 수가 없습니다.

개발자가 아니라면, 문제 원인을 구조적으로 추적하기 어렵기 때문입니다.

그래서 다시 AI에게 "고쳐줘"라고 합니다. AI가 부분적으로 해결하지만, 또다시 다른 곳에서 문제가 생깁니다. 이 도돌이표를 몇 번이고 반복하다가, 결국 스파게티 코드가 됩니다.

하지만 이 문제는 단순히 코드를 몰라서 발생하는 것이 아닙니다.

개발자 역시 코드 유실, 에러, 기능 깨짐을 겪습니다. 다만 차이는, 테스트, 버전 관리(Git), 코드 리뷰 등으로 구성된 검증 체계를 통해 이러한 문제를 지속적으로 발견하고 통제할 수 있다는 점입니다.

변경 사항을 하나하나 추적하고, 이전 버전과 비교하며, 문제를 해결하는 일련의 과정. 비개발자는 이러한 절차와 도구에 접근하기 어렵기 때문에, 문제의 원인을 구조적으로 파악하기가 쉽지 않습니다.

AI는 '코드 생성'과 일부 개발 작업을 대체했을 뿐, 개발 워크플로우 전체를 대체하지는 않습니다. 설계, 변경 관리, 검증, 리뷰 — 이 과정은 여전히 사람이 주도해야 합니다.

비개발자도 완성된 제품을 만들 수 있도록, CodeSasu가 검토와 리뷰를 책임집니다.

코딩하는 모든 순간을 자동으로 수집하고, 무엇이 바뀌었는지 정돈하고, 문제가 생기면 사수처럼 먼저 알려줍니다.

코드를 몰라도 괜찮아요. 사수가 지켜보고 있으니까.

Journey Kim
Founder, CodeSasu

---

## `/contact` 페이지 — 문의

Memory.inc 스타일: 미니멀 폼

### 상단
```
문의
팀과 이야기하기
```

### 폼 필드
- 성함 * (필수)
- 이메일 * (필수)
- 소속 (선택)
- 내용 * (필수, textarea)
- [문의 보내기] 버튼

### 하단 안내
```
또는 hello@codesasu.app으로 직접 문의하실 수 있습니다.
```

### 백엔드
- Supabase `inquiries` 테이블: id, name, email, organization, content, created_at
- `POST /api/inquiries` 엔드포인트
- RLS: anon insert 허용, select는 service_role만

---

## 디자인 개선 요구사항

1. Memory.inc + Manyfast 스타일 혼합: 여백 넉넉히, 모션 fade-in
2. 스크린샷 placeholder: macOS 윈도우 프레임 + 그라데이션 배경
3. 아이콘: Lucide 사용 (기존과 동일)
4. 배경 교차: 흰/회 교차 유지
5. 반응형: 모바일 대응 필수
6. 모션: Hero 제외 전 섹션 scroll-triggered fade-in (Intersection Observer)
7. 로고: `/logo/logo-lockup-light.svg` 사용

---

## 백엔드 추가 작업

### Migration: 004_waitlist.sql
```sql
create table waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);
alter table waitlist enable row level security;
create policy "anon can insert" on waitlist for insert to anon with check (true);
create or replace function waitlist_count() returns int
  language sql security definer stable as $$ select count(*)::int from waitlist $$;
grant execute on function waitlist_count() to anon;
```

### Migration: 005_inquiries.sql
```sql
create table inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  organization text,
  content text not null,
  created_at timestamptz not null default now()
);
alter table inquiries enable row level security;
create policy "anon can insert" on inquiries for insert to anon with check (true);
```

### API 엔드포인트
- `POST /api/waitlist` — 이메일 등록
- `GET /api/waitlist` — waitlist_count() 호출
- `POST /api/inquiries` — 문의 등록
