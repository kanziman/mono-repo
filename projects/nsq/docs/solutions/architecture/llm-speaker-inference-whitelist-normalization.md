---
title: "LLM 텍스트 기반 화자 추론 + whitelist 정규화 패턴"
date: 2026-06-01
tags: [llm, speaker, diarization, whitelist, normalization, openrouter]
problem_type: architecture
---

# 문제

오디오 diarization 없이 텍스트만으로 화자를 식별해야 하는 상황.
YouTube auto-sub에는 speaker 태그가 없다.
LLM에게 화자 식별을 맡기면 자유 형식("Angela Duckworth", "Dr. Duckworth", "Host 1" 등)으로 반환해
`segments.json`에 오염된 값이 저장될 위험이 있다.

재현 조건:
- 팟캐스트 "No Stupid Questions" (Angela Duckworth, Steven Dubner + 게스트)
- LLM이 "Angela Duckworth", "The host", "Duckworth", "Speaker A" 등으로 제각각 반환

# 실패한 시도

- LLM 출력을 그대로 저장: `segments.json`에 "Angela Duckworth", "Dr. Angela", "Host" 등 비일관 값 혼재
- 후처리 없이 UI에서 `text.startsWith('Angela')` 휴리스틱으로 처리: 텍스트가 바뀌면 오탐, 화자 데이터가 텍스트에 결합됨

# 해결책

### 프롬프트에 출력 형식 명시

```typescript
export function buildSentenceTranslationPrompt(segments: Segment[]): string {
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
```

### 저장 전 whitelist 정규화

```typescript
const KNOWN_SPEAKERS = new Set(['Angela', 'Steven', 'Unknown'])

export function normalizeSpeaker(raw: string, guestName?: string): string {
  if (KNOWN_SPEAKERS.has(raw)) return raw
  if (guestName && raw.toLowerCase().includes(guestName.toLowerCase())) return guestName
  return 'Unknown'
}
```

### UI는 `seg.speaker` 필드만 읽기 (텍스트 휴리스틱 제거)

```typescript
function SpeakerBadge({ speaker }: { speaker?: string }) {
  if (!speaker || speaker === 'Unknown') return null
  // ...
}
// usage: <SpeakerBadge speaker={seg.speaker} />
```

# 원인 분석

팟캐스트 화자는 에피소드 초반에 자기소개를 한다("I'm Angela Duckworth, I'm Steven Dubner").
LLM은 이 컨텍스트를 이용해 이후 발화를 귀속시킬 수 있다.
단, 청크 경계에서 컨텍스트가 잘리면 첫 몇 줄은 Unknown이 될 수 있는데, 이는 허용 가능한 오류다.
Whitelist 정규화가 없으면 LLM의 자유 형식 출력이 데이터를 오염시키므로, 저장 전 정규화가 필수다.

# 재발 방지

- 새 팟캐스트/콘텐츠 추가 시 `KNOWN_SPEAKERS` Set과 `normalizeSpeaker()` 로직 검토
- LLM 출력을 `segments.json`에 직접 저장하는 코드 경로에서 반드시 `normalizeSpeaker()` 통과
- 게스트 화자가 있는 경우 `guestName` 파라미터로 부분 일치를 허용 (예: `normalizeSpeaker('Luis von Ahn', 'Luis')` → `'Luis'`)
- `SpeakerBadge`는 항상 `seg.speaker` prop을 읽을 것. `seg.text` 휴리스틱 재도입 금지.
