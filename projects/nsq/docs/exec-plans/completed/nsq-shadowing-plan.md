# NSQ Shadowing App — Implementation Plan (Slim)

Date: 2026-05-30  
Source Design: `projects/fervent/docs/design-docs/nsq-shadowing-design.md`  
App Root: `projects/nsq-shadowing/`  
Types Reference: `projects/nsq-shadowing/src/types/index.ts` (Task 2에서 생성)

> **슬림 플랜 정책**: 코드 스니펫 없음. 에이전트가 설계 문서와 타입을 참고해 직접 작성.  
> TDD 5단계: ① 실패 테스트 작성 → ② 실패 확인 → ③ 최소 구현 → ④ 통과 확인 → ⑤ 커밋

> **Design System 정책** (DESIGN.md § 필수, Montage DS): `mono-repo/design-system/`의 토큰과 컴포넌트를 반드시 사용.  
> 하드코딩 색상 클래스(`zinc-*`, `blue-*`, `gray-*`) 금지. 시맨틱 토큰 클래스만 허용 (`bg-background-normal-normal`, `bg-background-elevated-normal`, `text-label-normal`, `text-label-alternative`, `text-primary-normal`, `bg-primary-normal`, `text-static-white` 등).  
> 컴포넌트 import alias: `import { Button, Card, Chip, TextField, Typography, Badge, Skeleton, ScrollArea, ThemeProvider } from '@ds'`

---

## Task 1: 프로젝트 부트스트랩

**목표**: Next.js 14 앱 초기화, 테스트 환경, 폰트, 테마 설정 완료.

**생성 파일**:
- `projects/nsq-shadowing/` — `create-next-app@14` (App Router, TypeScript, TailwindCSS, ESLint, `@/*` alias)
- `src/__tests__/vitest-setup.ts` — `@testing-library/jest-dom` import
- `src/__tests__/setup.test.ts` — path 모듈 import 가능 여부 + NODE_ENV 정의 확인
- `vitest.config.ts` — jsdom environment, `@` alias, react plugin
- `.env.local` — OPENROUTER_API_KEY, TRANSLATION_MODEL, TUTOR_MODEL 키 템플릿
- `src/fonts/PretendardVariable.woff2` — GitHub releases에서 다운로드
- `src/app/layout.tsx` — Pretendard localFont + `ThemeProvider` (`@ds`에서 import) 래핑
- `tailwind.config.ts` — `darkMode: 'class'`, fontFamily에 `--font-pretendard` 변수 등록, `mono-repo/design-system/tailwind.config.ts`의 semantic token 매핑을 `theme.extend`에 통째로 포함
- `src/app/globals.css` — `mono-repo/design-system/globals.css`의 CSS 변수 정의를 복사 (`:root`, `.dark` 블록 포함)
- `tsconfig.json` — `compilerOptions.paths`에 `"@ds": ["../../design-system/components"]` alias 추가

**추가 패키지**:
- `npm install next-themes`
- `npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom`

**구현 요건**:
- `create-next-app` 실행 시 `--no-src-dir=false` 옵션으로 src/ 디렉터리 사용
- `.env.local`은 실제 키 값 없이 placeholder만 작성 (git에 노출 방지)
- `NEXT_PUBLIC_` prefix 절대 사용 금지 (서버 전용 환경변수만)
- layout.tsx의 html 태그에 `suppressHydrationWarning` 추가 (next-themes 요구사항)
- `ThemeProvider`는 `@ds`에서 import (`import { ThemeProvider } from '@ds'`), next-themes에서 직접 import 금지

**테스트 러너**:
`cd projects/nsq-shadowing && npx vitest run src/__tests__/setup.test.ts`
예상: 2 tests passed

**커밋**: `git commit -m "chore: bootstrap nsq-shadowing Next.js 14 app with TailwindCSS and vitest"`

---

## Task 2: 타입 정의 & 유효성 검증 유틸리티

**목표**: 전체 앱에서 공유하는 TypeScript 타입과 보안 검증 함수 구현.

**생성 파일**:
- `src/types/index.ts` — 모든 공유 타입 정의
- `src/lib/validate.ts` — videoId 화이트리스트 검증 + Path Traversal 이중 방지
- `src/lib/paths.ts` — `~/.shadowing/` 경로 상수 및 디렉터리 생성 헬퍼
- `src/__tests__/validate.test.ts` — 8개 테스트 케이스

**구현 요건 — types/index.ts**:
- `Segment`: index(number), start(seconds), end(seconds), text(영어), translation(한국어)
- `EpisodeMeta`: videoId, title, durationSec, thumbnailUrl(`/api/thumbnail/[videoId]`), importedAt(ISO string)
- `Message`: role(`'user' | 'assistant'`), content
- `Persona`: `'angela' | 'mike' | 'general'` union type
- `ImportStep`: `'download' | 'subtitle' | 'translate'` union type
- `ImportProgress`: step, progress(number), done(boolean), error?(string)
- `PositionState`: segmentIndex, offset, importedAt

**구현 요건 — validate.ts**:
- videoId 정규식 화이트리스트: `^[a-zA-Z0-9_-]{11}$` (정확히 11자)
- `validateVideoId(id: string): boolean` — 정규식 검사
- `getEpisodePath(videoId: string): string` — 검증 후 `path.resolve()` 결과가 EPISODES_BASE로 시작하는지 이중 확인, 실패 시 Error throw
- `getFilePath(videoId, filename): string` — episodePath + filename 결합

**구현 요건 — paths.ts**:
- `SHADOWING_BASE`: `os.homedir() + '/.shadowing'`
- `EPISODES_BASE`: SHADOWING_BASE + `/episodes`
- `ensureEpisodeDir(videoId)`: fs.mkdirSync recursive, episodeDir 경로 반환

**테스트 케이스 (validate.test.ts)**:
- 유효한 11자 alphanumeric ID 수락
- `../` 경로 주입 거부
- 11자 미만/초과 거부
- 특수문자 거부
- `getEpisodePath` 정상 경로 반환 확인
- `getEpisodePath` 잘못된 ID에서 Error throw 확인

**테스트 러너**:
`npx vitest run src/__tests__/validate.test.ts`
예상: 8 tests passed

**커밋**: `git commit -m "feat: add core type definitions and videoId validation with path traversal protection"`

---

## Task 3: yt-dlp 통합 & VTT 파서

**목표**: 커맨드 인젝션 없는 yt-dlp 래퍼와 VTT → Segment[] 변환기 구현.

**생성 파일**:
- `src/lib/vtt.ts` — VTT 파싱 + 정제 로직
- `src/lib/ytdlp.ts` — yt-dlp CLI 래퍼 (3개 함수)
- `src/__tests__/vtt.test.ts` — 6개 테스트 케이스

**구현 요건 — vtt.ts**:
- `vttToSegments(vtt: string): Segment[]` 함수 export
- 타임스탬프(`HH:MM:SS.mmm` 또는 `MM:SS.mmm`) → seconds(number) 변환
- HTML 태그 제거: `<c.colorCCCCCC>`, `<b>`, `<i>` 등 모든 `<tag>` 제거
- HTML 엔티티 디코딩: `&amp;`→`&`, `&lt;`→`<`, `&gt;`→`>`, `&quot;`→`"`, `&#39;`→`'`, `&nbsp;`→` `
- 연속된 동일 text 세그먼트 중복 제거 (같은 text가 연달아 나오면 첫 번째만 유지)
- 빈 text 세그먼트 제거
- `index` 0부터 순차 부여, `translation` 빈 문자열로 초기화

**구현 요건 — ytdlp.ts**:
- `downloadAudio(videoUrl, outputDir)`: `spawn('yt-dlp', [...args, videoUrl])` 형식 — videoUrl을 절대로 shell 문자열에 삽입하지 말고 args 배열 마지막에 별도 전달
- 옵션: `--extract-audio --audio-format mp3 --audio-quality 0 -o {outputDir}/audio.%(ext)s`
- `downloadSubtitle(videoUrl, outputDir)`: 영어 수동 자막(`--write-subs --sub-lang en`) 우선, 실패 시 자동 자막(`--write-auto-subs`) 폴백, 생성된 .vtt 파일 내용 반환, 없으면 Error
- `getVideoTitle(videoUrl)`: `--get-title --no-playlist` 옵션으로 제목 문자열 반환
- 모든 함수는 Promise 기반, stderr가 있는 경우 Error message에 포함

**테스트 케이스 (vtt.test.ts)**:
- 타임스탬프가 seconds로 정확히 변환되는지
- HTML 태그 제거 확인
- HTML 엔티티 디코딩 확인
- 연속 중복 세그먼트 1개로 합쳐지는지
- index 0부터 순차 부여 확인
- translation이 빈 문자열로 초기화되는지

**테스트 러너**:
`npx vitest run src/__tests__/vtt.test.ts`
예상: 6 tests passed

**커밋**: `git commit -m "feat: add VTT parser and yt-dlp wrapper with command injection protection"`

---

## Task 4: 번역 파이프라인

**목표**: OpenRouter API로 세그먼트를 50개 청크 단위 배치 번역, 체크포인트로 재시작 복원.

**생성 파일**:
- `src/lib/translate.ts` — 청크 분할, 번역, 체크포인트, 재조합 로직
- `src/__tests__/translate.test.ts` — 4개 테스트 케이스

**구현 요건**:
- `chunkSegments(segments, size=50): Segment[][]` — 배열을 size 단위로 분할
- `buildTranslationPrompt(segments): string` — "JSON 배열로 번역하라" + 번호 매긴 원문 목록 포함
- `translateChunk(segments, chunkIndex, checkpointDir)`: 체크포인트 파일(`translate_chunk_N`) 존재 시 파일 읽어 반환(스킵), 없으면 OpenRouter API 호출
- OpenRouter API endpoint: `https://openrouter.ai/api/v1/chat/completions`
- 모델: `process.env.TRANSLATION_MODEL ?? 'google/gemini-flash-1.5'`
- 응답에서 JSON 배열 파싱, 파싱 실패 시 Error
- 1회 재시도: 첫 번째 실패 → 즉시 재시도 → 두 번째도 실패 → segments.length만큼 빈 문자열 배열 반환
- 번역 개수 불일치 시 빈 문자열로 패딩 또는 초과분 slice
- 체크포인트 파일: 청크 완료 즉시 JSON.stringify로 저장
- `translateAllSegments(segments, checkpointDir, onProgress)`: 전체 청크 순회 후 segments 배열에 translation 병합, 완료 후 체크포인트 파일 전부 삭제, onProgress(doneCount, totalCount) 콜백 호출

**테스트 케이스 (translate.test.ts)**:
- 120개 세그먼트 → 3청크(50/50/20) 분할 확인
- 30개 세그먼트 → 1청크 확인
- buildTranslationPrompt에 모든 text 포함 확인
- buildTranslationPrompt에 "json" 키워드 포함 확인

**테스트 러너**:
`npx vitest run src/__tests__/translate.test.ts`
예상: 4 tests passed

**커밋**: `git commit -m "feat: add chunked translation pipeline with OpenRouter API and checkpoint resume"`

---

## Task 5: API — /api/import (SSE 스트림)

**목표**: YouTube 임포트 엔드포인트. SSE로 3단계 진행률 스트리밍, 중복 실행 방지.

**생성 파일**:
- `src/app/api/import/route.ts` — POST handler
- `src/__tests__/api-import.test.ts` — 2개 테스트 케이스 (validate 재사용)

**구현 요건**:
- 파일 최상단: `export const runtime = 'nodejs'` (SSE + child_process 호환)
- 모듈 레벨 `const importing = new Set<string>()` — 서버 메모리 중복 lock
- body에서 videoId 추출 → `validateVideoId` 실패 시 400 반환
- `importing.has(videoId)` 시 409 반환
- `importing.add(videoId)` 후 ReadableStream 생성
- SSE 이벤트 포맷: `data: {JSON}\n\n`
- 스트림 순서: download(0%→100%) → subtitle(0%→100%) → translate(0%→100%, onProgress로 갱신)
- 완료 이벤트: `{ step: 'translate', progress: 100, done: true }`
- 오류 이벤트: `{ step, progress: 0, done: true, error: message }`
- finally에서 `importing.delete(videoId)` + `controller.close()`
- meta.json 저장: videoId, title(getVideoTitle), durationSec(마지막 세그먼트 end), thumbnailUrl(`/api/thumbnail/{videoId}`), importedAt(ISO)
- Response headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`

**테스트 러너**:
`npx vitest run src/__tests__/api-import.test.ts`
예상: 2 tests passed

**커밋**: `git commit -m "feat: add /api/import SSE endpoint with nodejs runtime and duplicate lock"`

---

## Task 6: API — 에피소드 목록 & 상세

**목표**: 에피소드 목록 조회와 단일 에피소드(meta + segments) 조회 API.

**생성 파일**:
- `src/app/api/episodes/route.ts` — GET 에피소드 목록
- `src/app/api/episodes/[videoId]/route.ts` — GET 에피소드 상세

**구현 요건**:
- `GET /api/episodes`: EPISODES_BASE 디렉터리 없으면 빈 배열 반환, 각 하위 디렉터리의 meta.json 읽어 EpisodeMeta[] 반환
- `GET /api/episodes/[videoId]`: videoId 검증 → meta.json + segments.json 읽어 `{ meta, segments }` 반환, 파일 없으면 404

**수동 검증**:
`npm run dev` 후 `curl http://localhost:3000/api/episodes` → `[]`

**커밋**: `git commit -m "feat: add GET /api/episodes and /api/episodes/[videoId] endpoints"`

---

## Task 7: API — 오디오 스트리밍 (Range Request)

**목표**: HTTP Range 헤더를 파싱하여 206 Partial Content 응답으로 오디오 탐색(seek) 지원.

**생성 파일**:
- `src/lib/audio.ts` — `parseRangeHeader` 함수
- `src/app/api/audio/[videoId]/route.ts` — GET handler (nodejs runtime)
- `src/__tests__/audio-range.test.ts` — 4개 테스트 케이스

**구현 요건 — audio.ts**:
- `parseRangeHeader(range: string | null, fileSize: number): { start: number, end: number } | null`
- `bytes=0-999` → `{start:0, end:999}`
- `bytes=500-` → `{start:500, end:fileSize-1}`
- 파싱 불가 또는 null → null 반환
- end가 fileSize-1을 초과하면 fileSize-1로 clamp

**구현 요건 — audio/[videoId]/route.ts**:
- `export const runtime = 'nodejs'`
- Range 헤더 있으면: `fs.createReadStream(audioPath, { start, end })` → 206 응답
  - headers: `Content-Range: bytes start-end/fileSize`, `Accept-Ranges: bytes`, `Content-Length`, `Content-Type: audio/mpeg`
- Range 헤더 없으면: 전체 파일 스트림 → 200 응답
- fs.ReadStream → Web ReadableStream 변환 필요 (data/end/error 이벤트 브리지)

**테스트 케이스**:
- `bytes=0-999` 파싱 정확도
- `bytes=500-` open-ended 파싱
- null/invalid 입력 → null 반환
- end clamp 동작 확인

**테스트 러너**:
`npx vitest run src/__tests__/audio-range.test.ts`
예상: 4 tests passed

**커밋**: `git commit -m "feat: add /api/audio/[videoId] with HTTP Range Request support for audio seeking"`

---

## Task 8: API — 썸네일 & AI 튜터 채팅

**목표**: 썸네일 JPEG 서빙 + 3 페르소나 SSE 스트리밍 AI 튜터 엔드포인트.

**생성 파일**:
- `src/app/api/thumbnail/[videoId]/route.ts` — GET thumbnail.jpg
- `src/lib/tutor.ts` — 페르소나 시스템 프롬프트 빌더
- `src/app/api/tutor/chat/route.ts` — POST SSE 스트리밍 (nodejs runtime)

**구현 요건 — thumbnail route**:
- videoId 검증 → `{episodeDir}/thumbnail.jpg` 읽어 `image/jpeg` 응답

**구현 요건 — tutor.ts**:
- `buildSystemPrompt(persona, episodeTitle, allSegments, currentSegment?)`: 페르소나별 역할 지침 + 에피소드 제목 + 전체 transcript 최대 3000자 + 현재 세그먼트(있으면) 포함
- angela: Angela Duckworth 스타일 (grit/perseverance 관점)
- mike: Mike Maughan 스타일 (실용적, 유머)
- general: 범용 영어 튜터
- "한국어로 응답하되 사용자가 영어로 쓰면 영어로" 지침 포함

**구현 요건 — tutor/chat route**:
- `export const runtime = 'nodejs'`
- body: `{ videoId, persona, messages: Message[], currentSegment?: Segment }`
- videoId 검증, meta/segments 파일 읽기
- OpenRouter API stream mode: `stream: true`
- 모델: `process.env.TUTOR_MODEL ?? 'anthropic/claude-haiku-4-5'`
- SSE delta 파싱: `data:` 라인 → JSON → `choices[0].delta.content`
- 완료 이벤트: `{ delta: '', done: true }`
- OpenRouter 오류 시 500 반환

**커밋**: `git commit -m "feat: add thumbnail serving and AI tutor SSE endpoint with persona system prompts"`

---

## Task 9: 상태 관리 — useReducer + Context

**목표**: 외부 라이브러리 없이 PlayerContext로 전역 플레이어 상태 관리 (Zustand 미사용).

**생성 파일**:
- `src/context/PlayerContext.tsx` — PlayerState, PlayerAction, reducer, PlayerProvider, usePlayer

**PlayerState 필드**:
- `segments: Segment[]`, `currentIndex: number`, `isPlaying: boolean`
- `mode: 'immersion' | 'sentence'`
- `persona: Persona`
- `showTranslation: boolean[]` — 세그먼트별 번역 공개 여부

**PlayerAction 타입**:
- SET_SEGMENTS, SET_INDEX, NEXT, PREV, TOGGLE_PLAY, SET_PLAYING, TOGGLE_MODE, TOGGLE_TRANSLATION, SET_PERSONA

**구현 요건**:
- SET_SEGMENTS 시 showTranslation 배열을 segments 길이만큼 false로 초기화
- SET_INDEX는 0과 segments.length-1 사이로 clamp
- NEXT/PREV도 경계 clamp
- `usePlayer()` 훅: Context가 null이면 Error throw ("usePlayer must be used within PlayerProvider")
- `'use client'` 지시어 필수

**커밋**: `git commit -m "feat: add PlayerContext with useReducer for state management (no Zustand)"`

---

## Task 10: localStorage 위치 저장 훅

**목표**: 재생 위치를 localStorage에 저장/복원, importedAt 타임스탬프 불일치 시 무시.

**생성 파일**:
- `src/hooks/usePositionPersistence.ts`

**구현 요건**:
- 스토리지 키: `shadowing:position:{videoId}`
- `savePosition(videoId, PositionState)`: localStorage.setItem (예외 silently catch)
- `loadPosition(videoId, importedAt)`: 저장값의 importedAt과 파라미터 불일치 시 null 반환
- `usePositionPersistence(videoId, importedAt, segmentIndex, onRestore)`:
  - mount 시 loadPosition → onRestore 호출
  - segmentIndex 변경 시마다 savePosition 호출

**커밋**: `git commit -m "feat: add localStorage position persistence with importedAt validation"`

---

## Task 11: 단축키 훅

**목표**: 6개 단축키 글로벌 핸들러, input/textarea 포커스 시 비활성화.

**생성 파일**:
- `src/hooks/useKeyboardShortcuts.ts`

**구현 요건**:
- `useKeyboardShortcuts(handlers: KeyHandlers)` — window keydown 이벤트
- handlers: `{ onSpace, onR, onN, onP, onT, onM }` (모두 `() => void`)
- target이 INPUT 또는 TEXTAREA이면 조기 return
- Space: `e.preventDefault()` 후 onSpace (브라우저 스크롤 방지)
- 키 매핑: Space→onSpace, KeyR→onR, KeyN→onN, KeyP→onP, KeyT→onT, KeyM→onM
- useEffect cleanup에서 removeEventListener

**커밋**: `git commit -m "feat: add keyboard shortcut hook (Space/R/N/P/T/M)"`

---

## Task 12: 홈 페이지 (/)

**목표**: 에피소드 목록 그리드 + YouTube URL 입력 + Import 버튼 UI.

**생성 파일**:
- `src/app/page.tsx` (`'use client'`)

**구현 요건**:
- `extractVideoId(url): string | null` — 정규식으로 `v=` 또는 `youtu.be/` 뒤 11자 ID 추출
- mount 시 `GET /api/episodes` fetch → EpisodeMeta[] 상태 저장, 로딩 중 `<Skeleton>` from `@ds` 표시
- URL 입력창: `<TextField>` from `@ds` 사용
- Import 버튼: `<Button variant="solid" color="primary">` from `@ds`, videoId 추출 실패 시 에러 메시지 표시, POST `/api/import` → 409 시 "이미 임포트 중" 에러, 성공 시 `/import/{videoId}` 라우팅
- 에피소드 카드: `<Card>` from `@ds` 사용, 썸네일(`/api/thumbnail/{videoId}`) + 제목(`text-label-normal`) + importedAt 날짜(`text-label-alternative`), 클릭 시 `/player/{videoId}` 라우팅
- 에피소드 없을 때 안내 문구: `text-label-alternative` 시맨틱 클래스 사용

**커밋**: `git commit -m "feat: add home page with episode list and YouTube URL import UI"`

---

## Task 13: Import 진행 페이지 (/import/[videoId])

**목표**: SSE를 수신하며 3단계 진행률 바 표시, 완료 시 플레이어 자동 이동, 오류 시 재시도 UI.

**생성 파일**:
- `src/app/import/[videoId]/page.tsx` (`'use client'`)

**구현 요건**:
- useParams로 videoId 획득
- POST `/api/import` → ReadableStream으로 SSE 수신 (AbortController로 cleanup)
- 각 step별 progress 상태 관리: `{ download: 0, subtitle: 0, translate: 0 }`
- 현재 활성 step 하이라이트
- 각 step마다 `<div>` 프로그레스 바 (width: `{progress}%`, transition)
- error 수신 시 에러 박스 + "홈으로 돌아가기" 링크 표시
- done: true 수신 시 성공 메시지 + 1초 후 `/player/{videoId}` push
- mount 시 자동으로 import 시작 (별도 버튼 불필요)

**커밋**: `git commit -m "feat: add import progress page with SSE client and step-by-step display"`

---

## Task 14: 몰입 모드 컴포넌트

**목표**: 전체 세그먼트 세로 나열, 현재 세그먼트 하이라이트·자동 스크롤, 번역 blur 토글, 클릭으로 해당 구간 재생.

**생성 파일**:
- `src/components/ImmersionMode.tsx` (`'use client'`)

**Props**: `{ audioRef: React.RefObject<HTMLAudioElement> }`

**구현 요건**:
- `usePlayer()`로 segments, currentIndex, showTranslation, dispatch 획득
- 각 세그먼트 DOM ref 배열(`itemRefs`) 유지
- currentIndex 변경 시 해당 ref에 `scrollIntoView({ behavior: 'smooth', block: 'center' })`
- 세그먼트 클릭: SET_INDEX + `audioRef.current.currentTime = seg.start` + play() + SET_PLAYING(true)
- 번역 텍스트: `showTranslation[seg.index]`가 false면 `blur-sm` 적용, `hover:blur-none` 추가, 색상은 `text-label-alternative` 시맨틱 클래스
- 번역 클릭: stopPropagation 후 TOGGLE_TRANSLATION dispatch
- 현재 세그먼트 하이라이트: `border-primary-normal bg-background-elevated-normal` (시맨틱 토큰, 하드코딩 색상 금지)
- 화자 뱃지 (Angela / Mike): `<Badge>` from `@ds` 사용

**커밋**: `git commit -m "feat: add ImmersionMode component with auto-scroll and blur translation toggle"`

---

## Task 15: 문장 모드 컴포넌트

**목표**: 단일 세그먼트 집중 표시, MediaRecorder 녹음/재생, 미지원 환경에서 버튼 비활성화.

**생성 파일**:
- `src/components/SentenceMode.tsx` (`'use client'`)

**Props**: `{ audioRef: React.RefObject<HTMLAudioElement>, videoId: string }`

**구현 요건**:
- 현재 세그먼트 텍스트: `<Typography>` from `@ds` 또는 `text-display2` 시맨틱 클래스 (하드코딩 `text-2xl` 금지), 번역은 blur 토글 가능
- 원본 재생 버튼: `<Button variant="solid" color="primary">` from `@ds`, `audioRef.currentTime = seg.start` → play()
- MediaRecorder 지원 여부: `typeof MediaRecorder !== 'undefined'` 체크
  - 미지원 시: 녹음 `<Button>` disabled + "녹음 미지원" 텍스트
  - 지원 시: 녹음 시작/중지 `<Button variant="outlined">` from `@ds`
- 녹음 완료 시 Blob → `URL.createObjectURL` → `<audio>` 태그로 재생
- useEffect cleanup에서 `URL.revokeObjectURL` 호출 (메모리 누수 방지)
- 이전(PREV)/다음(NEXT): `<Button variant="outlined">` from `@ds`

**커밋**: `git commit -m "feat: add SentenceMode component with MediaRecorder recording and unsupported env fallback"`

---

## Task 16: AI 튜터 패널 컴포넌트

**목표**: SSE 스트리밍 채팅 UI, 페르소나 탭 전환, 3개 퀵 액션 칩.

**생성 파일**:
- `src/components/TutorPanel.tsx` (`'use client'`)

**Props**: `{ videoId: string }`

**구현 요건**:
- `usePlayer()`로 segments, currentIndex, persona, dispatch 획득
- 페르소나 탭: `<Chip>` from `@ds` 3개 (Angela Bot / Mike Bot / General), 활성 탭 `color="primary"`, 클릭 시 SET_PERSONA dispatch
- 메시지 목록: `<ScrollArea>` from `@ds`로 감싸기, role에 따라 좌우 정렬 — user: 오른쪽 `bg-primary-normal text-static-white`, assistant: 왼쪽 `bg-background-elevated-normal text-label-normal`
- 메시지 목록 하단 자동 스크롤 (bottomRef + scrollIntoView)
- 스트리밍 중 assistant 메시지 delta 누적 (setMessages prev 패턴)
- 오류 시 "오류가 발생했습니다" 메시지를 assistant 버블(`text-status-negative`)로 표시
- 퀵 액션 칩 3개: `<Chip>` from `@ds` 사용 (💡 이 표현 설명해줘 / ✍ 내 문장 교정해줘 / 💬 이 주제로 토론하자) — 클릭 시 sendMessage 호출
- 채팅 입력: `<TextField>` from `@ds`, Enter 키로 전송 (Shift+Enter 제외)
- 전송 버튼: `<Button variant="solid" color="primary">` from `@ds`
- streaming 중 TextField + 전송 버튼 disabled

**커밋**: `git commit -m "feat: add AI TutorPanel with SSE streaming, persona selection, and quick action chips"`

---

## Task 17: 플레이어 페이지 (/player/[videoId])

**목표**: 전체 플레이어 조합. PlayerProvider, audioRef, timeupdate 세그먼트 추적, 모드 전환, 단축키.

**생성 파일**:
- `src/app/player/[videoId]/page.tsx` (`'use client'`)

**구현 요건**:
- `PlayerProvider`로 전체 래핑, 내부 `PlayerContent` 컴포넌트 분리
- mount 시 `GET /api/episodes/{videoId}` → SET_SEGMENTS dispatch + meta 저장
- `<audio src="/api/audio/{videoId}" />` 숨김 (controls 없음)
- audio timeupdate: `currentTime`이 속하는 세그먼트 index 계산 → SET_INDEX dispatch (index 변경 시에만)
- isPlaying 상태 → `audio.play()` / `audio.pause()` 동기화
- audio 이벤트(play/pause/ended) → SET_PLAYING dispatch
- usePositionPersistence 연결 (importedAt은 meta.importedAt)
- useKeyboardShortcuts 연결: Space→TOGGLE_PLAY, R→현재 세그먼트 currentTime 이동+play, N→NEXT, P→PREV, T→TOGGLE_TRANSLATION(currentIndex), M→TOGGLE_MODE
- 헤더: `bg-background-normal-normal` 배경, 에피소드 제목(`text-label-normal`) + 현재/전체 세그먼트 번호(`text-label-alternative`) + 모드 전환 `<Button variant="outlined">` from `@ds`
- mode가 'immersion'이면 ImmersionMode, 'sentence'면 SentenceMode 렌더링
- 우측 고정: TutorPanel

**커밋**: `git commit -m "feat: add player page integrating immersion/sentence modes, audio, and keyboard shortcuts"`

---

## Task 18: 전체 통합 테스트 & 수동 E2E 검증

**목표**: 전체 vitest 통과 + 핵심 플로우 브라우저 직접 확인.

**Step 1 — 전체 테스트 실행**:
`npx vitest run`
예상: 모든 테스트 passed (setup 2 + validate 8 + vtt 6 + translate 4 + audio-range 4 = 24 tests)

**Step 2 — 개발 서버 실행**:
`npm run dev` (http://localhost:3000)

**수동 E2E 체크리스트**:
- [ ] 홈 화면 정상 렌더링, 어두운 배경
- [ ] YouTube URL 입력 → videoId 파싱 확인 (DevTools console)
- [ ] Import 시작 → `/import/{videoId}` 이동 + 3단계 프로그레스 바 표시
- [ ] 임포트 완료 → `/player/{videoId}` 자동 이동
- [ ] 몰입 모드: 세그먼트 목록 + 현재 세그먼트 하이라이트
- [ ] 세그먼트 클릭 → 오디오 해당 구간부터 재생
- [ ] 번역 텍스트 blur → 클릭 시 공개
- [ ] `M` 키 → 문장/몰입 모드 전환
- [ ] `Space` 키 → 재생/일시정지
- [ ] 문장 모드 → 마이크 녹음 버튼 작동 + 녹음 재생

**Step 3 — 최종 커밋**:
`git commit -m "feat: complete nsq-shadowing app — all tasks implemented and E2E verified"`

---

## 환경 전제조건

```
# yt-dlp 설치 확인
which yt-dlp || brew install yt-dlp

# .env.local (projects/nsq-shadowing/.env.local)
OPENROUTER_API_KEY=<실제 키>
TRANSLATION_MODEL=google/gemini-flash-1.5
TUTOR_MODEL=anthropic/claude-haiku-4-5
```
