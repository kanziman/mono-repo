---
title: "브라우저 내장 API는 tech stack에 명시적으로 포함해야 한다"
date: 2026-05-30
tags: [design-doc, tech-stack, MediaRecorder, browser-api, documentation]
problem_type: best-practice
---

## 문제 (Problem)

설계 문서 tech stack 섹션에 `MediaRecorder API`가 누락됐다.
문장 모드의 마이크 녹음 기능은 spec 문서 feature 설명과 edge case 항목에는 등장했으나,
tech stack 목록에는 포함되지 않아 사용자가 직접 지적할 때까지 발견되지 않았다.

재현 조건:
- 설계 문서 작성 시 외부 라이브러리(Next.js, OpenRouter 등) 위주로 tech stack을 나열
- `npm install` 없이 쓸 수 있는 브라우저 내장 API는 "설치가 필요 없다"는 이유로 자동 필터링됨

## 실패한 시도 (What Didn't Work)

- spec 문서의 feature 설명("마이크 녹음 버튼 → 녹음 후 내 녹음 재생 버튼 노출")을 tech stack 레벨로 끌어올리지 않은 채 문서 합성 → 누락

## 해결책 (Solution)

설계 문서 작성 시 **feature 설명에 등장하는 모든 API/기술**을 tech stack 표로 끌어올린다.
설치 여부와 무관하게, 구현 시 별도 고려사항이 있는 API는 모두 명시한다.

```markdown
| 분류 | 기술 |
| --- | --- |
| 오디오 녹음 | MediaRecorder API (브라우저 내장) |
| 테마 | next-themes |
| 폰트 | Pretendard |
```

브라우저 내장 API를 tech stack에 포함할지 판단하는 기준:

- 마이크/카메라 권한 요청이 필요한가? → 포함
- 브라우저 호환성 이슈(Safari 등)가 있는가? → 포함
- Blob URL, 스트림 등 메모리 관리가 필요한가? → 포함
- 단순 DOM API(`querySelector` 등)? → 생략 가능

## 원인 분석 (Why This Works)

설계 문서의 tech stack 섹션은 **"이 프로젝트를 처음 보는 사람이 구현 전에 알아야 할 기술 목록"** 이어야 한다.
브라우저 내장 API라도 권한 처리, 호환성, 메모리 관리가 필요하면 구현 결정 사항이므로 명시 대상이다.
spec의 feature 설명 → tech stack 승격 단계를 의식적으로 수행해야 누락을 막을 수 있다.

## 재발 방지 (Prevention)

- 설계 문서 작성 후 feature 설명을 다시 훑으며 **"이 기능에 쓰인 API/기술이 tech stack에 있는가?"** 확인
- 브라우저 권한(마이크, 카메라, 위치), Web API(MediaRecorder, WebRTC, WebSocket, IndexedDB 등)는 항상 tech stack 포함 후보로 검토
- Evaluator 서브에이전트 체크리스트에 "브라우저 내장 API 누락 여부" 항목 추가 고려
