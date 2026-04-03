# Asktree Storybook 컴포넌트 목록 + 구축 가이드

2026.04.03. PRD v9.1 / 기능명세서 v9.1 / Pencil 디자인 기반.

---

## 진행 순서 요약

| Phase | 소요 | 내용 |
| --- | --- | --- |
| Phase 1 | 1일 | 디자인 토큰 + 기초 컴포넌트 (Button, Badge, Icon, TextLink) |
| Phase 2 | 1일 | 레이아웃 컴포넌트 (Sidebar, GlobalHeader, MasterDetailLayout) |
| Phase 3 | 1~2일 | 데이터 표시 + 인터랙션 컴포넌트 |
| Phase 4 | 0.5일 | 페이지 레벨 조합 컴포넌트 |

---

## Tier 1 — 디자인 토큰 + 기초 (가장 먼저)

### 1. Design Tokens (CSS 변수)

모든 컴포넌트의 기반. globals.css 또는 tailwind.config에 정의.

```
/* 컬러 — Warm Gray (Stone) */
--gray-50: #FAFAF9
--gray-100: #F5F5F4
--gray-200: #E7E5E4
--gray-300: #D6D3D1
--gray-400: #A8A29E
--gray-500: #78716C
--gray-600: #57534E
--gray-700: #44403C
--gray-800: #292524
--gray-900: #1C1917
--gray-950: #0C0A09

/* 컬러 — Orange */
--orange-50: #FFF7ED
--orange-100: #FFEDD5
--orange-200: #FED7AA
--orange-300: #FDBA74
--orange-400: #FB923C
--orange-500: #F97316
--orange-600: #E67D22  ← Primary
--orange-700: #C2410C
--orange-800: #9A3412
--orange-900: #7C2D12
--orange-950: #431407

/* Semantic */
--primary: #E67D22
--primary-foreground: #FFFFFF
--foreground: #1C1917
--background: #FFFFFF
--muted: #F5F5F4
--muted-foreground: #78716C
--border: #E7E5E4
--input: #E7E5E4
--card: #FFFFFF
--card-foreground: #1C1917
--destructive: #DC2626
--ring: #E67D22

/* Semantic Status */
--color-error: #DC2626
--color-warning: #EAB308
--color-success: #16A34A
--color-info: #3B82F6

/* 타이포 */
--font-primary: Pretendard
--font-mono: JetBrains Mono (또는 Roboto Mono)

/* Radius */
--radius-sm: 4px
--radius-m: 6px
--radius-lg: 8px
--radius-xl: 12px
--radius-pill: 9999px

/* 배경색 4단계 명도 위계 */
글로벌 헤더: #F5F5F4 + 하단 #E7E5E4 border
좌측 사이드바: #FFFFFF
좌측 리스트: #F5F5F4
우측 패널: #FAFAF9
카드: #FFFFFF + shadow (0 1px 3px rgba(0,0,0,0.08))
```

### 2. Button

6가지 variant × 3가지 size.

| Variant | 기본 배경 | 기본 텍스트 | hover | active |
| --- | --- | --- | --- | --- |
| Primary | #E67D22 | #FFFFFF | #C2410C | #9A3412 |
| Outline | transparent + border #E7E5E4 | #1C1917 | 배경 #F5F5F4 | 배경 #E7E5E4 |
| Ghost | transparent | #78716C | 배경 #F5F5F4 | 배경 #E7E5E4 |
| Confirm (확인완료) | #44403C | #FFFFFF | #292524 | #1C1917 |
| Destructive | #DC2626 | #FFFFFF | #B91C1C | #991B1B |
| Destructive Ghost | transparent + border #FCA5A5 | #DC2626 | 배경 #FEF2F2 | 배경 #FEE2E2 |

Size: sm (h-8, px-3, text-13px) / md (h-10, px-4, text-14px) / lg (h-12, px-6, text-16px)

공통: border-radius 8px, font-weight 600, transition 150ms

### 3. Text Link

| Variant | 기본 컬러 | hover |
| --- | --- | --- |
| Primary | #E67D22 | 밑줄 표시 |
| Destructive | #DC2626 | 밑줄 표시 |
| Muted | #A8A29E | #78716C |

font-size: 13px 또는 14px (prop). 밑줄 기본 없음.

### 4. Badge

| Variant | 배경 | 텍스트 |
| --- | --- | --- |
| Critical | #FEF2F2 | #DC2626 |
| Warning | #FFF7ED | #F97316 |
| Info | #EFF6FF | #3B82F6 |
| 구현완료 | #EFF6FF | #1E40AF |
| 부분구현 | #FFF7ED | #C2410C |
| 미구현 | #F5F5F4 | #A8A29E |
| 확인필요 | #FEE2E2 | #DC2626 |
| Sidebar Count | #F5F5F4 | #78716C |

크기: 기본 (px-2, py-0.5, text-12px, font-600, radius-pill) / Sidebar (20x20 원형, text-11px)

### 5. Icon

lucide-react 기반. 사용되는 아이콘 목록:

- 네비게이션: home, bar-chart-2, alert-circle, file-text, clock, settings, folder, star, trash-2
- 액션: copy, check, search, refresh-cw, log-out, plus, x, external-link
- 상태: shield, key, user, wifi, wifi-off, alert-triangle, info, chevron-down, chevron-right, chevron-left
- 기타: coins, edit-2

기본 크기: 16px (sm) / 18px (md) / 20px (lg) / 40px (xl — 빈 상태 아이콘)

---

## Tier 2 — 레이아웃 컴포넌트

### 6. Sidebar

| 요소 | 스펙 |
| --- | --- |
| 너비 | 220px |
| 배경 | #FFFFFF |
| 우측 border | 1px #E7E5E4 |
| 프로젝트 셀렉터 | 프로젝트명 + chevron-down(▾) 14px #A8A29E |
| 메뉴 항목 | padding 10px 16px, 14px, #78716C |
| 활성 메뉴 | 좌측 3px --primary 세로선 + --primary 텍스트 |
| 배지 | Badge(Sidebar Count) — 0이면 미표시 |
| 하단 | StatusDot("연결됨"/"미연결") + "크레딧: N" 미니 카드 |

Props: menuItems[], activeMenu, projectName, agentStatus, credits, onMenuClick, onProjectSelect

### 7. GlobalHeader

| 요소 | 스펙 |
| --- | --- |
| 배경 | #F5F5F4 |
| 하단 border | 1px #E7E5E4 |
| 높이 | 56px |
| 좌측 슬롯 | children (배지, 요약 텍스트 등) |
| 우측 슬롯 | children (버튼, 타임스탬프 등) |

Props: leftContent, rightContent

### 8. MasterDetailLayout

| 요소 | 스펙 |
| --- | --- |
| 좌측 리스트 | 35% 너비, 배경 #F5F5F4 |
| 우측 패널 | 65% 너비, 배경 #FAFAF9 |
| 구분선 | 1px #E7E5E4 세로선 |

Props: listContent, detailContent, listWidth (기본 35%)

### 9. SectionHeader

| 요소 | 스펙 |
| --- | --- |
| 배경 | #E7E5E4 |
| padding | 8px 20px |
| 텍스트 | 12px, Bold, #78716C |
| chevron | down(펼침) / right(접힘) |
| 카운트 | "(N)" |

Props: title, count, isExpanded, onToggle

---

## Tier 3 — 데이터 표시 컴포넌트

### 10. Card

기본 카드 컨테이너.

| 요소 | 스펙 |
| --- | --- |
| 배경 | #FFFFFF |
| border-radius | 12px |
| border | 1px #E7E5E4 |
| shadow | 0 1px 3px rgba(0,0,0,0.08) |
| hover shadow | 0 2px 8px rgba(0,0,0,0.1) |
| padding | 20px (기본) |

Props: children, padding, hasBorder, variant("default"/"danger" — danger는 border #FCA5A5)

### 11. MetricCard

| 요소 | 스펙 |
| --- | --- |
| 레이블 | 12px #A8A29E |
| 값 | 24px Bold #1C1917 (또는 --primary 등 컬러) |
| 부제 | 12px #A8A29E |

Props: label, value, valueColor, subtitle

### 12. ListItem

좌측 리스트의 항목.

| 상태 | 배경 | 좌측 선 | 제목 스타일 |
| --- | --- | --- | --- |
| 선택됨 | #FFFFFF | 3px 레벨 컬러 | 14px SemiBold #1C1917 |
| 비선택 | transparent | 없음 | 14px #1C1917 |
| 확인완료 | transparent | 없음 | 14px #78716C + 체크 아이콘 |
| 해결됨 | transparent | 없음 | 14px #A8A29E + 취소선 + 체크 #D6D3D1 |

Props: title, subtitle, badge(레벨), isSelected, status("active"/"confirmed"/"resolved"), accentColor, onClick

### 13. FactCard

| 요소 | 스펙 |
| --- | --- |
| 배경 | #FFFFFF |
| border-left | 3px (레벨 컬러: Critical=#DC2626, Warning=#F97316) |
| 본문 | 14px #1C1917 |

Props: children, level("critical"/"warning"/"info")

### 14. FixBox

| 요소 | 스펙 |
| --- | --- |
| 배경 | --primary 투명도 5% (#E67D22 / opacity 0.05) |
| 레이블 | ">_ 복구 명령어 — Claude Code에 붙여넣으세요" --primary 텍스트 |
| 본문 | 모노스페이스, 13px, #1C1917 |
| 복사 버튼 | 우측 하단, Outline 스타일 |

Props: command(텍스트), onCopy

### 15. TechDetailCard

| 요소 | 스펙 |
| --- | --- |
| 3열 | 관련 파일 / 감지 근거 / 감지 시간 |
| 레이블 | 12px #A8A29E |
| 값 | 14px SemiBold #1C1917 |
| 구분선 | 1px #E7E5E4 세로선 |

Props: file, basis, time

### 16. CodeBlock

| 요소 | 스펙 |
| --- | --- |
| 배경 | #292524 |
| border-radius | 8px |
| padding | 16px |
| 텍스트 | 모노스페이스, 13px, #E7E5E4 |
| 복사 버튼 | 우측 상단 |

Props: code(텍스트), onCopy, showCopyButton(기본 true)

### 17. ProgressBar

| 요소 | 스펙 |
| --- | --- |
| 전체 바 | 배경 #E7E5E4, height 6px, radius pill |
| 채움 | --primary (#E67D22), transition width 300ms |

Props: value(0~100), color(기본 --primary)

### 18. StatusDot

| 상태 | 컬러 | 크기 |
| --- | --- | --- |
| 연결됨 | #16A34A | 8px |
| 미연결 | #DC2626 | 8px |
| 구현 | #1E40AF | 6px |
| 부분구현 | #C2410C | 6px |
| 미구현 | #E7E5E4 (빈 원, border) | 6px |
| API 미연결 | #F97316 | 8px |

Props: status, size(기본 8px)

---

## Tier 4 — 인터랙션 컴포넌트

### 19. Modal

| 요소 | 스펙 |
| --- | --- |
| 오버레이 | #000000 opacity 50% |
| 모달 | #FFFFFF, border-radius 16px, shadow-xl, padding 32px |
| 타이틀 | 아이콘 slot + 20px Bold #1C1917 |
| 본문 | children slot |
| 버튼 | 우측 정렬, gap 12px |
| 애니메이션 | 오버레이 fade-in 200ms + 모달 scale 0.95→1.0 200ms |

Props: isOpen, onClose, title, icon, children, actions(버튼 배열), width(기본 480px)

### 20. Toast

| 요소 | 스펙 |
| --- | --- |
| 위치 | fixed, 하단 중앙, bottom 40px |
| 스타일 | #1C1917 배경, radius 8px, padding 12px 20px, shadow-lg |
| 내용 | check 아이콘 #16A34A + 메시지 13px #FFFFFF |
| 동작 | fade-in 300ms, 3초 후 fade-out 300ms |

Props: message, icon, duration(기본 3000ms), isVisible

### 21. Tooltip

| 요소 | 스펙 |
| --- | --- |
| 트리거 | ⓘ info 아이콘 (16px, #A8A29E) hover |
| 위치 | 아이콘 아래, 좌측 정렬 |
| 스타일 | #1C1917 배경, radius 8px, padding 8px 12px, 상단 삼각형 화살표 |
| 텍스트 | 12px #FFFFFF |
| 최대 너비 | 240px |

Props: content(텍스트), children(트리거 요소)

### 22. Dropdown

| 요소 | 스펙 |
| --- | --- |
| 스타일 | #FFFFFF, radius 8px, shadow-lg, border 1px #E7E5E4 |
| padding | 4px 0 |
| 항목 | 아이콘 14px + 텍스트 14px, padding 10px 16px |
| hover | 배경 #FAFAF9 |
| 구분선 | 1px #E7E5E4 |
| 위험 항목 | 아이콘 + 텍스트 #DC2626 |
| 애니메이션 | fade-in + translateY(-4px→0) 150ms |

Props: items[{icon, label, onClick, variant("default"/"danger")}], isOpen, onClose

### 23. InputField

| 요소 | 스펙 |
| --- | --- |
| border | 1px #E7E5E4 |
| border-radius | 8px |
| padding | 12px 16px |
| 텍스트 | 14px #1C1917 |
| placeholder | 14px #D6D3D1 |
| focus | border --primary (#E67D22) |
| 레이블 | 13px #78716C, 위 8px 간격 |

Props: label, placeholder, value, onChange, type("text"/"password"), error(에러 메시지)

### 24. Stepper

| 요소 | 스펙 |
| --- | --- |
| 스텝 수 | 3 (고정) |
| 활성 | --primary 배경 원형 + 흰색 번호 + --primary 텍스트 |
| 비활성 | #E7E5E4 배경 원형 + #A8A29E 번호 + #A8A29E 텍스트 |
| 완료 | --primary 배경 + 체크 아이콘 |
| 연결선 | #E7E5E4 (비활성) / --primary (완료) |

Props: steps[{label}], currentStep(0~2)

---

## Tier 5 — 조합 컴포넌트 (페이지 레벨)

### 25. EmptyState

| 요소 | 스펙 |
| --- | --- |
| 정렬 | 세로/가로 중앙 |
| 아이콘 | 40px, #A8A29E (또는 --primary) |
| 타이틀 | 20px SemiBold #1C1917, 아이콘 아래 16px |
| 설명 | 14px #78716C, 타이틀 아래 8px (여러 줄 가능) |
| CTA 버튼 | Primary, 최대 너비 240px, 설명 아래 24px |
| 보조 버튼 | Outline (선택적), CTA 아래 12px |

Props: icon, title, description, primaryAction({label, onClick}), secondaryAction (선택)

### 26. SettingsCardGrid

| 요소 | 스펙 |
| --- | --- |
| 그리드 | 3열, gap 20px |
| 카드 | Card 컴포넌트 사용 |
| 위험 영역 | 카드 아래 32px, 구분선 위 + 좌측 "위험 영역" #DC2626 + 우측 Destructive Ghost 버튼 |

Props: cards[{icon, title, content, linkLabel, linkHref}], dangerAction({description, buttonLabel, onClick})

### 27. AlertBanner

| 요소 | 스펙 |
| --- | --- |
| 위치 | 글로벌 헤더 아래 |
| 전체 너비 | 100% |
| padding | 12px 24px |
| 배경 | 경고(#FFF7ED) 또는 오류(#FEF2F2) |
| 아이콘 + 텍스트 | 14px #1C1917 |
| 액션 버튼 | 우측, Primary 또는 Outline |
| 닫기 | x 아이콘 우측 끝 |

Props: variant("warning"/"error"), message, action({label, onClick}), onClose

---

## VS Code(Claude Code) 작업 가이드

### 프로젝트 초기 세팅

```bash
# Next.js 프로젝트 디렉토리에서
npx storybook@latest init
```

### 디렉토리 구조 (권장)

```
src/
  components/
    ui/           ← Tier 1~4 컴포넌트
      Button.tsx
      Button.stories.tsx
      Badge.tsx
      Badge.stories.tsx
      ...
    layout/       ← Tier 2 레이아웃
      Sidebar.tsx
      Sidebar.stories.tsx
      GlobalHeader.tsx
      MasterDetailLayout.tsx
      ...
    composite/    ← Tier 5 조합
      EmptyState.tsx
      SettingsCardGrid.tsx
      ...
  styles/
    globals.css   ← 디자인 토큰
    tokens.ts     ← JS에서 사용할 토큰 상수
```

### 작업 순서

1. globals.css에 디자인 토큰 정의
2. Button 컴포넌트 + Story 작성 → Storybook에서 6 variant 확인
3. Badge, TextLink, Icon 순서로 기초 완성
4. Sidebar, GlobalHeader → 레이아웃 뼈대
5. MasterDetailLayout → [이슈]/CLAUDE.md/[세션]/기획서 공통 골격
6. Card, ListItem, FactCard, FixBox → 데이터 표시
7. Modal, Toast, Tooltip, Dropdown → 인터랙션
8. EmptyState, SettingsCardGrid, AlertBanner → 페이지 조합

---

*— End of Document —*
