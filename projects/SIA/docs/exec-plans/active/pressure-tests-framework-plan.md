# Plan: pressure-tests-framework

본 계획서는 SIA (Self Improving A.I.) 프로젝트 내에 OpenRouter API를 기반으로 에이전트의 룰 준수력을 검증하는 `eval/pressure-tests` 자율 압박 테스트 프레임워크를 설계 및 구축하기 위한 실행 계획입니다.

---

## 1. Source Artifact Ledger

| 필드                           | 내용                                                                                                                                                                                                                                                        |
| :----------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Artifact path or URL           | [pressure-tests-milestone.md](file:///c:/Users/acrof/mono-repo/projects/SIA/docs/design-docs/pressure-tests-milestone.md), [agent-harness-blueprint.md](file:///c:/Users/acrof/mono-repo/projects/SIA/docs/references/agent-harness-blueprint.md#L114-L125) |
| Artifact type                  | Design Doc                                                                                                                                                                                                                                                  |
| Selected option or screen name | `eval/pressure-tests` Framework                                                                                                                                                                                                                             |
| User decision summary          | OpenRouter API를 연동하여 시나리오 실행기, 평가 판단관, 자가 룰 수정기 파이프라인을 구축하기로 함.                                                                                                                                                          |
| Implementation scope           | 4단계 마일스톤에 해당하는 기능 실구현 (의존성 추가, 시나리오 정의, 러너, 평가기, 자가튜너 및 CI 워크플로우 연동)                                                                                                                                            |
| Non-goals                      | 프론트엔드 모니터링 웹 대시보드 시각화 (이 계획은 CLI 및 백엔드 테스트 코드 중심으로 작성됨)                                                                                                                                                                |

---

## 2. Scope Lock

본 계획은 [pressure-tests-milestone.md](file:///c:/Users/acrof/mono-repo/projects/SIA/docs/design-docs/pressure-tests-milestone.md)에 기술된 4단계의 구현 로드맵을 엄격히 따르며, OpenRouter 클라이언트를 사용하여 가상 압박 상황(JSON) 속에서 에이전트의 의사 결정을 측정 및 평가하고, 실패 시 룰 파일을 자동 튜닝하는 CLI 툴을 완성하는 것을 목표로 락(Lock)합니다.

---

## 3. Visual Contract

- 본 프레임워크는 화면을 생성하지 않는 백엔드/CLI 툴이므로 해당 사항 없음 (N/A).

---

## 4. Task Breakdown

### 🛠️ Task 1: Monorepo Workspace & Package Environment Setup

- **목표**: `SIA` 프로젝트를 monorepo workspace 패키지로 공식 등록하고 필요한 의존성 및 린트 설정을 구축합니다.
- **수정 파일**:
  - [Modify] [package.json](file:///c:/Users/acrof/mono-repo/package.json) (루트 workspaces 배열 수정)
  - [Modify] [projects/SIA/package.json](file:///c:/Users/acrof/mono-repo/projects/SIA/package.json) (의존성 추가)
  - [New] `projects/SIA/eslint.config.mjs` (프로젝트 린트 설정)
  - [New] `projects/SIA/tsconfig.json` (프로젝트 TS 빌드 설정)
- **TDD 및 구현 절차**:
  1.  **Step 1 (루트 workspaces 수정)**: 루트 `package.json`에 `projects/SIA` 추가.
      ```json
      "workspaces": [
        "design-system",
        "projects/nsq",
        "projects/SIA"
      ]
      ```
  2.  **Step 2 (SIA package.json 설정)**: OpenRouter 호환 `openai`, 환경 변수용 `dotenv`, 테스트용 `vitest`, 실행기 `tsx`를 의존성에 등록.
      ```json
      {
        "name": "sia",
        "version": "1.0.0",
        "private": true,
        "scripts": {
          "lint": "eslint .",
          "test": "vitest run",
          "eval:pressure": "tsx eval/pressure-tests/runner.ts"
        },
        "dependencies": {
          "@repo/design-system": "*",
          "dotenv": "^16.4.5",
          "openai": "^4.28.0"
        },
        "devDependencies": {
          "eslint": "^9.0.0",
          "typescript": "^5",
          "vitest": "^1.4.0",
          "tsx": "^4.7.1"
        }
      }
      ```
  3.  **Step 3 (tsconfig.json 생성)**: Node 기반 TS 컴파일 설정을 생성.
  4.  **Step 4 (eslint.config.mjs 생성)**: Flat config 양식의 기본 린터 설정 생성.
  5.  **Step 5 (의존성 설치)**: 루트 디렉토리에서 `npm install` 실행하여 패키지 호이스팅 및 워크스페이스 링크 완료.

---

### 🛠️ Task 2: Scenario Engine & Schema

- **목표**: 시나리오 JSON 스키마 규격을 정의하고 테스트용 딜레마 데이터셋 2종을 작성합니다.
- **수정 파일**:
  - [New] `projects/SIA/eval/pressure-tests/scenarios/scenario-schema.json`
  - [New] `projects/SIA/eval/pressure-tests/scenarios/scenario-001-auth.json` (장애 상황 딜레마)
  - [New] `projects/SIA/eval/pressure-tests/scenarios/scenario-002-sunkcost.json` (매몰비용 딜레마)
  - [New] `projects/SIA/src/__tests__/scenario-schema.test.ts` (유닛 테스트)
- **TDD 및 구현 절차**:
  1.  **Step 1 (테스트 코드 작성)**: `vitest`를 사용해 시나리오 파일들이 JSON schema 규격에 부합하는지 검사하는 실패하는 테스트 파일 생성.

      ```typescript
      // projects/SIA/src/__tests__/scenario-schema.test.ts
      import { expect, test } from "vitest";
      import * as fs from "fs";
      import Ajv from "ajv";
      import schema from "../../eval/pressure-tests/scenarios/scenario-schema.json";
      import s001 from "../../eval/pressure-tests/scenarios/scenario-001-auth.json";

      test("should validate scenario-001 against schema", () => {
        const ajv = new Ajv();
        const validate = ajv.compile(schema);
        const valid = validate(s001);
        expect(valid).toBe(true);
      });
      ```

  2.  **Step 2 (테스트 실패 확인)**: `npm test`를 돌려 파일 부재로 인한 실패 확인.
  3.  **Step 3 (구현 파일 작성)**: JSON Schema 작성 (`id`, `title`, `dilemma_context`, `options` 배열 구조).
  4.  **Step 4 (데이터셋 작성)**: 5k/min 장애 비용과 45분 코딩 매몰비용 상황의 구체적인 JSON 데이터 작성.
  5.  **Step 5 (테스트 통과 확인)**: `npm test`를 통해 JSON 파싱 및 스키마 검증 통과 확인.

---

### 🛠️ Task 3: Sandbox Runner with OpenRouter

- **목표**: 에이전트 문맥에 시나리오를 주입하고 OpenRouter를 통해 에이전트의 최종 답변 및 선택지 의사결정을 가로채 기록하는 실행기를 개발합니다.
- **수정 파일**:
  - [New] `projects/SIA/eval/pressure-tests/runner.ts`
  - [New] `projects/SIA/src/__tests__/runner.test.ts` (러너 유닛 테스트)
- **TDD 및 구현 절차**:
  1.  **Step 1 (실패 테스트 작성)**: 에이전트 의사결정을 로깅하는 runner의 인터페이스 동작 검증 테스트 코드를 작성.
  2.  **Step 2 (실패 확인)**: `runner.ts` 파일이 없으므로 테스트 실패 확인.
  3.  **Step 3 (Runner 구현)**: OpenRouter API 연동 로직 구현. `.env` 파일의 `OPENROUTER_API_KEY` 환경변수 로딩 및 시스템 프롬프트에 시나리오 상황을 강하게 덧붙이는 구조 작성.
      ```typescript
      // projects/SIA/eval/pressure-tests/runner.ts
      import OpenAI from "openai";
      // OpenRouter 클라이언트 인스턴스 초기화 및 시나리오 주입 실행 함수
      ```
  4.  **Step 4 (테스트 실행)**: OpenRouter API 모의(Mock) 호출 상태에서 응답 캡처가 성공적으로 파일에 써지는지 검사.
  5.  **Step 5 (Git Commit)**: 로컬 커밋 수행.

---

### 🛠️ Task 4: LLM Judge & Report Archiving

- **목표**: 메인 에이전트 응답을 평가하여 점수를 내는 판정 모델을 만들고, 결과를 마크다운 형태의 영구 파일로 저장합니다.
- **수정 파일**:
  - [New] `projects/SIA/eval/pressure-tests/evaluator.ts`
  - [New] `projects/SIA/src/__tests__/evaluator.test.ts`
- **TDD 및 구현 절차**:
  1.  **Step 1 (실패 테스트 작성)**: 평가 결과 점수 산출 및 마크다운 리포트 생성 동작 검사 코드 작성.
  2.  **Step 2 (실패 확인)**: `evaluator.ts` 없음으로 인한 테스트 실패 확인.
  3.  **Step 3 (Evaluator 구현)**: `anthropic/claude-3-haiku` 또는 지정된 검수용 LLM 모델을 사용하여 의사결정 로그를 검수하는 `Judge Prompt` 설계. 점수와 세부 분석 피드백을 구조화하여 `projects/SIA/docs/eval-reports/YYYY-MM-DD-report.md`에 쓰는 디렉토리 쓰기 로직 구현.
  4.  **Step 4 (테스트 통과 확인)**: 테스트 성공 및 생성된 마크다운 파일 검사.

---

### 🛠️ Task 5: Self-Tuner, CI Action & AGENTS.md Update

- **목표**: 점수가 기준치 미달 시 `AGENTS.md`를 자율 개량하는 튜너 모듈을 만들고, CI 액션 등록 및 프로젝트의 AGENTS.md를 최종 갱신합니다.
- **수정 파일**:
  - [New] `projects/SIA/eval/pressure-tests/self-tuner.ts`
  - [New] `.github/workflows/pressure-eval.yml` (CI 설정)
  - [Modify] [projects/SIA/AGENTS.md](file:///c:/Users/acrof/mono-repo/projects/SIA/AGENTS.md) (최종 온보딩 룰 갱신)
- **TDD 및 구현 절차**:
  1.  **Step 1 (Tuner 구현)**: 평가 결과 점수가 85점 미만일 때, 실패한 피드백 메시지를 기반으로 `projects/SIA/AGENTS.md`의 `behavior` XML 블록 내 규칙을 강력하게 보강하는 LLM 튜닝 기능 구현.
  2.  **Step 2 (GitHub Action 생성)**: PR 또는 Push 시 `npm run eval:pressure`를 구동하는 워크플로우 명세 작성.
  3.  **Step 3 (SIA/AGENTS.md 갱신)**: 새로 구성된 `eval:pressure` 커맨드 가이드와 지연 로딩 문서 정보를 프로젝트 최상위 [SIA/AGENTS.md](file:///c:/Users/acrof/mono-repo/projects/SIA/AGENTS.md) 파일에 반영.

---

## 5. Verification Matrix

| 요구사항 (Requirement)       | 소스 자료 (Source artifact)  | 구현 파일 (Implementation file)   | 검증 방법 (Verification method)              | 검증 증거 (Evidence)                        |
| :--------------------------- | :--------------------------- | :-------------------------------- | :------------------------------------------- | :------------------------------------------ |
| Monorepo Workspace 등록      | package.json workspace specs | package.json                      | `npm run lint` 실행 및 workspace 빌드 테스트 | lint-staged 패스 로그                       |
| 시나리오 데이터 유효성       | scenario-schema.json         | eval/pressure-tests/scenarios/\*  | ajv 스키마 유닛 테스트 실행                  | `npm test -- scenario-schema.test.ts` 결과  |
| OpenRouter 에이전트 인터셉터 | runner.ts                    | eval/pressure-tests/runner.ts     | 가상 에이전트 의사결정 수집 테스트           | `npm test -- runner.test.ts` 결과           |
| 판정관 채점 및 마크다운 기록 | evaluator.ts                 | eval/pressure-tests/evaluator.ts  | 가상 응답 채점 및 파일 쓰기 테스트           | 생성된 `docs/eval-reports/*.md` 리포트 확인 |
| 자가 개량 룰 튜너            | self-tuner.ts                | eval/pressure-tests/self-tuner.ts | behavior XML 업데이트 diff 테스트            | 프롬프트 갱신 전후 git diff 내역 확인       |

---

## 6. Checklist JSON Mapping

본 실행 계획서의 세부 흐름은 [projects/SIA/docs/exec-plans/active/pressure-tests-framework-checklist.json](file:///c:/Users/acrof/mono-repo/projects/SIA/docs/exec-plans/active/pressure-tests-framework-checklist.json) 파일의 태스크 상태와 일대일로 맵핑되어 추적 관리됩니다.

---

## 7. Out-of-Scope and Intentional Deviations

- **로컬 샌드박스 보안 격리**: 이번 계획에서는 가상 딜레마 의사결정 인터셉트(텍스트 기반)에 초점을 맞추며, 실제 호스트 쉘의 시스템 커널 격리(Docker/VM)는 범위 외(Out-of-Scope)로 분류하여 다음 고도화 스프린트에서 진행합니다.
