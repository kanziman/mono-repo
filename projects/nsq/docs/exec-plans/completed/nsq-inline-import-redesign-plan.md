# NSQ 인라인 임포트 + UI 버그 수정 실행 계획서

## 목적

3가지 UI 버그 수정 + 임포트 화면 인라인화(별도 페이지 제거) + 유튜브 썸네일 + 재개 가능 임포트 구현.

원본 플랜: `/Users/zorba/.claude/plans/nsq-glistening-salamander.md`

---

## Task 1: Bug 2 — TutorPanel flex-shrink-0

**파일**: `projects/nsq/src/components/TutorPanel.tsx`

칩 컨테이너 + 입력 영역 div에 `flex-shrink-0` 추가.

---

## Task 2: Bug 3 — 플레이어 버튼/배지 가시성

**파일**: `projects/nsq/src/app/player/[videoId]/page.tsx`

- 보조 버튼 `outlined+assistive` → `solid+assistive`
- 모드 배지 `neutral` → `primary`

---

## Task 3: Feature 5 — `downloadThumbnail` 추가

**파일**: `projects/nsq/src/lib/ytdlp.ts`

yt-dlp로 썸네일 jpg 저장 함수 추가.

---

## Task 4: Feature 6a — translate.ts cleanup 버그 수정

**파일**: `projects/nsq/src/lib/translate.ts`

청크 파일 cleanup 경로에 `.json` 누락 수정.

---

## Task 5: Feature 6b — import/route.ts 재개 로직

**파일**: `projects/nsq/src/app/api/import/route.ts`

- `import-state.json` 단계별 상태 저장/로드
- `import.log` append 로깅
- 각 단계 완료 시 skip 처리
- `downloadThumbnail` 호출

---

## Task 6: Feature 4 — page.tsx 대규모 개선

**파일**: `projects/nsq/src/app/page.tsx`

- Bug 1 수정 (errorText 제거)
- 글래스모픽 import box (raw input)
- 인라인 임포트 진행 카드 (YouTube 썸네일 + 3단계 진행바)
- 에피소드 목록 grid → list 레이아웃

---

## 검증

각 태스크 완료 후 TypeScript 빌드 확인:
```
cd projects/nsq && npx tsc --noEmit
```
