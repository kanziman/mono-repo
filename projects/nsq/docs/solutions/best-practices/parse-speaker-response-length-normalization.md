---
title: "LLM JSON 응답 배열 길이 불일치 시 안전한 fallback 파싱 패턴"
date: 2026-06-01
tags: [llm, json, parsing, fallback, normalization, speaker]
problem_type: best-practice
---

# 문제

LLM에게 N개 세그먼트의 번역+화자 JSON 배열을 요청했을 때, 응답 배열 길이가 N과 다를 수 있다:
- 배열이 짧음: LLM이 일부 항목을 누락
- 배열이 긺: LLM이 추가 항목 삽입
- JSON 파싱 자체 실패: LLM이 JSON 외 텍스트 포함

어느 경우든 `segments[i].translation`이나 `segments[i].speaker`에 접근하면 `undefined`가 될 수 있다.

재현 조건:
- `translateChunk(segments, ...)` 호출 후 응답 배열 길이가 `segments.length`와 다를 때

# 실패한 시도

- `parsed[i].translation`을 직접 인덱스 접근: 길이 초과 시 `undefined` 할당
- 기존 `string[]` 번역의 length normalization만 복사: `speaker` 기본값 누락

# 해결책

`parseSpeakerResponse()` 함수에서 파싱 → 길이 정규화 → 실패 시 전체 fallback을 한 번에 처리한다.

```typescript
export type SpeakerTranslation = { translation: string; speaker: string }

export function parseSpeakerResponse(content: string, count: number): SpeakerTranslation[] {
  const empty = (): SpeakerTranslation => ({ translation: '', speaker: 'Unknown' })
  try {
    // JSON 배열만 추출 (LLM이 앞뒤에 설명 텍스트를 붙이는 경우 방어)
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return Array(count).fill(null).map(empty)

    const parsed = JSON.parse(jsonMatch[0]) as SpeakerTranslation[]

    // 길이 정규화: 긴 경우 자르기, 짧은 경우 빈값으로 채우기
    const result = parsed.slice(0, count)
    while (result.length < count) result.push(empty())
    return result
  } catch {
    // 파싱 실패: 전체를 빈값으로
    return Array(count).fill(null).map(empty)
  }
}
```

`translateChunk()`에서 재시도 후에도 실패하면 동일한 empty fallback 사용:

```typescript
} catch {
  items = Array(segments.length).fill(null).map(() => ({ translation: '', speaker: 'Unknown' }))
}
```

# 원인 분석

LLM은 확률적으로 동작하므로 출력 배열 길이가 입력 길이와 일치한다는 보장이 없다.
`/\[[\s\S]*\]/` 정규식으로 JSON 배열만 추출하면 LLM이 앞뒤에 붙이는 설명 텍스트를 제거할 수 있다.
`try/catch` + fallback 반환으로 파싱 실패가 전체 번역을 중단시키지 않고 graceful degradation이 가능하다.

# 재발 방지

- LLM 응답을 배열로 기대하는 모든 파싱 함수에 이 패턴 적용
- `parseSpeakerResponse(content, count)` 시그니처처럼 항상 기대 개수(`count`)를 파라미터로 전달
- 파싱 함수는 반드시 `count`개의 요소를 반환하도록 보장 (caller에서 length 체크 불필요)
- `speaker` 기본값은 반드시 `'Unknown'` (빈 문자열 금지 — `SpeakerBadge`가 `''`를 Unknown으로 처리하지 않을 수 있음)
