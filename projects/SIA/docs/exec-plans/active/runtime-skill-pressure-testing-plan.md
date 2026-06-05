# Plan: runtime-skill-pressure-testing

본 계획서는 SIA (Self Improving A.I.) 프로젝트 내 `zb-*` 개별 개발 스킬들이 런타임 상의 가상 장애/압박 속에서도 안전 규정을 타협하지 않고 양질의 산출물을 작성하는지 동적 검사하는 **런타임 스킬 압박 테스트 프레임워크(Phase 5)**의 상세 구현 계획서입니다.

---

## 1. Source Artifact Ledger

| 필드                           | 내용                                                                                                                                  |
| :----------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| Artifact path or URL           | [runtime-skill-pressure-testing.md](file:///c:/Users/acrof/mono-repo/projects/SIA/docs/design-docs/runtime-skill-pressure-testing.md) |
| Artifact type                  | Design Doc                                                                                                                            |
| Selected option or screen name | `eval/pressure-tests` Phase 5 Framework                                                                                               |
| User decision summary          | `zb-*` 스킬 실행 시 런타임 프록시 간섭, 산출물(Markdown)의 구조적/의미적 평가, 스킬 고유 프롬프트의 국소적 자가 튜닝 파이프라인 구축. |
| Implementation scope           | 런타임 간섭 인젝터, 스킬 산출물 평가 채점관, 스킬 전용 튜너 구현 및 통합 CLI 스크립트 작성                                            |
| Non-goals                      | 물리적 OS 컨테이너 보안 가상화 (이 단계에서는 CLI 쉘 입출력 가로채기와 마크다운 파싱 검증에 집중함)                                   |

---

## 2. Scope Lock

본 계획은 [runtime-skill-pressure-testing.md](file:///c:/Users/acrof/mono-repo/projects/SIA/docs/design-docs/runtime-skill-pressure-testing.md)에 기술된 마일스톤 5.1 ~ 5.3의 아키텍처 명세를 엄격히 따르며, 개별 스킬 실행 도중 모의 타임아웃/입력 압박을 주입하고 스킬 결과물([GOAL.md](file:///c:/Users/acrof/mono-repo/projects/SIA/docs/GOAL.md), `*-plan.md` 등)을 LLM Judge로 검사하여 불합격 시 스킬 지시서(프롬프트)를 자동 튜닝하는 CLI 엔진 구축으로 스코프를 제한합니다.

---

## 3. Visual Contract

- 본 프레임워크는 화면을 생성하지 않는 백엔드/CLI 개발이므로 해당 사항 없음 (N/A).

---

## 4. Task Breakdown

### 🛠️ Task 1: Runtime Interceptor Shell Wrapper

- **목표**: `zb-*` 도구 실행을 래핑하여 CLI 입출력을 실시간 모니터링하고 가상 방해 공작을 주입하는 프록시 쉘을 개발합니다.
- **수정 파일**:
  - [NEW] `projects/SIA/eval/pressure-tests/interceptors/interceptor-shell.ts`
  - [NEW] `projects/SIA/src/__tests__/interceptor-shell.test.ts` (유닛 테스트)
- **TDD 및 구현 절차**:
  1.  **Step 1 (테스트 작성)**: 모의 자식 프로세스 실행 시 중간에 stdout을 캡처하고, 특정 지연이나 에러를 반환하는 동작 검증 테스트 코드 작성.
  2.  **Step 2 (구현)**: `child_process.spawn`을 활용해 대상 스킬을 래핑하고, 설정된 압박 시나리오 규칙에 따라 입출력을 조작하는 인터셉터 클래스 구현.

---

### 🛠️ Task 2: Skill-Specific Pressuring Scenarios

- **목표**: 스킬별 압박 유발 상황과 모의 방해 데이터를 담은 JSON 데이터셋을 정의합니다.
- **수정 파일**:
  - [NEW] `projects/SIA/eval/pressure-tests/scenarios/skill-001-interview.json` (Vague/Rude user responses)
  - [NEW] `projects/SIA/eval/pressure-tests/scenarios/skill-002-plan.json` (Tight timeout constraint)
- **TDD 및 구현 절차**:
  1.  **Step 1 (데이터셋 작성)**: 각 스킬 상황의 고유 압박 요소를 기입한 JSON 데이터 작성.
  2.  **Step 2 (스키마 검증)**: 기존 `scenario-schema.json`에 스킬 압박 규격을 지원하도록 스키마를 약간 확장하고 유닛 테스트에 통합.

---

### 🛠️ Task 3: Skill Artifact Evaluator (Semantic Analyzer)

- **목표**: 에이전트가 완성한 마크다운 산출물 파일들을 구조적으로 분석하여 규칙 준수 점수를 채점하는 모듈을 개발합니다.
- **수정 파일**:
  - [NEW] `projects/SIA/eval/pressure-tests/skill-evaluator.ts`
  - [NEW] `projects/SIA/src/__tests__/skill-evaluator.test.ts`
- **TDD 및 구현 절차**:
  1.  **Step 1 (테스트 작성)**: 임의의 부실한 계획서 파일이 주어졌을 때 낮은 점수(< 85)를 반환하고, 양질의 계획서 파일이 주어졌을 때 높은 점수(>= 85)를 반환하는지 검사하는 Mock 테스트 작성.
  2.  **Step 2 (구현)**: OpenRouter API와 연결하여 생성된 파일의 텍스트 분석 및 룰 이행 평가(0-100점) 및 채점 결과 리포트 저장소(`docs/eval-reports/`)에 저장하는 로직 작성.

---

### 🛠️ Task 4: Skill-Specific Prompt Tuner

- **목표**: 평가 결과 기준치 미달 시, 해당 스킬 프롬프트 템플릿의 지시 문맥을 보강하는 튜너를 개발합니다.
- **수정 파일**:
  - [NEW] `projects/SIA/eval/pressure-tests/skill-tuner.ts`
  - [NEW] `projects/SIA/src/__tests__/skill-tuner.test.ts`
- **TDD 및 구현 절차**:
  1.  **Step 1 (테스트 작성)**: 튜닝이 작동하여 스킬 템플릿(예: `goal-interview-prompt.md`) 내부의 시스템 프롬프트가 보강되는지 확인하는 테스트 작성.
  2.  **Step 2 (구현)**: 판단관의 피드백을 전달하여 해당 스킬 템플릿 파일을 찾아 룰 강도를 촘촘하게 업데이트하는 LLM 수정 코드 작성.

---

### 🛠️ Task 5: Pipeline Integration & package.json scripts

- **목표**: `npm run eval:skill` 커맨드를 통해 모든 스킬 압박 테스트를 자동화합니다.
- **수정 파일**:
  - [NEW] `projects/SIA/eval/pressure-tests/run-skill-eval.ts` (전체 스킬 평가 오케스트레이터)
  - [Modify] [package.json](file:///c:/Users/acrof/mono-repo/projects/SIA/package.json) (`eval:skill` 스크립트 등록)
- **TDD 및 구현 절차**:
  1.  **Step 1 (오케스트레이터 구현)**: 각 스킬 실행 -> 인터셉터 개입 -> 산출물 채점 -> 자가 프롬프트 튜닝 연계 흐름 작성.
  2.  **Step 2 (스크립트 등록)**: `npm run eval:skill`로 실행할 수 있도록 `package.json`에 `tsx eval/pressure-tests/run-skill-eval.ts` 추가.

---

## 5. Verification Matrix

| 요구사항 (Requirement)    | 소스 자료 (Source artifact) | 구현 파일 (Implementation file)        | 검증 방법 (Verification method)        | 검증 증거 (Evidence)                         |
| :------------------------ | :-------------------------- | :------------------------------------- | :------------------------------------- | :------------------------------------------- |
| 스킬 런타임 입출력 간섭   | interceptor-shell.ts        | eval/pressure-tests/interceptors/\*    | 자식 프로세스 입출력 조작 유닛 테스트  | `npm test -- interceptor-shell.test.ts` 결과 |
| 스킬 압박 데이터 적합성   | skill-001/002.json          | eval/pressure-tests/scenarios/\*       | JSON 스펙 유효성 검사                  | `npm test -- scenario-schema.test.ts` 결과   |
| 산출물 시맨틱 평가        | skill-evaluator.ts          | eval/pressure-tests/skill-evaluator.ts | 마크다운 분석 채점 성공 여부           | `npm test -- skill-evaluator.test.ts` 결과   |
| 스킬별 특화 프롬프트 튜닝 | skill-tuner.ts              | eval/pressure-tests/skill-tuner.ts     | 타겟 스킬 템플릿 파일 갱신 diff 테스트 | `npm test -- skill-tuner.test.ts` 결과       |

---

## 6. Checklist JSON Mapping

본 실행 계획서의 세부 구현 흐름은 [projects/SIA/docs/exec-plans/active/runtime-skill-pressure-testing-checklist.json](file:///c:/Users/acrof/mono-repo/projects/SIA/docs/exec-plans/active/runtime-skill-pressure-testing-checklist.json) 파일의 태스크 상태와 일대일로 맵핑되어 관리됩니다.
