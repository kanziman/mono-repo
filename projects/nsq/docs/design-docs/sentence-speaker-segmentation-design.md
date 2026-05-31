# Sentence-Level Segmentation + Speaker Identification Design Document

**Status**: Draft — 2026-05-31  
**Scope**: New imports only (existing episodes not migrated)

---

## 1. 목적 & 요구사항

### 문제

YouTube VTT auto-sub은 sliding window 방식으로 생성돼 각 세그먼트가 문장 중간에서 잘린다. 현재 `vttToSegments()`는 dedup 후에도 문장 경계를 무시한 ~14단어 단편을 반환하며, 번역 청크가 인덱스 50 단위로 잘려 문맥 단절을 일으킨다.

### 요구사항

1. 세그먼트를 silence gap / 구두점 기준 **문장 단위**로 병합
2. 번역과 함께 **화자 이름**을 단일 LLM 패스로 추론
3. `segments.json`에 `speaker` 필드 추가
4. `SpeakerBadge`가 텍스트 휴리스틱 대신 `seg.speaker` 읽도록 변경
5. **새 임포트에만 적용** — 기존 에피소드 마이그레이션 없음

---

## 2. 검증 및 피드백

**판별자 주요 이슈**:

1. Context carryover가 checkpoint 재개 시 버그 유발 (청크 N의 이전 청크 컨텍스트가 삭제돼 불일치)
2. LLM이 화자명을 자유 형식으로 반환하면 오염된 값이 segments.json에 저장됨
3. `translateWithSpeaker()`가 미정의 — 길이 불일치 시 speaker 기본값 누락
4. VTT overlap (gap < 0)을 gap 기준 병합 로직이 처리 못할 수 있음
5. 최대 35단어 기준이 자연 문장을 중간에 자를 위험

**조정 및 반영 대책**:

- Context carryover **제거** → 단순성 우선, 경계 문제는 추후 데이터로 검증
- 화자명 **whitelist 정규화**: LLM 출력 → `Angela | Steven | <guest> | Unknown`으로 매핑
- `translateWithSpeaker()` 함수 서명 및 fallback 명시
- gap < 0 케이스 처리: gap이 음수면 병합 계속 (overlap이므로 경계 아님)
- 최대 단어 수 35 → **50**으로 완화

---

## 3. 상세 설계

### 3.1 파이프라인 변경

```
현재: VTT → vttToSegments() → translateAllSegments() → segments.json
변경: VTT → vttToSentences() → translateWithSpeaker() → segments.json
```

`import/route.ts`에서 `vttToSegments` → `vttToSentences` 한 줄 교체.

---

### 3.2 `vttToSentences()` — `src/lib/vtt.ts`

기존 `vttToSegments`(dedup 포함)의 출력을 입력으로 받아 **3가지 조건** 중 하나를 만족하면 새 문장으로 분리:

| 조건 | 값 | 근거 |
|---|---|---|
| silence gap | ≥ 1.5s | 데이터 분석: 발화 전환의 명확한 신호 |
| 구두점 종결 | `.` `?` `!` | 문장 종결 |
| 최대 단어 수 | > 35 단어 | 번역/화자 추론 품질 유지 |

```typescript
export function vttToSentences(vtt: string, gapThreshold = 1.5): Segment[] {
  const raw = vttToSegments(vtt)
  const sentences: Omit<Segment, 'index'>[] = []
  let current: Omit<Segment, 'index'> | null = null

  for (const seg of raw) {
    if (!current) { current = { ...seg, translation: '' }; continue }

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

예상: 419 세그먼트 → ~150–200 문장 세그먼트.

---

### 3.3 `translateWithSpeaker()` — `src/lib/translate.ts`

#### 프롬프트 구조

```
This is a transcript from a podcast called "No Stupid Questions."
Two regular hosts (Angela Duckworth and Steven Dubner) plus one guest per episode.
Identify the speaker for each line using context clues (self-introductions, name mentions).
Use the actual name when identifiable; use "Unknown" otherwise.

Translate each line to Korean.
Output JSON array ONLY — no explanation:
[{"translation":"한국어","speaker":"Angela"}, ...]

1. I'm Angela Duckworth I'm Steven Dubner and you're listening...
2. today on the show how do you get people to work for free...
```

#### 응답 파싱

```typescript
type TranslationItem = { translation: string; speaker: string }

// translateChunk 내부:
const items: TranslationItem[] = JSON.parse(jsonMatch[0])
// checkpoint: TranslationItem[] (기존 string[] 에서 변경)
```

#### 화자 컨텍스트 연속성

Context carryover 없음 (checkpoint 재개 시 불일치 버그 → YAGNI). 청크 내 컨텍스트만으로 화자 추론. 청크 경계 오류는 추후 데이터 검증 후 필요 시 추가.

#### 화자명 정규화

LLM 출력을 그대로 저장하면 오염 위험. 저장 전 whitelist 매핑:

```typescript
const KNOWN_SPEAKERS = new Set(['Angela', 'Steven', 'Unknown'])

function normalizeSpeaker(raw: string, guestName?: string): string {
  if (KNOWN_SPEAKERS.has(raw)) return raw
  if (guestName && raw.toLowerCase().includes(guestName.toLowerCase())) return guestName
  return 'Unknown'
}
```

#### 청크 크기

문장 세그먼트는 더 길므로 `CHUNK_SIZE = 30` (기존 50에서 감소).

---

### 3.4 타입 변경 — `src/types/index.ts`

```typescript
export interface Segment {
  index: number
  start: number
  end: number
  text: string
  translation: string
  speaker?: string   // 추가
}
```

---

### 3.5 `SpeakerBadge` 변경 — `src/components/ImmersionMode.tsx`

현재: `text.startsWith('Angela')` 텍스트 휴리스틱  
변경: `seg.speaker` 직접 읽기

```typescript
// 변경 전
function SpeakerBadge({ text }: { text: string }) {
  if (text.startsWith('Angela')) { ... }
  if (text.startsWith('Mike')) { ... }
}

// 변경 후
function SpeakerBadge({ speaker }: { speaker?: string }) {
  if (!speaker || speaker === 'Unknown') return null
  const colorMap: Record<string, string> = {
    Angela: 'bg-primary-normal/10 text-primary-normal border-primary-normal/20',
    Steven: 'bg-status-warning/10 text-status-warning border-status-warning/20',
  }
  const cls = colorMap[speaker] ?? 'bg-fill-normal text-label-assistive border-line-normal-normal/20'
  return (
    <span className={`inline-block text-[10px] font-extrabold px-[7px] py-[1px] rounded mr-1.5 align-middle border ${cls}`}>
      {speaker}
    </span>
  )
}
// 사용처: <SpeakerBadge speaker={seg.speaker} />
```

게스트 화자는 `colorMap`에 없으면 neutral 스타일로 자동 처리.

---

### 3.6 영향 범위 요약

| 파일 | 변경 내용 |
|---|---|
| `src/lib/vtt.ts` | `vttToSentences()` 추가 (기존 함수 유지) |
| `src/lib/translate.ts` | 프롬프트 변경, 응답 파싱 `{translation,speaker}[]`, CHUNK_SIZE=30, 컨텍스트 carryover |
| `src/types/index.ts` | `speaker?: string` 추가 |
| `src/app/api/import/route.ts` | `vttToSegments` → `vttToSentences` 교체 |
| `src/components/ImmersionMode.tsx` | `SpeakerBadge` prop 변경 |
| `src/components/SentenceMode.tsx` | SpeakerBadge 동일 변경 (있는 경우) |

---

## 4. 예외 및 실패 대응

| 시나리오 | 대응 |
|---|---|
| LLM이 speaker를 못 맞춤 | `"Unknown"` 반환 → SpeakerBadge 숨김 (null return) |
| JSON 파싱 실패 | 기존 재시도 로직 유지, 실패 시 `translation: '', speaker: 'Unknown'`으로 채움 |
| 응답 배열 길이 불일치 | 기존 normalize 로직에서 `speaker` 기본값 `'Unknown'` 추가 |
| 청크 경계 화자 불연속 | 이전 청크 마지막 3문장 context carryover로 완화 |
| 기존 episodes.json 호환 | `speaker` 는 optional → undefined일 때 SpeakerBadge는 null 반환, 하위 호환 유지 |
