# LLM 경계분할 + 단어 타임라인 재정렬 Design Document

**Status**: Draft — 2026-06-03
**Scope**: 새 임포트 분할 로직 교체 (기존 에피소드 마이그레이션 없음)
**Supersedes**: [sentence-speaker-segmentation-design.md](sentence-speaker-segmentation-design.md) §3.2 (`vttToSentences` 타이밍 기반 분할)

---

## 1. 목적 & 문제

### 문제

문장쉐도잉의 chunk가 의도와 다르게 잘린다. 근본 원인은 분할이 **VTT 타이밍 휴리스틱**에 의존하는데 YouTube 자동자막에는 **문장부호가 전혀 없다**는 점이다.

현재 [`vttToSentences()`](../../src/lib/vtt.ts)는 연속 cue를 병합하다 아래 3조건 중 하나에서 끊는다:

| 조건 | 값 |
|---|---|
| silence gap | ≥ 1.5s |
| 구두점 종결 `.?!` | (자동자막에 부호 없음 → **거의 발동 안 함**) |
| 최대 단어 수 | > 50 |

부호 조건이 죽어 있으므로 실질 분할 기준은 **시간 간격 + 50단어 상한**뿐이다. 이는 "숨 쉬는 지점"이지 "문장이 끝나는 지점"이 아니다.

`rz8iB0Id7M4/segments.json` index 0의 실제 결과:

```
"wow you really have lowered your expectations haven't you that's why I'm"
```

→ 두 문장(`...haven't you?` + `that's why I'm so happy`)이 한 덩어리로 붙고, 동시에 `that's why I'm` / `so happy`로 문장 중간이 잘림. 화자 전환(`I'm Angela Duckworth` ↔ `and I'm Steven Dubner`)도 구분 못 함.

### 목표 분할 (사용자 기준 예시)

```
wow you really have lowered your expectations haven't you?
that's why I'm so happy
I'm Angela Duckworth
and I'm Steven Dubner
I'm a psychologist at Penn and I run an educational nonprofit called character lab
you also wrote the book grit
Yes
and I am a writer and I host a podcast called Freakonomics radio
and you wrote the book Freakonomics
```

→ **문장 끝 + 화자 전환** 단위. `Yes` 같은 짧은 맞장구도 독립 청크.

### 요구사항

1. 분할 기준을 시간 휴리스틱 → **LLM 의미·화자 경계**로 전환
2. 입도: **문장 + 화자 전환** (짧은 발화도 독립 청크)
3. 각 청크의 `start`/`end` **타임스탬프 정확 복원** (쉐도잉 오디오 재생 필수)
4. LLM 분할 실패 시 기존 로직으로 **안전 폴백** — 파이프라인 무중단, 타이밍 오염 0
5. 새 임포트에만 적용

---

## 2. 핵심 인사이트: 버려지던 단어 타임스탬프

"LLM은 텍스트만 주고 타이밍을 잃는다"는 우려는 **데이터를 우리가 버리고 있던 문제**였다. 원본 VTT는 단어 단위 타임스탬프를 inline 태그로 보유한다:

```
wow<00:00:00.320><c> you</c><00:00:00.440><c> really</c><00:00:00.599><c> have</c>...
```

그런데 [`vtt.ts`](../../src/lib/vtt.ts) `stripHtmlTags`의 `/<[^>]+>/g`가 이 타임스탬프를 전부 제거한다. → 파싱 단계에서 단어별 타이밍을 보존하면, LLM이 재분할한 청크를 단어 인덱스로 **정확히 재정렬**할 수 있다.

---

## 3. 상세 설계

### 3.1 파이프라인 변경

```
현재:  download → subtitle[vttToSentences: 시간 1.5s + 50단어] → translate[화자인식 LLM]
변경:  download → subtitle[parseWordTimeline → segmentTranscript(LLM) → alignChunksToTimeline] → translate[변경 없음]
```

분할 책임을 시간 휴리스틱에서 LLM으로 옮기고, 타이밍은 단어 타임라인으로 복원한다. **번역/화자 식별 단계는 그대로** 새 청크 위에서 동작한다.

### 3.2 `parseWordTimeline(vtt)` — `src/lib/vtt.ts` 신규

inline 타임스탬프를 보존해 단어 타임라인 + clean text를 반환한다.

```typescript
export interface WordToken { word: string; t: number }
export interface WordTimeline { tokens: WordToken[]; text: string }

export function parseWordTimeline(vtt: string): WordTimeline
```

**롤링윈도우 중복 제거 전략**: YouTube 자동자막은 각 timed cue가 "이전 줄 carryover(plain) + 신규 단어(inline 태그 포함)" 형태로 반복된다. → **inline `<...>` 타임스탬프 태그가 있는 줄의 신규 단어만 채택**하면 중복이 자연 제거된다. 현재의 텍스트 기반 dedup 휴리스틱보다 결정적이고 정확하다.

- cue 첫 단어: cue 시작시각 사용
- 이후 단어: 직전 inline 태그 시각 사용
- plain(태그 없는) carryover 줄: 스킵

결과 예:
```
[{word:"wow", t:0.16}, {word:"you", t:0.32}, {word:"really", t:0.44}, ...]
```

### 3.3 `segmentTranscript(timeline)` — `src/lib/segment.ts` 신규 (LLM 경계분할)

**경계 전용(boundary-only) 프롬프트**. LLM에 단어 변경 권한을 주지 않고 구분자·문장부호만 삽입하게 한다.

```
This is a transcript from the "No Stupid Questions" podcast.
Split it into shadowing chunks. Start a NEW chunk at:
  - the end of each sentence
  - each speaker turn (e.g. "I'm Angela Duckworth" | "and I'm Steven Dubner")
Keep chunks short — a single utterance or clause. Short backchannels
like "Yes" are their own chunk.

CRITICAL: Do NOT add, remove, reorder, or change any words.
Only insert the delimiter `|||` between chunks and sentence punctuation (. ? !).

<transcript text>
```

**모델**: `SEGMENTATION_MODEL` 환경변수 신설. 기본값 = `TRANSLATION_MODEL`(현재 `google/gemini-2.5-pro`). `callOpenRouterRaw`는 [`translate.ts`](../../src/lib/translate.ts)에서 재사용 또는 공용 모듈로 추출.

**토큰 검증 (핵심 안전장치)**: LLM 출력에서 구분자·부호를 제거하고 정규화한 토큰열이 입력 `tokens`와 일치하는지 확인.
- 일치 → 청크 경계 채택
- 불일치 → 같은 윈도우 1회 재시도 → 그래도 불일치면 그 윈도우만 `vttToSentences` 폴백

**윈도잉**: 긴 전사(이 에피소드 ≈ 250 cue / 수천 단어)는 LLM이 verbatim 반환 시 단어 누락 위험이 있으므로 ~N단어 윈도우(소폭 overlap)로 분할 호출. 윈도우 경계가 문장 중간을 가르지 않도록 overlap 영역에서 경계를 병합.

**체크포인트**: translate처럼 윈도우별 결과를 `segment_window_{i}.json`으로 저장 → resume 가능.

### 3.4 `alignChunksToTimeline(chunks, tokens)` — 재정렬

토큰열이 보존되므로(§3.3 검증) 인덱스 기반 정확 정렬.

```typescript
export function alignChunksToTimeline(
  chunks: string[],
  tokens: WordToken[]
): Segment[]
```

two-pointer 순차 소비:
- 각 청크의 단어 수만큼 `tokens`를 소비
- `chunk.start` = 첫 토큰 `t`
- `chunk.end` = 마지막 토큰 `t` (또는 다음 청크 첫 토큰 `t`)

→ `Segment[]`(`index/start/end/text/translation:''`) 생성. 이후 기존 `translateAllSegments`로 전달.

### 3.5 번역 단계 — 변경 없음

[`translateAllSegments`](../../src/lib/translate.ts)는 새 청크 위에서 그대로 동작하며 `speaker`/`translation`을 부여한다. 화자 식별 프롬프트도 유지. (분할이 이미 화자 전환을 반영하므로 화자 식별 정확도도 부수적으로 향상.)

### 3.6 영향 범위

| 파일 | 변경 |
|---|---|
| `src/lib/vtt.ts` | `parseWordTimeline()` 추가. `vttToSentences`/`vttToSegments`는 **폴백용 유지** |
| `src/lib/segment.ts` | 신규: `segmentTranscript()`, `alignChunksToTimeline()`, 토큰 검증/윈도잉/폴백 |
| `src/lib/translate.ts` | `callOpenRouterRaw` 공용화(선택). 번역 로직 자체는 무변경 |
| `src/app/api/import/route.ts` | subtitle 단계: `vttToSentences` → `parseWordTimeline → segmentTranscript → alignChunksToTimeline` |
| 환경변수 | `SEGMENTATION_MODEL` 신설 (기본 = `TRANSLATION_MODEL`) |

`Segment` 타입과 `SpeakerBadge`는 [sentence-speaker-segmentation-design.md](sentence-speaker-segmentation-design.md)에서 이미 처리됨 — 변경 없음.

---

## 4. 예외 및 실패 대응

| 시나리오 | 대응 |
|---|---|
| LLM 분할 호출 실패 | 1회 재시도 → 실패 시 윈도우 단위 `vttToSentences` 폴백 |
| 출력 토큰열 ≠ 입력 | 재시도 → 폴백 (타이밍 오염 방지) |
| LLM이 단어 추가/삭제 | 토큰 검증에서 포착 → 폴백 |
| inline 태그 없는 VTT (수동 자막 등) | `parseWordTimeline`이 cue 시작시각으로 균등 분배하거나 `vttToSentences` 폴백 |
| 긴 전사 단어 누락 | 윈도잉 + 윈도우별 토큰 검증 |
| 기존 epodes 호환 | 새 임포트만 적용, 기존 segments.json 무변경 |

---

## 5. 테스트

- `parseWordTimeline`: 단어/시각 추출 정확성, 롤링윈도우 중복 제거, 태그 없는 cue 처리
- `alignChunksToTimeline`: 경계 → start/end 매핑, 단어 수 불일치 방어
- `segmentTranscript`: mock LLM으로 (a) 정상 분할 (b) 토큰 불일치 시 폴백 (c) 윈도우 병합 경로
- 회귀: 기존 `vtt.test.ts`(`vttToSentences`/`vttToSegments`) 유지 — 폴백 경로 보증

---

## 6. 비용

분할용 LLM 1패스 추가(출력 ≈ 입력 크기, 경계+부호만). 번역 LLM은 그대로. 윈도잉으로 호출당 입력 관리. 분할 품질 우선이므로 `SEGMENTATION_MODEL` 기본값을 강한 모델(`gemini-2.5-pro`)로 둠.
