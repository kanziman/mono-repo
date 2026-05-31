# nsq-import-resume-progress — 실행 계획서

## 목적

두 가지 임포트 UX 개선:

1. **미완성 에피소드 재개**: `import-state.json`만 있고 `meta.json`이 없는 에피소드를 대시보드에 표시하고, 다운로드·자막·번역 각 단계를 버튼으로 재시작할 수 있도록 한다.
2. **다운로드·자막 진행률 표시**: 현재 0%→100% 즉시 전환되어 진행 중임을 알 수 없는 두 단계에 실시간 상태를 노출한다.
   - 다운로드: yt-dlp stderr `[download] XX.X%` 파싱 → 실제 진행률
   - 자막: 소용량 파일이므로 실제 byte 진행률 없음 → 구간별 simulated progress (10%→60%→100%)

---

## Scope Lock

Source artifact 없음. 사용자가 대화 중 직접 요구사항을 구술하였고, 기존 코드 구조를 유지하는 scoped feature addition으로 구현한다.

---

## 영향 파일 목록

| 파일 | 변경 종류 |
|---|---|
| `src/types/index.ts` | Modify — `StepStatus`, `IncompleteEpisodeEntry`, `EpisodeEntry` 추가 |
| `src/app/api/episodes/route.ts` | Modify — 미완성 에피소드 반환 포함 |
| `src/app/api/import/route.ts` | Modify — `fromStep` 파라미터 지원 + 진행률 콜백 연결 |
| `src/lib/ytdlp.ts` | Modify — `parseYtDlpProgress` 추출, `downloadAudio` progress 콜백, `downloadSubtitle` 콜백 |
| `src/app/page.tsx` | Modify — `EpisodeEntry[]` 타입, 미완성 카드 렌더링, fromStep 호출, indeterminate UI |
| `src/__tests__/ytdlp-progress.test.ts` | Create — yt-dlp progress 파싱 유닛 테스트 |

---

## Task 1: 타입 추가

**파일**: `src/types/index.ts`  
**위치**: 기존 `ImportStep` 타입 아래

추가할 내용:

```typescript
export type StepStatus = 'pending' | 'in_progress' | 'done' | 'error'

export interface IncompleteEpisodeEntry {
  videoId: string
  complete: false
  steps: { download: StepStatus; subtitle: StepStatus; translate: StepStatus }
  error: string | null
  startedAt: string
}

export type EpisodeEntry = (EpisodeMeta & { complete: true }) | IncompleteEpisodeEntry
```

**검증**: `npx tsc --noEmit` 에러 없음

---

## Task 2: `/api/episodes` — 미완성 에피소드 반환

**파일**: `src/app/api/episodes/route.ts`  
**전체 교체**

현재 로직: `meta.json` 없으면 `continue` (skip).  
변경 후 로직:
1. `meta.json` 있으면 → `{ ...meta, complete: true }` push
2. `meta.json` 없고 `import-state.json` 있으면 → `IncompleteEpisodeEntry` push
3. 둘 다 없으면 skip

정렬: 완성(complete: true) 항목이 앞, 그 안에서 `importedAt` desc. 미완성은 `startedAt` desc로 뒤에.

```typescript
import fs from 'fs'
import path from 'path'
import { EPISODES_BASE } from '@/lib/paths'
import type { EpisodeMeta, EpisodeEntry, StepStatus } from '@/types'

export async function GET() {
  if (!fs.existsSync(EPISODES_BASE)) {
    return Response.json([])
  }

  const entries = fs.readdirSync(EPISODES_BASE, { withFileTypes: true })
  const result: EpisodeEntry[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const metaPath = path.join(EPISODES_BASE, entry.name, 'meta.json')
    try {
      const meta: EpisodeMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
      result.push({ ...meta, complete: true })
      continue
    } catch { /* no meta.json */ }

    const statePath = path.join(EPISODES_BASE, entry.name, 'import-state.json')
    try {
      const raw = JSON.parse(fs.readFileSync(statePath, 'utf-8')) as {
        videoId: string
        startedAt: string
        steps: { download: StepStatus; subtitle: StepStatus; translate: StepStatus }
        error: string | null
      }
      result.push({
        videoId: entry.name,
        complete: false,
        steps: raw.steps,
        error: raw.error,
        startedAt: raw.startedAt,
      })
    } catch { /* skip */ }
  }

  result.sort((a, b) => {
    if (a.complete && b.complete)
      return new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()
    if (a.complete) return -1
    if (b.complete) return 1
    return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  })

  return Response.json(result)
}
```

**검증**: `curl http://localhost:3000/api/episodes` 응답에 `rIXyULee-ek` (`complete: false`) 항목 포함 확인

---

## Task 3: `/api/import` — `fromStep` 지원

**파일**: `src/app/api/import/route.ts`

### 3-A: POST body 파싱 변경

```typescript
// 기존
const body = await req.json() as { videoId?: string }
const { videoId } = body

// 변경 후
const body = await req.json() as { videoId?: string; fromStep?: ImportStep }
const { videoId, fromStep } = body
```

### 3-B: state 로딩 직후 단계 초기화 삽입

`appendLog(episodeDir, \`import started: ${videoId}\`)` 바로 아래에:

```typescript
if (fromStep) {
  const STEP_ORDER: ImportStep[] = ['download', 'subtitle', 'translate']
  const idx = STEP_ORDER.indexOf(fromStep)
  if (idx !== -1) {
    STEP_ORDER.slice(idx).forEach((s) => { state.steps[s] = 'pending' })
    saveState(episodeDir, state)
    appendLog(episodeDir, `resume from step: ${fromStep}`)
  }
}
```

**검증**: 번역 버튼 클릭(fromStep: 'translate') 후 `import-state.json`에서 translate가 `pending`으로 리셋되고, 번역 청크 캐시를 재사용해 빠르게 완료됨 확인

---

## Task 4: `ytdlp.ts` — 다운로드 진행률 파싱

**파일**: `src/lib/ytdlp.ts`

### 4-A: `parseYtDlpProgress` 순수 함수 추출

파일 최상단(import 아래)에 추가:

```typescript
export function parseYtDlpProgress(line: string): number | null {
  const m = line.match(/\[download\]\s+([\d.]+)%/)
  return m ? parseFloat(m[1]) : null
}
```

### 4-B: `runYtDlpWithProgress` 추가

기존 `runYtDlp` 함수 아래에 추가:

```typescript
function runYtDlpWithProgress(
  args: string[],
  onProgress: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', args)
    const stdout: string[] = []
    const stderr: string[] = []
    proc.stdout.on('data', (d: Buffer) => stdout.push(d.toString()))
    proc.stderr.on('data', (d: Buffer) => {
      const text = d.toString()
      stderr.push(text)
      for (const line of text.split('\n')) {
        const pct = parseYtDlpProgress(line)
        if (pct !== null) onProgress(Math.min(99, Math.round(pct)))
      }
    })
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout.join(''))
      else reject(new Error(`yt-dlp exited ${code}: ${stderr.join('')}`))
    })
    proc.on('error', reject)
  })
}
```

### 4-C: `downloadAudio` 시그니처 변경

```typescript
export async function downloadAudio(
  videoUrl: string,
  outputDir: string,
  onProgress?: (pct: number) => void
): Promise<void> {
  const args = [
    '--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0',
    '-o', path.join(outputDir, 'audio.%(ext)s'), '--no-playlist', videoUrl,
  ]
  if (onProgress) {
    await runYtDlpWithProgress(args, onProgress)
  } else {
    await runYtDlp(args)
  }
}
```

### 4-D: `downloadSubtitle` 시그니처 변경

manual subs 시도 완료(성공/실패 무관) 시점에 콜백 호출:

```typescript
export async function downloadSubtitle(
  videoUrl: string,
  outputDir: string,
  onFirstAttemptDone?: () => void
): Promise<string> {
  const vttGlob = (dir: string) =>
    fs.readdirSync(dir).find((f) => f.startsWith('subtitle.') && f.endsWith('.vtt'))

  try {
    await runYtDlp([
      '--write-subs', '--sub-lang', 'en', '--skip-download',
      '-o', path.join(outputDir, 'subtitle.%(ext)s'), '--no-playlist', videoUrl,
    ])
    onFirstAttemptDone?.()
    const vtt = vttGlob(outputDir)
    if (vtt) return fs.readFileSync(path.join(outputDir, vtt), 'utf-8')
  } catch {
    onFirstAttemptDone?.()
  }

  await runYtDlp([
    '--write-auto-subs', '--sub-lang', 'en', '--skip-download',
    '-o', path.join(outputDir, 'subtitle.%(ext)s'), '--no-playlist', videoUrl,
  ])
  const vtt = vttGlob(outputDir)
  if (!vtt) throw new Error('No English subtitle found for this video')
  return fs.readFileSync(path.join(outputDir, vtt), 'utf-8')
}
```

**검증**: `npx tsc --noEmit` 에러 없음

---

## Task 5: `import/route.ts` — 진행률 콜백 연결

**파일**: `src/app/api/import/route.ts`

### 5-A: 다운로드 단계 — 실제 진행률

```typescript
// 기존
await downloadAudio(videoUrl, episodeDir)

// 변경 후
await downloadAudio(videoUrl, episodeDir, (pct) => {
  enqueue({ step: 'download', progress: pct, done: false })
})
```

### 5-B: 자막 단계 — simulated progress

```typescript
// 기존
enqueue({ step: 'subtitle', progress: 0, done: false })
state.steps.subtitle = 'in_progress'
saveState(episodeDir, state)
const vttContent = await downloadSubtitle(videoUrl, episodeDir)

// 변경 후
enqueue({ step: 'subtitle', progress: 0, done: false })
state.steps.subtitle = 'in_progress'
saveState(episodeDir, state)
enqueue({ step: 'subtitle', progress: 10, done: false })
const vttContent = await downloadSubtitle(videoUrl, episodeDir, () => {
  enqueue({ step: 'subtitle', progress: 60, done: false })
})
```

**검증**: 새 임포트 시 SSE 스트림에서 download 이벤트가 점진적으로 증가, subtitle 이벤트가 0→10→60→100 순으로 도달

---

## Task 6: `page.tsx` — 미완성 에피소드 카드 + 진행률 UI

**파일**: `src/app/page.tsx`

### 6-A: import 구문 변경

```typescript
// 기존
import type { EpisodeMeta } from '@/types'

// 변경 후
import type { EpisodeEntry, ImportStep } from '@/types'
```

### 6-B: state 타입 변경

```typescript
// 기존
const [episodes, setEpisodes] = useState<EpisodeMeta[]>([])

// 변경 후
const [episodes, setEpisodes] = useState<EpisodeEntry[]>([])
```

fetch 결과 타입도 두 곳(`useEffect`, `startImportSSE` 내부) 모두 `EpisodeEntry[]`로 변경.

### 6-C: `startImportSSE` — fromStep 추가

```typescript
// 기존
async function startImportSSE(videoId: string) {

// 변경 후
async function startImportSSE(videoId: string, fromStep?: ImportStep) {
  ...
  body: JSON.stringify({ videoId, fromStep }),
```

### 6-D: 상수 및 핸들러 추가

컴포넌트 내부 상단:

```typescript
const STEP_META: { key: ImportStep; label: string }[] = [
  { key: 'download', label: '다운로드' },
  { key: 'subtitle', label: '자막' },
  { key: 'translate', label: '번역' },
]

function handleResumeStep(videoId: string, fromStep: ImportStep) {
  setImportingVideoId(videoId)
  setImportSteps({ download: 0, subtitle: 0, translate: 0 })
  setImportActiveStep('download')
  setImportError(null)
  startImportSSE(videoId, fromStep)
}
```

### 6-E: 에피소드 목록 렌더링 교체

기존 `episodes.map((meta) => (...))` 전체를 아래로 교체:

```tsx
episodes.map((ep) => {
  if (!ep.complete && importingVideoId === ep.videoId) return null

  if (ep.complete) {
    return (
      <div
        key={ep.videoId}
        className="flex items-center gap-4 bg-background-elevated-normal border border-line-normal-normal/10 rounded-xl px-4 py-3 cursor-pointer hover:border-primary-normal/40 transition-colors"
        onClick={() => router.push('/player/' + ep.videoId)}
      >
        <div className="w-20 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-fill-normal">
          <EpisodeThumb videoId={ep.videoId} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body2 font-semibold text-label-normal truncate">{ep.title}</p>
          <p className="text-caption1 text-label-assistive mt-0.5">
            {new Date(ep.importedAt).toLocaleDateString('ko-KR')}
          </p>
        </div>
        <Button
          variant="solid"
          color="assistive"
          size="small"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); router.push('/player/' + ep.videoId) }}
        >
          ▶ 재생
        </Button>
      </div>
    )
  }

  // 미완성 에피소드 카드
  return (
    <div
      key={ep.videoId}
      className="flex items-center gap-4 bg-background-elevated-normal border border-dashed border-line-normal-normal/30 rounded-xl px-4 py-3"
    >
      <div className="w-20 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-fill-normal">
        <EpisodeThumb videoId={ep.videoId} />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <p className="text-caption1 text-label-assistive font-mono truncate">{ep.videoId}</p>
        <div className="flex gap-1.5 flex-wrap">
          {STEP_META.map(({ key, label }) => {
            const isDone = ep.steps[key] === 'done'
            return (
              <button
                key={key}
                onClick={() => handleResumeStep(ep.videoId, key)}
                className={`text-caption1 px-2.5 py-1 rounded-full border transition-colors ${
                  isDone
                    ? 'border-status-positive/40 text-status-positive bg-status-positive/10 hover:bg-status-positive/20'
                    : 'border-primary-normal/60 text-primary-normal bg-primary-normal/10 hover:bg-primary-normal/20'
                }`}
              >
                {isDone ? '✓ ' : ''}{label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
})
```

### 6-F: 인라인 progress 카드 — indeterminate 처리

기존 progress bar 내부 div (`style={{ width: \`${progress}%\` }}`) 를 아래로 교체:

```tsx
{progress === 0 && isActive ? (
  <div className="h-full w-full rounded-full bg-primary-normal/40 animate-pulse" />
) : (
  <div
    className={`h-full rounded-full transition-all duration-100 ${
      isDone ? 'bg-status-positive' : 'bg-primary-normal'
    }`}
    style={{ width: `${progress}%` }}
  />
)}
```

**시각 검증**:
- [ ] `npm run dev` 후 `http://localhost:3000` 접속
- [ ] `rIXyULee-ek`가 dashed border 카드로 목록 하단에 표시됨
- [ ] 카드 내: 다운로드(✓ 녹색), 자막(✓ 녹색), 번역(파란색 — 미완성) 버튼 3개
- [ ] 번역 버튼 클릭 → 인라인 progress 카드로 전환 → 빠르게 완료(청크 캐시 재사용) → 완성 카드로 전환
- [ ] 새 임포트 시: 다운로드 progress bar가 실시간 증가
- [ ] 자막 단계 progress가 0%에서 멈추지 않고 10%→60%→100% 순으로 진행
- [ ] 0% 상태(시작 직후)에서 progress bar가 pulse 애니메이션으로 표시됨

---

## Task 7: 유닛 테스트

**파일 생성**: `src/__tests__/ytdlp-progress.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { parseYtDlpProgress } from '@/lib/ytdlp'

describe('parseYtDlpProgress', () => {
  it('[download] XX.X% 형식에서 숫자 파싱', () => {
    expect(parseYtDlpProgress('[download]  50.3% of ~10.00MiB at 2.50MiB/s ETA 00:02')).toBe(50.3)
    expect(parseYtDlpProgress('[download] 100% of ~10.00MiB at 3.20MiB/s ETA 00:00')).toBe(100)
    expect(parseYtDlpProgress('[download]   0.1% of ~10.00MiB')).toBe(0.1)
  })

  it('관련 없는 라인은 null 반환', () => {
    expect(parseYtDlpProgress('[info] Writing subtitle to: subtitle.en.vtt')).toBeNull()
    expect(parseYtDlpProgress('')).toBeNull()
    expect(parseYtDlpProgress('some random line')).toBeNull()
  })
})
```

실행 명령: `npx vitest run src/__tests__/ytdlp-progress.test.ts`  
예상 출력: `✓ 5 tests passed`

---

## Verification Matrix

| 요구사항 | 파일 | 검증 방법 | Evidence |
|---|---|---|---|
| 미완성 에피소드가 대시보드에 표시됨 | `api/episodes/route.ts`, `page.tsx` | 브라우저 직접 확인 | pending |
| 3개 스텝 버튼 done/pending 상태 렌더링 | `page.tsx` | 브라우저 직접 확인 | pending |
| 스텝 버튼 클릭 시 해당 단계부터 재시작 | `api/import/route.ts` | 브라우저 동작 확인 | pending |
| 다운로드 진행률 실시간 변화 | `ytdlp.ts`, `api/import/route.ts` | 새 임포트 브라우저 확인 | pending |
| 자막 단계 0→10→60→100 단계별 표시 | `api/import/route.ts` | 새 임포트 브라우저 확인 | pending |
| 0% 상태에서 pulse 애니메이션 | `page.tsx` | 브라우저 확인 | pending |
| parseYtDlpProgress 유닛 테스트 통과 | `ytdlp-progress.test.ts` | `npx vitest run` | pending |
| `npx tsc --noEmit` 타입 에러 없음 | 전체 | tsc 실행 | pending |

---

## Out-of-Scope

- 에피소드 삭제 기능
- 임포트 상태 수동 편집 UI
- 자막 실제 byte 진행률 (yt-dlp가 소용량 VTT에 progress 미출력)
- 썸네일 없는 미완성 에피소드 fallback 이미지 (기존 EpisodeThumb error fallback으로 처리)
