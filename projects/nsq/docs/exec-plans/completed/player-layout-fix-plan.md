# Plan: player-layout-fix

## 배경

nsq-shadowing 플레이어 페이지의 UI가 설계 의도를 반영하지 못하는 상태.
TutorPanel이 너무 좁고(w-80=320px), 메시지 영역이 h-64 고정으로 cramped.
비활성 세그먼트가 배경과 동일해 카드 구분 불가.

설계 문서: projects/nsq/docs/design-docs/player-layout-fix-design.md

---

## Task 1: page.tsx — TutorPanel 래퍼 폭 확장

**파일**: `projects/nsq/src/app/player/[videoId]/page.tsx`

```diff
- <div className="w-80 border-l border-line-normal-normal overflow-auto">
+ <div className="w-[420px] flex flex-col border-l border-line-normal-normal overflow-hidden flex-shrink-0">
```

---

## Task 2: TutorPanel.tsx — 메시지 영역 유동 높이

**파일**: `projects/nsq/src/components/TutorPanel.tsx`

```diff
- <div className="flex flex-col gap-4 p-4">
+ <div className="flex flex-col gap-4 p-4 flex-1">

- <ScrollArea className="h-64">
+ <ScrollArea className="flex-1 min-h-0">
```

---

## Task 3: ImmersionMode.tsx — 세그먼트 카드 시각 구분

**파일**: `projects/nsq/src/components/ImmersionMode.tsx`

```diff
- <div className="flex flex-col gap-2">
+ <div className="flex flex-col gap-2 p-4">

- 'border-transparent bg-background-normal-normal',
+ 'border-line-normal-normal bg-background-elevated-normal',
```
