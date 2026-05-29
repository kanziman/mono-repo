---
name: nsq-build
description: "No Stupid Questions" 영어 학습 Next.js 앱의 구현 지원 및 품질 검증 오케스트레이터. TailwindCSS Montage DS, next-themes 다크모드, MediaRecorder API, OpenRouter AI 통합을 전문 에이전트 팀이 검토한다. "NSQ 앱", "영어 학습 앱", "컴포넌트 구현", "기능 QA", "전체 검증", "구현 완료 확인", "스펙 검증", "Montage DS 확인", "다크모드 확인", "다시 실행", "재실행", "수정 후 검증" 등의 요청 시 반드시 이 스킬을 사용할 것.
---

# NSQ 앱 개발 지원 오케스트레이터

**프로젝트:** "No Stupid Questions" 영어 학습 Next.js 앱
**스택:** Next.js App Router, TypeScript, TailwindCSS + Montage DS, next-themes, Pretendard, OpenRouter API, MediaRecorder API

**실행 모드:** 서브 에이전트 (Sub-agents) — 필요한 전문가만 온디맨드 호출, 결과는 오케스트레이터에게 반환
**아키텍처 패턴:** 전문가 풀 (Expert Pool) — 요청 유형에 따라 적합한 에이전트를 선택적으로 병렬 호출

---

## Phase 0: 컨텍스트 확인

- `_workspace/` 폴더가 존재하고 사용자가 "다시", "재실행", "업데이트", "수정 후", "이전 결과 기반으로" 표현을 사용했다면 → **부분 재실행** (해당 에이전트만 재호출)
- 그 외 → **초기 실행**

## Phase 1: 요청 분석 및 에이전트 선택

| 요청 유형 | 호출할 에이전트 |
|---|---|
| 전체 검증 / 구현 완료 확인 / 스펙 대비 QA | nextjs-reviewer + media-api-validator + ai-integration-reviewer + feature-flow-qa |
| Next.js / React Hooks / TailwindCSS / Montage DS / next-themes | nextjs-reviewer |
| 오디오 재생 / 녹음 / MediaRecorder / 동기화 | media-api-validator |
| AI 채팅 / OpenRouter / 폴백 / 환경변수 | ai-integration-reviewer |
| 기능 플로우 QA / 스펙 누락 / 경계면 검증 | feature-flow-qa |
| 코드 리뷰 / 보안 / 린트 / 성능 | `code-review` 스킬 사용 |

## Phase 2: 전문가 에이전트 병렬 호출

독립적인 전문가들은 `run_in_background: true`로 병렬 실행한다.

각 에이전트에 전달할 컨텍스트:
- 검토 대상 파일 경로
- 사용자 요청 내용
- 프로젝트 스팩 경로: `docs/superpowers/specs/2026-05-27-no-stupid-questions-english-design.md`

결과는 `_workspace/{에이전트명}_results.md`에 저장하도록 지시한다.

## Phase 3: 결과 종합

```
## NSQ 앱 검증 결과

### 🔴 즉시 수정 필요 (Critical)
...

### 🟡 개선 권장 (Warning)
...

### 🟢 정보성 메모 (Info)
...

### ✅ 이상 없음
...
```

전문가 간 상충 의견은 삭제하지 않고 출처를 함께 표기한다.

## 에러 핸들링

- 특정 에이전트 실패 시 1회 재시도
- 재시도 후에도 실패하면 해당 에이전트 결과 누락을 명시하고 나머지로 진행
- 검토 대상 파일이 없거나 접근 불가 시 사용자에게 경로 확인 요청

## 테스트 시나리오

**정상 흐름:** "AudioPlayer.tsx 구현 완료 확인해줘" → Phase 1에서 `nextjs-reviewer` + `media-api-validator` 병렬 호출 → 통합 보고서 출력

**에러 흐름:** `feature-flow-qa` 실패 → 1회 재시도 → 재실패 시 "feature-flow-qa 결과 누락" 명시 후 나머지 결과로 보고서 작성
