# NSQ Sentence-Level Segmentation + Speaker Identification Plan

**시작일**: 2026-05-31  
**설계 문서**: [sentence-speaker-segmentation-design.md](../../design-docs/sentence-speaker-segmentation-design.md)  
**범위**: 새 임포트 에피소드에만 적용. 기존 `segments.json` 마이그레이션 없음.

---

## Source Artifact Ledger

| 필드 | 값 |
|---|---|
| Artifact | `projects/nsq/docs/design-docs/sentence-speaker-segmentation-design.md` |
| Type | Design doc (Evaluator 검증 완료) |
| Implementation scope | Exact reproduction of design |
| Non-goals | 기존 에피소드 마이그레이션, audio diarization, SentenceMode.tsx 화자 표시 (ImmersionMode만) |

---

## Task 1 — `Segment` 타입에 `speaker` 필드 추가

**파일**: `src/types/index.ts`

### 수정 내용

```typescript
// 변경 전
export interface Segment {
  index: number
  start: number
  end: number
  text: string
  translation: string
}

// 변경 후
export interface Segment {
  index: number
  start: number
  end: number
  text: string
  translation: string
  speaker?: string
}
```

### 검증

```bash
cd projects/nsq && npx tsc --noEmit
# 출력: 에러 없음 (speaker는 optional이므로 기존 코드 영향 없음)
```

---

## Task 2 — `vttToSentences()` 구현 및 테스트

**파일 수정**: `src/lib/vtt.ts`  
**파일 수정**: `src/__tests__/vtt.test.ts`

### Step 1: 실패하는 테스트 먼저 추가 (`vtt.test.ts` 하단에 추가)

```typescript
import { vttToSentences } from '@/lib/vtt'

describe('vttToSentences', () => {
  const makeVtt = (cues: { start: string; end: string; text: string }[]) =>
    'WEBVTT\n\n' +
    cues.map(({ start, end, text }) => `${start} --> ${end}\n${text}`).join('\n\n')

  it('1.5s 이상 gap이 있으면 새 문장으로 분리한다', () => {
    const vtt = makeVtt([
      { start: '00:00:01.000', end: '00:00:02.000', text: 'Hello world.' },
      { start: '00:00:05.000', end: '00:00:07.000', text: 'New sentence here.' },
    ])
    const sentences = vttToSentences(vtt, 1.5)
    expect(sentences).toHaveLength(2)
    expect(sentences[0].text).toBe('Hello world.')
    expect(sentences[1].text).toBe('New sentence here.')
  })

  it('gap < 1.5s이면 하나의 문장으로 병합한다', () => {
    const vtt = makeVtt([
      { start: '00:00:01.000', end: '00:00:02.000', text: 'Hello' },
      { start: '00:00:02.500', end: '00:00:04.000', text: 'world.' },
    ])
    const sentences = vttToSentences(vtt, 1.5)
    expect(sentences).toHaveLength(1)
    expect(sentences[0].text).toBe('Hello world.')
    expect(sentences[0].start).toBe(1)
    expect(sentences[0].end).toBe(4)
  })

  it('구두점(. ? !)으로 끝나면 새 문장으로 분리한다', () => {
    const vtt = makeVtt([
      { start: '00:00:01.000', end: '00:00:02.000', text: 'Is this a question?' },
      { start: '00:00:02.500', end: '00:00:04.000', text: 'Yes it is.' },
    ])
    const sentences = vttToSentences(vtt, 1.5)
    expect(sentences).toHaveLength(2)
  })

  it('gap이 음수(VTT overlap)이면 병합 계속한다', () => {
    const vtt = makeVtt([
      { start: '00:00:01.000', end: '00:00:03.000', text: 'Overlapping start' },
      { start: '00:00:02.500', end: '00:00:04.500', text: 'end of phrase.' },
    ])
    const sentences = vttToSentences(vtt, 1.5)
    expect(sentences).toHaveLength(1)
    expect(sentences[0].text).toBe('Overlapping start end of phrase.')
  })

  it('50단어 초과 시 새 문장으로 분리한다', () => {
    const longText = Array(51).fill('word').join(' ')
    const vtt = makeVtt([
      { start: '00:00:01.000', end: '00:00:02.000', text: longText },
      { start: '00:00:02.500', end: '00:00:04.000', text: 'Next sentence.' },
    ])
    const sentences = vttToSentences(vtt, 1.5)
    expect(sentences.length).toBeGreaterThanOrEqual(2)
  })

  it('translation은 빈 문자열로 초기화한다', () => {
    const vtt = makeVtt([
      { start: '00:00:01.000', end: '00:00:03.000', text: 'Test sentence.' },
    ])
    const sentences = vttToSentences(vtt)
    expect(sentences[0].translation).toBe('')
  })

  it('index를 0부터 순차 부여한다', () => {
    const vtt = makeVtt([
      { start: '00:00:01.000', end: '00:00:02.000', text: 'First.' },
      { start: '00:00:05.000', end: '00:00:07.000', text: 'Second.' },
    ])
    const sentences = vttToSentences(vtt)
    expect(sentences[0].index).toBe(0)
    expect(sentences[1].index).toBe(1)
  })
})
```

### Step 2: 테스트 실패 확인

```bash
cd projects/nsq && npx vitest run src/__tests__/vtt.test.ts
# 예상 출력: vttToSentences is not a function (또는 not exported)
```

### Step 3: `vtt.ts` 하단에 `vttToSentences` 추가

```typescript
export function vttToSentences(vtt: string, gapThreshold = 1.5): Segment[] {
  const raw = vttToSegments(vtt)
  const sentences: Omit<Segment, 'index'>[] = []
  let current: Omit<Segment, 'index'> | null = null

  for (const seg of raw) {
    if (!current) {
      current = { start: seg.start, end: seg.end, text: seg.text, translation: '' }
      continue
    }

    const gap = seg.start - current.end  // gap < 0 = VTT overlap → merge 계속
    const endsPunct = /[.?!]\s*$/.test(current.text)
    const tooLong = current.text.split(/\s+/).length > 50

    if (gap >= gapThreshold || endsPunct || tooLong) {
      sentences.push(current)
      current = { start: seg.start, end: seg.end, text: seg.text, translation: '' }
    } else {
      current = { ...current, end: seg.end, text: current.text + ' ' + seg.text }
    }
  }

  if (current) sentences.push(current)
  return sentences.map((s, i) => ({ ...s, index: i }))
}
```

### Step 4: 테스트 통과 확인

```bash
cd projects/nsq && npx vitest run src/__tests__/vtt.test.ts
# 예상 출력: ✓ vttToSentences 6개 전부 pass
```

---

## Task 3 — 번역 파이프라인 수정 (speaker 추론 포함)

**파일 수정**: `src/lib/translate.ts`  
**파일 수정**: `src/__tests__/translate.test.ts`

### Step 1: 테스트 먼저 추가 (`translate.test.ts`)

기존 테스트 파일에 아래 추가:

```typescript
import {
  chunkSegments,
  buildTranslationPrompt,
  buildSentenceTranslationPrompt,
  normalizeSpeaker,
  parseSpeakerResponse,
} from '@/lib/translate'

// 기존 chunkSegments 테스트 업데이트: CHUNK_SIZE 30으로 변경됨
describe('chunkSegments (CHUNK_SIZE=30)', () => {
  it('90개 세그먼트를 30/30/30 3청크로 분할한다', () => {
    const chunks = chunkSegments(makeSegments(90))
    expect(chunks).toHaveLength(3)
    expect(chunks[0]).toHaveLength(30)
    expect(chunks[1]).toHaveLength(30)
    expect(chunks[2]).toHaveLength(30)
  })

  it('20개 세그먼트를 1청크로 반환한다', () => {
    const chunks = chunkSegments(makeSegments(20))
    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toHaveLength(20)
  })
})

describe('buildSentenceTranslationPrompt', () => {
  it('JSON array 형식 지시가 포함된다', () => {
    const prompt = buildSentenceTranslationPrompt(makeSegments(2))
    expect(prompt.toLowerCase()).toContain('json')
    expect(prompt).toContain('translation')
    expect(prompt).toContain('speaker')
  })

  it('모든 segment text가 번호 목록으로 포함된다', () => {
    const prompt = buildSentenceTranslationPrompt(makeSegments(3))
    expect(prompt).toContain('Sentence 1')
    expect(prompt).toContain('Sentence 2')
    expect(prompt).toContain('Sentence 3')
  })
})

describe('normalizeSpeaker', () => {
  it('알려진 화자명은 그대로 반환한다', () => {
    expect(normalizeSpeaker('Angela')).toBe('Angela')
    expect(normalizeSpeaker('Steven')).toBe('Steven')
    expect(normalizeSpeaker('Unknown')).toBe('Unknown')
  })

  it('모르는 화자명은 Unknown으로 반환한다', () => {
    expect(normalizeSpeaker('President Biden')).toBe('Unknown')
    expect(normalizeSpeaker('')).toBe('Unknown')
  })

  it('guestName 힌트가 있으면 부분 일치도 인정한다', () => {
    expect(normalizeSpeaker('Luis', 'Luis')).toBe('Luis')
    expect(normalizeSpeaker('Luis von Ahn', 'Luis')).toBe('Luis')
  })
})

describe('parseSpeakerResponse', () => {
  it('정상 응답을 파싱한다', () => {
    const json = '[{"translation":"안녕","speaker":"Angela"},{"translation":"반가워","speaker":"Steven"}]'
    const result = parseSpeakerResponse(json, 2)
    expect(result[0]).toEqual({ translation: '안녕', speaker: 'Angela' })
    expect(result[1]).toEqual({ translation: '반가워', speaker: 'Steven' })
  })

  it('배열이 짧으면 Unknown으로 채운다', () => {
    const json = '[{"translation":"안녕","speaker":"Angela"}]'
    const result = parseSpeakerResponse(json, 3)
    expect(result).toHaveLength(3)
    expect(result[1]).toEqual({ translation: '', speaker: 'Unknown' })
    expect(result[2]).toEqual({ translation: '', speaker: 'Unknown' })
  })

  it('JSON 파싱 실패 시 전부 Unknown 빈값으로 채운다', () => {
    const result = parseSpeakerResponse('not json', 2)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ translation: '', speaker: 'Unknown' })
  })
})
```

### Step 2: 테스트 실패 확인

```bash
cd projects/nsq && npx vitest run src/__tests__/translate.test.ts
# 예상 출력: buildSentenceTranslationPrompt, normalizeSpeaker, parseSpeakerResponse not found
# chunkSegments 테스트도 CHUNK_SIZE 변경으로 실패
```

### Step 3: `translate.ts` 수정

**변경 내용 전체**:

```typescript
// CHUNK_SIZE 변경
const CHUNK_SIZE = 30  // 기존 50에서 변경 (문장 세그먼트는 더 길어짐)

// 기존 buildTranslationPrompt 유지 (하위 호환)

// 추가: 화자 포함 번역 프롬프트
export function buildSentenceTranslationPrompt(segments: Segment[]): string {
  const lines = segments.map((s, i) => `${i + 1}. ${s.text}`).join('\n')
  return (
    `This is a transcript from "No Stupid Questions" podcast.\n` +
    `Two regular hosts (Angela Duckworth, Steven Dubner) plus one guest per episode.\n` +
    `Identify the speaker for each line using context clues (self-introductions, name mentions).\n` +
    `Use the actual name when identifiable; use "Unknown" otherwise.\n\n` +
    `Translate each line to Korean.\n` +
    `Output JSON array ONLY — no explanation:\n` +
    `[{"translation":"한국어","speaker":"Angela"}, ...]\n\n` +
    lines
  )
}

// 추가: speaker 정규화
const KNOWN_SPEAKERS = new Set(['Angela', 'Steven', 'Unknown'])

export function normalizeSpeaker(raw: string, guestName?: string): string {
  if (KNOWN_SPEAKERS.has(raw)) return raw
  if (guestName && raw.toLowerCase().includes(guestName.toLowerCase())) return guestName
  return 'Unknown'
}

// 추가: speaker 응답 파싱
export type SpeakerTranslation = { translation: string; speaker: string }

export function parseSpeakerResponse(content: string, count: number): SpeakerTranslation[] {
  const empty = (): SpeakerTranslation => ({ translation: '', speaker: 'Unknown' })
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return Array(count).fill(null).map(empty)
    const parsed = JSON.parse(jsonMatch[0]) as SpeakerTranslation[]
    const result = parsed.slice(0, count)
    while (result.length < count) result.push(empty())
    return result
  } catch {
    return Array(count).fill(null).map(empty)
  }
}

// translateChunk 수정: string[] 대신 SpeakerTranslation[] 반환
export async function translateChunk(
  segments: Segment[],
  chunkIndex: number,
  checkpointDir: string
): Promise<SpeakerTranslation[]> {
  const checkpointPath = path.join(checkpointDir, `translate_chunk_${chunkIndex}.json`)

  if (fs.existsSync(checkpointPath)) {
    return JSON.parse(fs.readFileSync(checkpointPath, 'utf-8')) as SpeakerTranslation[]
  }

  const prompt = buildSentenceTranslationPrompt(segments)
  let items: SpeakerTranslation[]

  try {
    const content = await callOpenRouterRaw(prompt)  // 하단 설명
    items = parseSpeakerResponse(content, segments.length)
  } catch {
    try {
      const content = await callOpenRouterRaw(prompt)
      items = parseSpeakerResponse(content, segments.length)
    } catch {
      items = Array(segments.length).fill(null).map(() => ({ translation: '', speaker: 'Unknown' }))
    }
  }

  fs.writeFileSync(checkpointPath, JSON.stringify(items), 'utf-8')
  return items
}

// callOpenRouter를 raw string 반환으로 분리 (내부 함수)
// 기존 callOpenRouter()는 JSON.parse까지 했으므로 분리 필요
async function callOpenRouterRaw(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY environment variable is not set')
  const model = process.env.TRANSLATION_MODEL ?? 'google/gemini-flash-1.5'
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenRouter API error: ${res.status} ${body}`)
  }
  const data = await res.json() as { choices: { message: { content: string } }[] }
  return data.choices[0].message.content.trim()
}

// translateAllSegments 수정: SpeakerTranslation을 Segment에 매핑
export async function translateAllSegments(
  segments: Segment[],
  checkpointDir: string,
  onProgress?: (done: number, total: number) => void
): Promise<Segment[]> {
  const chunks = chunkSegments(segments)
  const result: Segment[] = [...segments]
  let done = 0

  for (let i = 0; i < chunks.length; i++) {
    const items = await translateChunk(chunks[i], i, checkpointDir)
    const offset = i * CHUNK_SIZE
    items.forEach((item, j) => {
      result[offset + j] = {
        ...result[offset + j],
        translation: item.translation,
        speaker: item.speaker,
      }
    })
    done += chunks[i].length
    onProgress?.(done, segments.length)
  }

  // Clean up checkpoints
  for (let i = 0; i < chunks.length; i++) {
    const p = path.join(checkpointDir, `translate_chunk_${i}.json`)
    if (fs.existsSync(p)) fs.unlinkSync(p)
  }

  return result
}
```

### Step 4: 테스트 통과 확인

```bash
cd projects/nsq && npx vitest run src/__tests__/translate.test.ts
# 예상 출력: ✓ 전체 pass
```

---

## Task 4 — Import Route 함수 교체

**파일 수정**: `src/app/api/import/route.ts`

### 수정 내용

```typescript
// 변경 전 (line ~9 import)
import { vttToSegments } from '@/lib/vtt'

// 변경 후
import { vttToSentences } from '@/lib/vtt'

// 변경 전 (subtitle 처리 내부, ~line 136)
segments = vttToSegments(fs.readFileSync(path.join(episodeDir, vttFile), 'utf-8'))
// ...
segments = vttToSegments(vttContent)

// 변경 후
segments = vttToSentences(fs.readFileSync(path.join(episodeDir, vttFile), 'utf-8'))
// ...
segments = vttToSentences(vttContent)
```

`segments` 변수 타입은 `Segment[]`으로 동일하므로 나머지 코드 변경 없음.

### 검증

```bash
cd projects/nsq && npx tsc --noEmit
# 예상: 에러 없음
```

---

## Task 5 — SpeakerBadge 컴포넌트 수정 + 시각 검증

**파일 수정**: `src/components/ImmersionMode.tsx`

### 수정 내용

```typescript
// 변경 전
function SpeakerBadge({ text }: { text: string }) {
  if (text.startsWith('Angela')) { ... }
  if (text.startsWith('Mike')) { ... }
  return null
}
// 사용처
<SpeakerBadge text={seg.text} />

// 변경 후
const SPEAKER_STYLE: Record<string, string> = {
  Angela: 'bg-primary-normal/10 text-primary-normal border-primary-normal/20',
  Steven: 'bg-status-warning/10 text-status-warning border-status-warning/20',
}

function SpeakerBadge({ speaker }: { speaker?: string }) {
  if (!speaker || speaker === 'Unknown') return null
  const cls = SPEAKER_STYLE[speaker] ?? 'bg-fill-normal text-label-assistive border-line-normal-normal/20'
  return (
    <span className={`inline-block text-[10px] font-extrabold px-[7px] py-[1px] rounded mr-1.5 align-middle border ${cls}`}>
      {speaker}
    </span>
  )
}
// 사용처
<SpeakerBadge speaker={seg.speaker} />
```

### 타입 검증

```bash
cd projects/nsq && npx tsc --noEmit
# 예상: 에러 없음
```

### 시각 검증

SpeakerBadge 렌더링을 확인하기 위해 기존 `segments.json`에 임시로 speaker 필드 추가:

```bash
# 테스트용: rIXyULee-ek/segments.json의 index=0 세그먼트에 "speaker": "Angela" 추가
# (수동으로 또는 jq 커맨드)
cd /Users/zorba/.shadowing/episodes/rIXyULee-ek
cp segments.json segments.json.bak
python3 -c "
import json
segs = json.load(open('segments.json'))
segs[0]['speaker'] = 'Angela'
segs[1]['speaker'] = 'Steven'
segs[2]['speaker'] = 'Angela'
json.dump(segs, open('segments.json', 'w'))
"
```

**기대 렌더링**: ImmersionMode에서 세그먼트 0번 앞에 파란 `Angela` 뱃지, 1번 앞에 주황 `Steven` 뱃지가 표시됨.

**시각 검증 체크리스트**:
- [ ] `npm run dev` 후 `http://localhost:3000/player/rIXyULee-ek` 접속
- [ ] ImmersionMode 전환 확인
- [ ] `Angela` 배지가 파란색(primary), `Steven` 배지가 주황색(warning)으로 표시되는지 확인
- [ ] 배지 없는 세그먼트에서 null 렌더링 (공백 없음) 확인
- [ ] 다크 테마 배경에서 가독성 확인
- [ ] 확인 후 `mv segments.json.bak segments.json`으로 원복

---

## Verification Matrix

| Requirement | Source | Implementation file | Verification | Evidence |
|---|---|---|---|---|
| gap ≥ 1.5s → 새 문장 | Design doc §3.2 | `src/lib/vtt.ts` | vitest | pending |
| 구두점 → 새 문장 | Design doc §3.2 | `src/lib/vtt.ts` | vitest | pending |
| 50단어 초과 → 새 문장 | Design doc §3.2 | `src/lib/vtt.ts` | vitest | pending |
| gap < 0 (overlap) → 병합 | Evaluator Issue 6 | `src/lib/vtt.ts` | vitest | pending |
| translation+speaker JSON 파싱 | Design doc §3.3 | `src/lib/translate.ts` | vitest | pending |
| speaker whitelist 정규화 | Evaluator Issue 2 | `src/lib/translate.ts` | vitest | pending |
| 파싱 실패 시 Unknown 채움 | Evaluator Issue 3 | `src/lib/translate.ts` | vitest | pending |
| CHUNK_SIZE = 30 | Design doc §3.3 | `src/lib/translate.ts` | vitest | pending |
| import route → vttToSentences | Design doc §3.1 | `src/app/api/import/route.ts` | tsc --noEmit | pending |
| SpeakerBadge speaker prop | Design doc §3.5 | `src/components/ImmersionMode.tsx` | tsc + 브라우저 | pending |
| Angela 배지 파란색 | Design doc §3.5 | `src/components/ImmersionMode.tsx` | 브라우저 시각 | pending |
| Unknown/undefined → 배지 숨김 | Design doc §3.5 | `src/components/ImmersionMode.tsx` | 브라우저 시각 | pending |

---

## Checklist JSON Mapping

| Task ID | Task 이름 |
|---|---|
| task-1 | Segment 타입에 speaker 필드 추가 |
| task-2 | vttToSentences 구현 및 테스트 |
| task-3 | 번역 파이프라인 speaker 추론 추가 |
| task-4 | import route vttToSentences 교체 |
| task-5 | SpeakerBadge prop 변경 및 시각 검증 |

---

## Out-of-Scope and Intentional Deviations

- **기존 에피소드 마이그레이션**: 범위 밖. `speaker?: string`이 optional이므로 기존 데이터 하위 호환.
- **SentenceMode.tsx SpeakerBadge**: 현재 SentenceMode에 SpeakerBadge 없음 — 이번 범위 밖.
- **audio diarization**: 범위 밖 (LLM 텍스트 추론만).
- **게스트 자동 감지**: `normalizeSpeaker`의 `guestName` 파라미터는 구현만. 호출 시 자동 추출 로직은 범위 밖 (기본 `Unknown` fallback 처리).
