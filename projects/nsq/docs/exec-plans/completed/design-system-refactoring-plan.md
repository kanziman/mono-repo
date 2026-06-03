# Execution Plan: Design System Refactoring (Semantic Tokens & Document Split)

## 1. Source Artifact Ledger

- **Artifact Path**: [design-system-improvement-design.md](../../design-docs/design-system-improvement-design.md)
- **Artifact Type**: design doc
- **Selected Option or Screen Name**: Option A (명시적 상태 토큰 & 대분류 3분할)
- **User Decision Summary**: outlined/assistive hover opacity를 CSS 변수로 토큰화하여 하드코딩 rgba()를 제거하고, DESIGN.md 문서를 세부 파트별로 분리하여 인덱스화함.
- **Implementation Scope**: exact reproduction
- **Non-goals and Known Deviations**: Typography Fluid scale, Tailwind spacing scale 개편 등은 다루지 않음.

## 2. Scope Lock

이 계획은 [design-system-improvement-design.md](../../design-docs/design-system-improvement-design.md)를 기반으로 하여, `globals.css` 및 `tailwind.config.ts`에 outlined/assistive hover 토큰을 신규 추가하고 `Button.tsx` 등 컴포넌트에 적용하며, 기존의 단일 `DESIGN.md` 문서를 세 개 파일로 분리하고 레포지토리 내의 깨진 링크들을 수정하는 작업을 범위로 잠금(Scope Lock)합니다.

## 3. Visual Contract

- **레이아웃 영역**: `Button` 컴포넌트의 outlined / assistive variant
- **표시되는 컨트롤**: 마우스 호버 시 배경의 미세 색상 투명도
- **반응형/테마 동작**: 
  - 라이트 모드일 때: 배경에 `4%` 투명도 적용
  - 다크 모드일 때: 배경에 `8%` 투명도 적용 (시인성 확보 목적)
- **Screenshot Target**: `http://localhost:3000/dev/tokens` 페이지

## 4. Task Breakdown

### Task 1: 신규 세맨틱 토큰에 대한 회귀/검증 테스트 작성 (TDD)
- **파일**: [design-system-tailwind-config.test.ts](../../../src/__tests__/design-system-tailwind-config.test.ts)
- **작업 내용**: 
  - `tailwind.config.ts` 내에 `primary-outlined-hover`, `assistive-outlined-hover`, `positive-outlined-hover`, `negative-outlined-hover` 컬러 토큰이 존재하는지 검증하는 실패 테스트 코드를 먼저 작성.
- **검증 절차**:
  - `npm run test` 실행하여 해당 테스트가 실패(fail)하는지 확인.
- **Git Commit**: `test(nsq): add failing tests for new semantic hover tokens`

### Task 2: globals.css에 CSS 변수 추가 및 tailwind.config.ts 매핑
- **파일**: 
  - [globals.css](file:///Users/zorba/mono-repo/design-system/globals.css) (Modify)
  - [tailwind.config.ts](file:///Users/zorba/mono-repo/design-system/tailwind.config.ts) (Modify)
- **작업 내용**:
  - `globals.css`의 `:root` 및 `.dark`에 각각 4%, 8% 투명도 기준의 `--semantic-*-outlined-hover-bg` CSS 변수 추가.
  - `tailwind.config.ts`에 이를 색상 토큰으로 등록.
- **검증 절차**:
  - `npm run test` 실행하여 Task 1에서 작성한 테스트가 통과하는지 확인.
- **Git Commit**: `feat(ds): add semantic hover variables and map in tailwind config`

### Task 3: Button.tsx 컴포넌트 리팩토링
- **파일**: [Button.tsx](file:///Users/zorba/mono-repo/design-system/components/Button/Button.tsx) (Modify)
- **작업 내용**:
  - outlined variant 호버 색상 분기 처리 시 하드코딩된 `enabled:hover:bg-[rgba(...)]` 형식을 지우고, 새로 선언한 `bg-primary-outlined-hover`, `bg-assistive-outlined-hover` 등의 Tailwind 클래스로 대체.
- **검증 절차**:
  - **시각 검증**:
    - [ ] `npm run dev` 후 브라우저에서 `/dev/tokens` 페이지 직접 확인
    - [ ] screenshot target: `/dev/tokens` 내의 buttons / token swatches
    - [ ] viewport list: desktop (1280x800)
    - [ ] 다크 테마 적용 여부 확인 (다크모드에서도 버튼 호버 시 투명도 8%가 적절히 식별되는가?)
    - [ ] 디자인 시스템 컴포넌트 실제 렌더링 확인 (outlined/assistive 버튼들이 이그러짐 없이 정상 작동하는가?)
    - [ ] evidence 기록: Playwright test 또는 수동 캡처 증적 기록
- **Git Commit**: `refactor(ds): replace hardcoded hover rgba values with semantic variables in Button`

### Task 4: DESIGN.md 명세 문서 분리
- **파일**:
  - [DESIGN.md](file:///Users/zorba/mono-repo/design-system/DESIGN.md) (Modify)
  - [foundations.md](file:///Users/zorba/mono-repo/design-system/docs/foundations.md) (New)
  - [components.md](file:///Users/zorba/mono-repo/design-system/docs/components.md) (New)
  - [accessibility-usage.md](file:///Users/zorba/mono-repo/design-system/docs/accessibility-usage.md) (New)
- **작업 내용**:
  - 기존 `DESIGN.md`를 쪼개어 기초 토큰(`foundations.md`), 아토믹 컴포넌트(`components.md`), 접근성/가이드(`accessibility-usage.md`)로 분리.
  - `DESIGN.md`는 세부 문서들의 링크 및 전체 맵을 가이드하는 인덱스로 축소 개편.
- **Git Commit**: `docs(ds): split DESIGN.md into foundations, components, and usage guides`

### Task 5: 레포지토리 내 DESIGN.md 참조 링크 일괄 업데이트
- **파일**: 모노레포 내 `DESIGN.md` 문자열이 발견되는 모든 md 및 소스코드 파일 (Grep & Modify)
- **작업 내용**:
  - `grep`을 사용해 `DESIGN.md`를 가리키는 기존 링크나 텍스트를 찾아내어 분리된 세부 문서 링크로 알맞게 교체.
- **Git Commit**: `docs(nsq): update markdown link references for split design-system docs`

### Task 6: 최종 검증 및 AGENTS.md 맵 최신화
- **파일**: [AGENTS.md](file:///Users/zorba/mono-repo/AGENTS.md) (Modify)
- **작업 내용**:
  - 모든 단위 테스트(`npm run test`) 및 스모크 테스트(`bash scripts/smoke-test.sh`)를 통과하는지 확인.
  - 새 문서가 생성되었으므로 `AGENTS.md` 내의 Documentation Map을 최신화.
- **Git Commit**: `docs(nsq): update AGENTS.md documentation map`

## 5. Verification Matrix

| Requirement | Source Artifact | Implementation File | Verification Method | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| outlined/assistive hover 토큰 추가 | design-system-improvement-design.md | design-system/globals.css | `npm run test` (vitest config test) | pending |
| Button 컴포넌트 하드코딩 rgba 제거 | design-system-improvement-design.md | design-system/components/Button/Button.tsx | `/dev/tokens` 브라우저 수동 확인 | pending |
| DESIGN.md 분리 및 인덱스화 | design-system-improvement-design.md | design-system/DESIGN.md 등 | 파일 존재 여부 및 마크다운 렌더링 확인 | pending |
| 모노레포 내 링크 깨짐 방지 | design-system-improvement-design.md | AGENTS.md 등 | `grep` 링크 정밀 검토 | pending |

## 6. Checklist JSON Mapping

- **Checklist Path**: `projects/nsq/docs/exec-plans/active/design-system-refactoring-checklist.json`
- **Mapping**: JSON tasks와 Task 1~6 매핑 일치함.

## 7. Out-of-Scope and Intentional Deviations

- Spacing scale 개편, Typography Fluid 스케일, 혹은 기타 컴포넌트(Select, DatePicker 등)의 리팩토링은 이번 작업 범위에서 완전히 제외함.
