# Execution Plan: Design System Rules Enforcement

## 1. Source Artifact Ledger

- **Artifact Path**: [implementation_plan.md](../../../../../.gemini/antigravity-ide/brain/fb281832-85f2-44ca-8c9c-342fe99bd7fb/implementation_plan.md)
- **Artifact Type**: design doc
- **Selected Option or Screen Name**: ESLint custom rules & split docs & skillification
- **User Decision Summary**: ESLint Flat Config 내 커스텀 플러그인 룰 구현하여 posttooluse 및 lint-staged 시점에 색상/인라인 스타일 위반을 에러 처리하도록 승인함.
- **Implementation Scope**: exact reproduction
- **Non-goals and Known Deviations**: Spacing numeric scale에 대한 검사는 오탐 방지를 위해 제외함.

## 2. Scope Lock

이 계획은 디자인 시스템에 대한 Do/Don't 가이드라인을 제공하고, 에이전트 지침을 스킬화하며, `eslint.config.mjs` 내에 커스텀 ESLint 규칙(`design-system/no-hardcoded-colors`)을 직접 구현하여 하드코딩 색상 및 인라인 스타일을 posttooluse 및 pre-commit 시점에 차단하도록 범위를 규정(Scope Lock)합니다.

## 3. Visual Contract

- 이 작업은 시각 요소의 추가가 아닌, 디자인 토큰 정책 강제화 및 정적 분석 훅 도입 목적의 인프라성 작업이므로 Visual Contract 및 시각적 screenshot target은 해당하지 않습니다.

## 4. Task Breakdown

### Task 1: do.md & dont.md 가이드 문서 생성
- **파일**:
  - [do.md](file:///Users/zorba/mono-repo/design-system/docs/do.md) (New)
  - [dont.md](file:///Users/zorba/mono-repo/design-system/docs/dont.md) (New)
  - [DESIGN.md](file:///Users/zorba/mono-repo/design-system/DESIGN.md) (Modify - 신규 가이드 링크 추가)
- **작업 내용**:
  - 디자인 시스템 색상/컴포넌트 권장 사용(Do)과 지양/금지(Don't) 규칙을 가이드 문서로 상세 기술.
  - 메인 `DESIGN.md` 인덱스에 두 문서의 링크를 추가.
- **Git Commit**: `docs(ds): add Do and Don't guidelines for design system usage`

### Task 2: design-system 에이전트 스킬 생성
- **파일**: [SKILL.md](file:///Users/zorba/mono-repo/.agents/skills/design-system/SKILL.md) (New)
- **작업 내용**:
  - 에이전트가 코딩 작업 시 이 디자인 시스템 규격을 반드시 지키도록 유도하는 지침 문서 생성.
  - Do/Don't 체크리스트 및 docs 하위 세부 링크들 지도로 제공.
- **Git Commit**: `docs(ds): create agent skill definition for design system compliance`

### Task 3: AGENTS.md에 신규 스킬 매핑 연동
- **파일**:
  - [AGENTS.md](file:///Users/zorba/mono-repo/AGENTS.md) (Modify)
  - [AGENTS.md](file:///Users/zorba/mono-repo/projects/nsq/AGENTS.md) (Modify)
- **작업 내용**:
  - 모노레포 루트 및 nsq 하위의 `AGENTS.md` 파일 내 스킬 매핑 테이블에 `design-system` 스킬을 추가하고 가이드 문구를 최신화.
- **Git Commit**: `docs(nsq): link design-system skill in AGENTS.md maps`

### Task 4: eslint.config.mjs 내에 커스텀 플러그인 규칙 구현
- **파일**: [eslint.config.mjs](file:///Users/zorba/mono-repo/projects/nsq/eslint.config.mjs) (Modify)
- **작업 내용**:
  - `eslint.config.mjs` 파일 내에 `design-system/no-hardcoded-colors` 규칙을 탐색하는 인라인 플러그인(`designSystemPlugin`) 추가.
  - 정규식 탐색을 활용해:
    1. JSX `className` 속성 내 하드코딩된 Tailwind 색상 클래스 탐색 및 에러 보고.
    2. JSX `style` 속성 내 `color`/`backgroundColor`/`borderColor`에 하드코딩된 색상 직접 선언 탐색 및 에러 보고.
- **검증 절차 (TDD - 실패 검증)**:
  - 룰 활성화 후, `projects/nsq/src/app/page.tsx` 내에 고의로 `className="bg-red-500"` 또는 `style={{ color: '#ff0000' }}`을 작성.
  - `npm run lint`를 실행하여 해당 라인이 디자인 시스템 위반 사유로 빌드 에러를 내며 실패하는지 검증.
- **Git Commit**: `feat(nsq): implement custom eslint plugin for design system verification`

### Task 5: 린트 통과 검증 및 위반 코드 롤백
- **파일**: [page.tsx](file:///Users/zorba/mono-repo/projects/nsq/src/app/page.tsx) (Modify)
- **작업 내용**:
  - Task 4에서 테스트용으로 삽입했던 위반 코드를 정상 복구.
  - `npm run lint` 및 `npm run test`를 실행하여 린터와 테스트가 모두 녹색(Pass)인지 검증.
- **Git Commit**: `test(nsq): verify eslint validation pass on clean code`

### Task 6: 실행 계획 마감 및 index.md 반영
- **파일**: [index.md](file:///Users/zorba/mono-repo/projects/nsq/docs/exec-plans/index.md) (Modify)
- **작업 내용**:
  - 모든 태스크 완료 후 체크리스트 JSON `done` 업데이트 및 completed 디렉토리 이동.
  - `index.md` 맵 동기화.
- **Git Commit**: `docs(nsq): complete execution plan for design system rules enforcement`

## 5. Verification Matrix

| Requirement | Source Artifact | Implementation File | Verification Method | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| do.md & dont.md 추가 | implementation_plan.md | design-system/docs/do.md 등 | 파일 존재 여부 및 인덱스 링크 동작 검토 | pending |
| design-system 스킬 생성 | implementation_plan.md | .agents/skills/design-system/SKILL.md | 스킬 명세 구성 확인 | pending |
| ESLint 내 훅 규칙 구현 | implementation_plan.md | projects/nsq/eslint.config.mjs | `npm run lint` (TDD 위반 코드 삽입 후 차단) | pending |
| 최종 린트 통과 및 롤백 | implementation_plan.md | projects/nsq/src/app/page.tsx | `npm run lint` (정상 롤백 후 성공 통과) | pending |

## 6. Checklist JSON Mapping

- **Checklist Path**: `projects/nsq/docs/exec-plans/active/design-system-rules-enforcement-checklist.json`
- **Mapping**: JSON tasks와 Task 1~6 매핑 일치함.

## 7. Out-of-Scope and Intentional Deviations

- Spacing numeric scale에 대한 차단, 기타 속성(margin, padding 등의 크기) 감지는 오탐 위험이 높으므로 훅 규칙에서 완전히 제외합니다.
