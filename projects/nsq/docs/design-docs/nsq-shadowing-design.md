# NSQ Shadowing App — Design Document

Date: 2026-05-30

---

## 1. 목적 & 요구사항 (Goal & Requirements)

YouTube "No Stupid Questions" 팟캐스트 영상에서 오디오와 자막을 자동 추출하여, 문장 단위 반복 쉐도잉과 AI 튜터 채팅으로 영어 말하기를 연습하는 **개인용 로컬 웹앱**.

### 핵심 요구사항

- YouTube URL 하나로 오디오(MP3) + 자막(VTT) + 한국어 번역을 자동 생성
- 몰입 모드: 전체 세그먼트 세로 나열, 재생 위치 자동 스크롤, 번역 블러 토글
- 문장 모드: 세그먼트 1개 집중, 원본 재생 + 마이크 녹음 + 내 녹음 재생
- AI 튜터 패널: Angela / Mike / General 페르소나, SSE 스트리밍, 퀵 액션 칩
- 단축키: Space / R / N / P / T / M
- 재생 위치 localStorage 자동 저장 및 복원
- 로컬 전용 (인증 없음, 멀티유저 없음)

---

## 2. 3-Agent GAN 검증 결과

### Evaluator가 제기한 이슈

1. **경로 탐색 공격(Path Traversal)**: videoId를 파일 경로에 직접 삽입 시 `../` 주입 가능
2. **API 키 노출**: `NEXT_PUBLIC_` prefix 사용 시 클라이언트 번들에 포함됨
3. **yt-dlp URL 주입**: URL 파라미터를 shell에 직접 전달 시 커맨드 인젝션 위험
4. **중복 임포트 실행**: 동일 videoId로 동시 요청 시 yt-dlp 프로세스 중복 실행
5. **App Router SSE 비호환**: Next.js App Router Route Handler 기본 런타임은 SSE + child_process 미지원
6. **MP3 seek 불가**: `fs.readFile` 전체 읽기 방식으로는 HTTP Range Request를 처리할 수 없어 오디오 탐색 불가
7. **번역 부분 실패**: 청크 번역 도중 오류 발생 시 전체 재시도 비용 발생
8. **Zustand YAGNI**: 단일 페이지 로컬 앱에 외부 상태 라이브러리는 과도한 의존성

### Refiner 대책

| 이슈 | 대책 |
| --- | --- |
| 경로 탐색 | videoId 정규식 화이트리스트 `^[a-zA-Z0-9_-]{11}$` + `path.resolve().startsWith()` 이중 검증 |
| API 키 노출 | `NEXT_PUBLIC_` prefix 금지, 서버 전용 환경변수만 사용 |
| URL 주입 | yt-dlp 호출 시 URL을 별도 인수 배열로 전달 (`spawn(cmd, [url, ...])`) |
| 중복 임포트 | 서버 메모리 내 `Set<string>` lock으로 동일 videoId 중복 실행 차단 |
| SSE 비호환 | Route Handler 상단에 `export const runtime = 'nodejs'` 선언 |
| MP3 seek | `/api/audio/[videoId]`에서 `Range` 헤더 파싱 후 `fs.createReadStream({ start, end })` 응답 |
| 번역 부분 실패 | 청크별 임시 파일에 점진적 저장(체크포인트), 재시작 시 완료 청크 스킵 |
| Zustand | `useReducer + Context`로 대체 (외부 의존성 없음) |

---

## 3. 상세 설계 (Detailed Design)

### 3-1. Tech Stack

| 분류 | 기술 |
| --- | --- |
| **Framework** | Next.js 14 (App Router) + TypeScript |
| **스타일** | TailwindCSS + Montage DS (내부 디자인 시스템 토큰) |
| **테마** | next-themes (다크/라이트 모드 전환) |
| **폰트** | Pretendard |
| **오디오 녹음** | MediaRecorder API (브라우저 내장) |
| **Audio/Subtitle 추출** | yt-dlp (서버 사이드 CLI) |
| **번역 / AI 튜터** | OpenRouter API — 번역: `google/gemini-flash-1.5`, 튜터: `anthropic/claude-haiku-4-5` (`.env`로 변경 가능) |
| **스트리밍** | SSE (`export const runtime = 'nodejs'` + `ReadableStream`) |
| **상태 관리** | `useReducer + Context` (Zustand 미사용) |
| **저장소** | 로컬 파일시스템 `projects/nsq/.shadowing/` + `localStorage` |

### 3-2. 데이터 모델

```ts
interface Segment {
  index: number
  start: number       // seconds
  end: number         // seconds
  text: string        // 영어 원문
  translation: string // 한국어 번역
}

interface EpisodeMeta {
  videoId: string
  title: string
  durationSec: number
  thumbnailUrl: string  // 로컬 경로 (/api/thumbnail/[videoId])
  importedAt: string    // ISO date
}
```

### 3-3. 파일 레이아웃

```text
projects/nsq/.shadowing/
  episodes/
    {videoId}/
      audio.mp3
      segments.json       # Segment[]
      meta.json           # EpisodeMeta
      thumbnail.jpg       # 임포트 시 로컬 다운로드
      translate_chunk_N   # 번역 체크포인트 (완료 시 삭제)
```

localStorage:

```text
shadowing:position:{videoId}  →  { segmentIndex: number, offset: number, importedAt: string }
```

### 3-4. 페이지 구조

| 경로 | 설명 |
| --- | --- |
| `/` | 에피소드 목록 + YouTube URL 입력 + Import 버튼 |
| `/import/[videoId]` | 임포트 진행 상황 (SSE 수신, 단계별 표시) |
| `/player/[videoId]` | 메인 쉐도잉 화면 (몰입/문장 모드 + AI 튜터) |

### 3-5. Player 모드

#### 몰입 모드 (Immersion)

- 전체 세그먼트 세로 나열, 현재 세그먼트 하이라이트 + 자동 스크롤
- 각 세그먼트 앞 화자 뱃지 표시 (Angela / Mike — VTT 화자 정보 기반)
- 번역 기본 blur, 클릭 또는 T키로 개별 공개
- 우측 AI 튜터 패널 고정

#### 문장 모드 (Sentence)

- 현재 세그먼트 1개 중앙 크게 표시
- 원본 재생 / 마이크 녹음(MediaRecorder API) / 내 녹음 재생 버튼
- 이전(P) / 다음(N) 세그먼트 이동
- 우측 AI 튜터 패널 동일

모드 전환: M키 또는 우상단 버튼. 현재 세그먼트 위치 유지.

### 3-6. 단축키

| 키 | 동작 |
| --- | --- |
| `Space` | 재생 / 일시정지 |
| `R` | 현재 세그먼트 처음부터 반복 |
| `N` | 다음 세그먼트 |
| `P` | 이전 세그먼트 |
| `T` | 현재 세그먼트 번역 토글 |
| `M` | 몰입 / 문장 모드 전환 |

### 3-7. API Routes

```ts
// 임포트 — SSE 스트림
POST /api/import
  Body: { videoId: string }
  Stream: { step: 'download' | 'subtitle' | 'translate', progress: number, done: boolean, error?: string }
  runtime: 'nodejs'  // 필수

// 에피소드 목록
GET /api/episodes
  Response: EpisodeMeta[]

// 에피소드 상세
GET /api/episodes/[videoId]
  Response: { meta: EpisodeMeta, segments: Segment[] }

// 오디오 스트리밍 — Range Request 지원
GET /api/audio/[videoId]
  Headers: Range (optional)
  Response: 206 Partial Content or 200

// 썸네일
GET /api/thumbnail/[videoId]
  Response: image/jpeg

// AI 튜터 — SSE 스트림
POST /api/tutor/chat
  Body: { videoId: string, persona: 'angela' | 'mike' | 'general', messages: Message[], currentSegment?: Segment }
  Stream: { delta: string, done: boolean }
  runtime: 'nodejs'  // 필수
```

### 3-8. yt-dlp 통합

```ts
// VTT → Segment 변환 (타임스탬프 보존)
function vttToSegments(vtt: string): VttSegment[]

// 실행 시 URL은 반드시 별도 인수로 전달 (주입 방지)
spawn('yt-dlp', [
  '--extract-audio', '--audio-format', 'mp3',
  '-o', outputPath,
  videoUrl  // 절대로 shell 문자열에 삽입 금지
])

// 자막 우선순위: 영어 수동 자막 → 영어 자동 자막
// VTT 파싱: HTML 태그 제거, 중복 세그먼트 병합, 엔티티 디코딩
```

### 3-9. 번역 파이프라인

- 모델: `google/gemini-flash-1.5` (`.env TRANSLATION_MODEL`로 변경)
- 세그먼트를 50개 청크로 묶어 배치 요청
- 청크 완료마다 `translate_chunk_N` 파일에 저장 (체크포인트)
- 재시작 시 완료된 청크 스킵
- 청크 오류 시 1회 재시도, 실패하면 빈 문자열로 저장

### 3-10. AI 튜터

- 페르소나: Angela Bot (Angela Duckworth) / Mike Bot (Mike Maughan) / General Tutor
- 에피소드 제목 + 전체 세그먼트 텍스트를 시스템 프롬프트 컨텍스트로 주입
- 현재 재생 세그먼트 자동 컨텍스트 전달
- 퀵 액션 칩: `💡 이 표현 설명해줘` / `✍ 내 문장 교정해줘` / `💬 이 주제로 토론하자`
- 대화 히스토리: 세션 메모리에만 유지 (파일 저장 없음)

---

## 4. 예외 및 실패 대응 (Edge Cases & Fault Tolerance)

| 시나리오 | 대응 |
| --- | --- |
| yt-dlp 실행 실패 | 단계별 오류 메시지 + 재시도 버튼 표시 |
| 영어 자막 없음 | 자동 자막으로 폴백, 그것도 없으면 오류 메시지 |
| 번역 청크 오류 | 1회 재시도 → 실패 시 빈 문자열 저장 (부분 번역 허용) |
| 동일 videoId 중복 임포트 | 서버 메모리 Set lock으로 두 번째 요청 즉시 거부 |
| 임포트 중 탭 닫기 | 부분 파일 남음 — 재임포트 시 덮어쓰기 (별도 정리 로직 없음) |
| MediaRecorder 미지원 환경 | 녹음 버튼 비활성화 처리 |
| localStorage 위치 데이터 만료 | `importedAt` 타임스탬프 비교로 오래된 위치 무시 |
| OpenRouter API 오류 | 오류 메시지를 채팅창에 인라인 표시, 재전송 가능 |

---

## 5. 범위 제외 (Out of Scope)

- 사용자 인증 / 멀티유저
- AI 발음 피드백 (점수, 억양 분석)
- 사전 팝업
- 모바일 최적화
- RSS 피드 자동 갱신
- 쉐도잉 녹음 파일 영구 저장 (세션 내 Blob URL만 유지)
