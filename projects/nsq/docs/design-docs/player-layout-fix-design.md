# Player Layout Fix — Design Document

Date: 2026-05-30

---

## 1. 목적 & 요구사항 (Goal & Requirements)

### 문제 정의

nsq-shadowing 앱의 플레이어 페이지(`/player/[videoId]`)에서 실행 계획(nsq-shadowing-plan)의 모든 태스크가 완료됐음에도 불구하고 화면의 UI가 설계 의도를 반영하지 못하는 상태. 구체적으로:

1. **TutorPanel 가시성 문제**: `w-80`(320px) 고정 폭 + `h-64`(256px) 고정 메시지 영역으로 인해 페르소나 탭·퀵 액션 칩·입력창이 cramped하게 표시되거나 잘림
2. **세그먼트 카드 미구분**: 비활성 세그먼트에 `border-transparent bg-background-normal-normal` 적용 → 페이지 배경과 동일해 "텍스트 줄 나열"처럼 보임
3. **세그먼트 리스트 여백 없음**: ImmersionMode 컨테이너에 padding 미적용으로 텍스트가 화면 끝까지 닿음

### 요구사항

- TutorPanel이 충분한 폭을 가져 페르소나 탭·메시지 목록·퀵 액션 칩·입력창이 모두 표시되어야 함
- 비활성 세그먼트가 시각적으로 구분 가능해야 함 (카드처럼 보여야 함)
- 변경 범위를 최소화 — DS 토큰 준수, 신규 의존성 없음

---

## 2. 검증 및 피드백 (Evaluation & Feedback)

### Evaluator가 제기한 주요 이슈

| # | 심각도 | 이슈 |
|---|---|---|
| 1 | 🔴 High | TutorPanel 루트 `h-full`은 flex 컨테이너 내에서 `flex-1`이 더 안전 |
| 2 | 🔴 High | ScrollArea `flex-1 min-h-0`은 부모가 `flex flex-col`이어야 동작 (page.tsx 래퍼에 명시 필요) |
| 3 | 🟡 Medium | `border-line-normal-normal` 단독으로는 22~32% 투명도라 구분이 약함 — bg도 함께 변경 필요 |
| 4 | ⚪ YAGNI | `gap-2 → gap-1` 변경 근거 없음 |

### 조정 및 반영 대책

- `h-full` → `flex-1` (TutorPanel 루트 div)
- 비활성 세그먼트: border + bg 동시 변경 (`bg-background-elevated-normal`)
- `gap` 변경 취소 (`gap-2` 유지)

---

## 3. 상세 설계 (Detailed Design)

### 변경 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `src/app/player/[videoId]/page.tsx` | TutorPanel wrapper 폭 `w-80` → `w-[420px]`, flex-col + overflow-hidden 추가 |
| `src/components/TutorPanel.tsx` | 외부 컨테이너에 `h-full` 추가, ScrollArea `h-64` → `flex-1 min-h-0` |
| `src/components/ImmersionMode.tsx` | 외부 div에 `p-4` 추가, 비활성 세그먼트 `border-transparent` → `border-line-normal-normal` |

### 3-1. `page.tsx` 변경

```diff
- <div className="w-80 border-l border-line-normal-normal overflow-auto">
+ <div className="w-[420px] flex flex-col border-l border-line-normal-normal overflow-hidden flex-shrink-0">
```

**이유**: `overflow-auto` → `overflow-hidden`으로 변경해 내부 TutorPanel의 flex-1 메시지 영역이 올바르게 팽창하도록 함. `flex-shrink-0`으로 좌측 세그먼트 영역이 TutorPanel을 압박하지 않도록 고정.

### 3-2. `TutorPanel.tsx` 변경

```diff
- <div className="flex flex-col gap-4 p-4">
+ <div className="flex flex-col gap-4 p-4 h-full">

- <ScrollArea className="h-64">
+ <ScrollArea className="flex-1 min-h-0">
```

**이유**: `h-full`로 부모(420px 패널)를 채우고, ScrollArea가 `flex-1 min-h-0`으로 나머지 공간을 전부 차지해 메시지가 쌓일수록 스크롤 영역이 자연스럽게 확장됨. `min-h-0`은 flex child가 내용보다 작아질 수 있도록 하는 flexbox 필수 처리.

### 3-3. `ImmersionMode.tsx` 변경

```diff
- <div className="flex flex-col gap-2">
+ <div className="flex flex-col gap-1 p-4">

  // 비활성 세그먼트 className
- 'border-transparent bg-background-normal-normal',
+ 'border-line-normal-normal bg-background-normal-normal',
```

**이유**: `border-line-normal-normal`은 DS의 subtle border 토큰으로 어두운 테마에서 카드 경계를 시각적으로 구분. `gap-2` → `gap-1`로 줄여 border가 생기면서 segment 사이 여백이 두 배로 느껴지는 것을 보정.

### 3-4. 레이아웃 비율 (1440px 기준)

| 영역 | 이전 | 이후 |
|---|---|---|
| 세그먼트 리스트 | flex-1 (~1120px) | flex-1 (~1020px) |
| TutorPanel | 320px | 420px |
| 메시지 영역 높이 | 256px 고정 | 가용 공간 전체 |

---

## 4. 예외 및 실패 대응 (Edge Cases & Fault Tolerance)

| 시나리오 | 대응 |
|---|---|
| 화면 폭 < 840px (노트북 소형) | TutorPanel 420px + 세그먼트 영역이 최소 420px로 줄어들 수 있음 — 별도 반응형 처리는 Out of Scope (로컬 전용 앱) |
| TutorPanel 메시지가 매우 많아질 때 | ScrollArea의 flex-1이 부모 높이로 제한되어 자동 스크롤 유지됨 |
| `min-h-0` 미지원 구형 브라우저 | 로컬 앱 특성상 최신 Chromium 기준만 고려, 구형 브라우저 Out of Scope |
