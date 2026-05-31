---
title: "OpenRouter invalid translation model produces empty segment translations"
date: 2026-05-31
tags: [openrouter, translation, import, checkpoints]
problem_type: bug
---

# 문제
`~/.shadowing/episodes/rz8iB0Id7M4` 에피소드 import 후 `segments.json`에는 세그먼트가 저장됐지만 모든 `translation` 값이 빈 문자열이었다.

확인된 상태:

```text
segments.json: 365 segments, translated 0, empty 365
translate_chunk_0.json..translate_chunk_7.json: all arrays contained only empty strings
```

OpenRouter 최소 호출에서 확인된 에러 메시지:

```text
OpenRouter API error: 404 {"error":{"message":"No endpoints found for google/gemini-flash-1.5.","code":404}, ...}
```

재현 조건:

- `projects/nsq/.env.local` 또는 기본값에 `TRANSLATION_MODEL=google/gemini-flash-1.5`가 설정되어 있다.
- `/api/import`가 번역 단계에서 OpenRouter에 번역 요청을 보낸다.
- OpenRouter가 해당 모델 엔드포인트를 제공하지 않아 404를 반환한다.

# 실패한 시도
- `segments.json`만 확인: 번역이 비어 있다는 증상은 보이지만, API 실패인지 병합 실패인지 구분할 수 없었다.
- 체크포인트 파일 존재만 확인: `translate_chunk_*.json` 파일이 있으므로 번역이 진행된 것처럼 보였지만, 실제 내용은 빈 문자열 배열이었다.
- UI/API 응답만 확인: import 스트림은 번역 실패를 에러로 표면화하지 않고 완료처럼 보낼 수 있어 근본 원인을 숨긴다.

# 해결책
유효한 OpenRouter 번역 모델로 변경하고, 실패한 빈 체크포인트와 `segments.json`을 재생성해야 한다.

예시:

```env
TRANSLATION_MODEL=<openrouter에서 현재 사용 가능한 모델 id>
```

번역 파이프라인도 실패를 조용히 빈 번역으로 저장하지 않도록 수정해야 한다.

```ts
try {
  translations = await callOpenRouter(prompt)
} catch (error) {
  throw error
}
```

체크포인트 정리 경로는 실제 저장 파일명과 일치해야 한다.

```ts
const p = path.join(checkpointDir, `translate_chunk_${i}.json`)
if (fs.existsSync(p)) fs.unlinkSync(p)
```

# 원인 분석
근본 원인은 OpenRouter에서 현재 `google/gemini-flash-1.5` 모델 엔드포인트를 찾지 못하는데, `translateChunk`가 두 번의 API 호출 실패 후 예외를 삼키고 `Array(segments.length).fill('')`를 저장하는 구조다.

그 결과 번역 실패가 import 실패로 전파되지 않고, 각 청크가 빈 문자열 배열로 정상 체크포인트처럼 저장된다. 이후 `translateAllSegments`는 이 빈 배열을 `segments.json`에 병합하므로 모든 `translation` 값이 빈 문자열이 된다.

추가로 체크포인트 삭제 코드가 `translate_chunk_${i}` 경로를 지우도록 되어 있지만 실제 파일은 `translate_chunk_${i}.json`으로 저장된다. 이 불일치 때문에 실패 체크포인트가 남아 다음 import에서도 그대로 재사용될 수 있다.

# 재발 방지
- OpenRouter 모델 ID는 import 전에 최소 요청으로 검증한다.
- 번역 API 실패는 빈 번역으로 대체하지 말고 import 에러로 표면화한다.
- 빈 문자열 비율이 높은 번역 결과는 실패로 간주하는 검증을 추가한다.
- 체크포인트 파일명은 저장과 삭제에서 동일한 상수를 사용한다.
- `translate_chunk_*.json`이 전부 빈 문자열인 경우 해당 에피소드는 재번역 전 체크포인트를 삭제한다.
