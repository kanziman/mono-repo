---
name: zb-writing-plans
description: 사용자가 피처 개발, 버그 수정 등 여러 단계의 작업 실행 계획(Implementation Plan) 수립을 요청할 때 사용합니다. 구현 코드 작성 전에 구체적인 작업 분할 및 진행률 관리를 위한 체크리스트 JSON 파일을 생성합니다.
---

# zb-writing-plans

이 스킬은 상세한 기능 개발 작업을 작업자(에이전트 또는 개발자)가 컨텍스트 낭비 없이 순차적으로 실행할 수 있도록 정밀한 작업 계획(`[명칭]-plan.md`)과 상태 관리용 JSON 체크리스트(`[명칭]-checklist.json`)를 작성하는 워크플로우를 정의합니다.

## 📂 계획서 저장 및 생명주기 (Storage & Lifecycle)

모든 작업 계획서와 체크리스트는 프로젝트의 다음 경로에 저장되어 관리되며, **인덱스 파일(`projects/[프로젝트명]/docs/exec-plans/index.md`)에 반드시 동기화**되어야 합니다:

1. **활성 단계 (Active)**
   - 계획서 생성 시: `projects/[프로젝트명]/docs/exec-plans/active/[plan-name]-plan.md`
   - 체크리스트 생성 시: `projects/[프로젝트명]/docs/exec-plans/active/[plan-name]-checklist.json`
   - **인덱스 반영**: 계획 수립 즉시 `docs/exec-plans/index.md` 파일의 **"⚡ 활성 계획 (Active Plans)"** 섹션에 `[ ] [계획명](active/[plan-name]-plan.md)` 링크와 시작일, 진행 상태를 등록합니다.
2. **완료 단계 (Completed)**
   - 모든 태스크 구현 및 검증 완료 후, 두 파일을 아래 경로로 이동(Move)합니다.
   - 이동 경로: `projects/[프로젝트명]/docs/exec-plans/completed/[plan-name]-plan.md` 및 `projects/[프로젝트명]/docs/exec-plans/completed/[plan-name]-checklist.json`
   - **인덱스 반영**: 이동 즉시 `docs/exec-plans/index.md` 파일의 **"⚡ 활성 계획"** 목록에서 삭제하고, **"🏁 완료된 계획 (Completed Plans)"** 표에 완료 날짜, 계획서 링크(completed/ 경로로 변경), 핵심 변경 요약, `[x] 완료` 상태를 업데이트합니다.

---

## 📊 체크리스트 JSON 규격 (Checklist JSON Schema)

상태 관리를 위한 JSON 파일은 아래 형식을 엄격히 따릅니다:

```json
{
  "planName": "feat-login",
  "status": "in-progress",
  "tasks": [
    {
      "id": "task-1",
      "name": "Add DB schema for users",
      "status": "todo"
    },
    {
      "id": "task-2",
      "name": "Implement authentication service",
      "status": "todo"
    }
  ]
}
```
*   `status` (프로젝트 진행 상태): `"todo"` | `"in-progress"` | `"done"`
*   각 task의 `status`: `"todo"` | `"in-progress"` | `"done"`

---

## 🏁 계획 작성 완료 및 다음 단계 가이드 (Next Action Guidance)

계획서(`*-plan.md`)와 체크리스트(`*-checklist.json`) 작성이 완료되면, 에이전트는 즉시 다음 작업을 임의로 시작하지 말고 **반드시 사용자에게 다음 의사를 묻고 가이드해야 합니다.**

1. **`zb-worktrees` 발동 여부 확인**:
   - 격리된 작업 환경(git worktree)을 생성하여 진행할지 여부를 명시적으로 묻고 결정합니다.
2. **실행 스킬 선택 안내**:
   - `zb-worktrees` 사용 여부와 관계없이, 이후 실제 구현 단계를 어떤 방식으로 진행할지 두 가지 옵션을 설명하고 선택을 요청합니다:
     - **Option 1: `zb-executing-plans` (직접 실행)**
       - 메인 에이전트가 직접 코드를 작성하고 수정합니다. 비교적 빠르고 명확한 태스크에 적합합니다.
     - **Option 2: `zb-subagent-driven-development` (서브에이전트 위임)**
       - 각 태스크를 완전히 격리된 구현 및 다단계 검증(스펙/품질) 서브에이전트들에게 위임합니다. 대규모 또는 정밀한 작업에 적합합니다.

```
zb-writing-plans ➡️ (사용자 확인) zb-worktrees 선택 ➡️ (사용자 선택) zb-executing-plans 또는 zb-subagent-driven-development ➡️ zb-finish-branch
```

---

## 🎯 Source Artifact Traceability

브레인스토밍, 목업, 스크린샷, HTML 프로토타입, 제품 스펙, 사용자 선택 옵션을 기반으로 계획을 작성하는 경우, 계획서 상단부에 **"Source Artifact Ledger"**를 반드시 포함합니다.

**Source Artifact Ledger 필수 필드**:
- Artifact path or URL
- Artifact type: brainstorm HTML, screenshot, design doc, product spec, existing screen
- Selected option or screen name
- User decision summary
- Implementation scope: exact reproduction | scoped subset | intentional deviation
- Non-goals and known deviations

선택된 artifact가 시각 자료라면, 계획서는 **"Visual Contract"** 섹션을 반드시 포함해야 합니다. Visual Contract에는 레이아웃 영역, 너비/높이, 간격, 표시되는 컨트롤, 빈 상태/로딩/에러 상태, 반응형 동작, 테마 동작, screenshot target을 측정 가능한 요구사항으로 기록합니다.

선택된 목업을 "레이아웃 개선", "UI 조정" 같은 모호한 작업으로 축약하면 안 됩니다. 구현 범위가 선택 artifact의 일부라면, 제외되는 visible part와 제외 사유를 명시하고 실행 전에 사용자 승인을 받아야 합니다.

## Required Plan Sections for UI/Product Work

UI, UX, 제품 동작, 생성된 디자인 artifact를 다루는 계획은 다음 섹션을 반드시 포함합니다:

1. Source Artifact Ledger
2. Scope Lock
3. Visual Contract
4. Task Breakdown
5. Verification Matrix
6. Checklist JSON Mapping
7. Out-of-Scope and Intentional Deviations

**Scope Lock**은 계획이 선택 artifact를 정확히 재현하는지, scoped subset만 구현하는지, intentional deviation을 포함하는지 한 문장으로 고정합니다. scoped subset을 구현하는 경우, 선택된 visual artifact의 subset 범위는 실행 전에 사용자 승인을 받아야 합니다.

**Verification Matrix**는 다음 형식을 사용합니다:

```markdown
| Requirement | Source artifact | Implementation file | Verification method | Evidence |
| --- | --- | --- | --- | --- |
| Right tutor panel is 420px and full-height | layout-options-v1.html option A | src/app/player/[videoId]/page.tsx | Playwright screenshot desktop | pending |
```

UI 요구사항의 `Evidence`가 실행 후 누락되어 있으면 계획을 ready/done 상태로 표시할 수 없습니다. Evidence에는 screenshot path, Playwright command output, 또는 사용자 확인 스크린샷의 명시적 기록 중 하나가 들어가야 합니다.

## 🛠️ 작업 분할 규칙 (Task Breakdown Rules)

1. **상세한 파일 정보 명시**: 각 Task마다 생성(`Create`), 수정(`Modify`), 테스트(`Test`)할 파일의 정확한 절대/상대 경로와 수정 라인 범위를 명시합니다.
2. **TDD 순서 적용**:
   - Step 1: 실패하는 테스트 코드 작성
   - Step 2: 테스트를 실행하여 실패 여부 확인
   - Step 3: 테스트를 통과할 최소한의 구현 코드 작성
   - Step 4: 테스트가 통과하는지 실행하여 확인
   - Step 5: Git 커밋 명령어 작성
3. **No Placeholders**: `TODO`, `TBD`, `추후 구현` 등의 모호한 단어는 절대 허용하지 않으며, 구현에 필요한 실제 코드 조각과 테스트 러너 명령어 및 예상 출력 메시지를 명시해야 합니다.
4. **`AGENTS.md` 업데이트 태스크 필수 추가**:
   - 새로운 하위 프로젝트 생성, 대규모 리팩토링, 외부 의존성(npm 패키지 등) 추가, 또는 `docs/` 하위에 기술 스펙 문서를 새로 생성하는 개발 계획을 세울 때는, 계획서의 최종 검증 단계 직전에 **"AGENTS.md 최신화 및 의존성 셋업/명령어 가이드 업데이트"**를 수행하는 명시적인 태스크를 강제로 계획서에 포함해야 합니다.
5. **UI 태스크 시각 검증 필수화** _(2026-05-30 추가, 근거: [ui-plan-execution-visual-validation.md](../../../projects/nsq/docs/solutions/workflow/ui-plan-execution-visual-validation.md))_:
   - 페이지·컴포넌트를 생성하는 UI 태스크는 `vitest` 외에 반드시 **브라우저 시각 검증** 항목을 포함해야 합니다.
   - 각 UI 태스크의 "검증 절차" 섹션에 다음을 명시합니다:

     ```markdown
     **시각 검증**:
     - [ ] `npm run dev` 후 브라우저에서 해당 페이지 직접 확인
     - [ ] screenshot target 명시: route, selector 또는 full page 기준, 저장 경로
     - [ ] viewport list 명시: 최소 desktop 1개와, 반응형 동작 가능성이 있으면 constrained width 1개 이상
     - [ ] 다크 테마 적용 여부 확인 (배경이 어두운가?)
     - [ ] 디자인 시스템 컴포넌트 실제 렌더링 확인 (Card, Button 등이 보이는가?)
     - [ ] 기대 레이아웃과 일치 여부 확인
     - [ ] evidence 기록: screenshot path, Playwright command output, 또는 사용자 확인 스크린샷
     ```

   - **"기대 렌더링" 묘사 추가**: 각 UI 태스크에 "이 태스크 후 보여야 할 모습"을 1–3줄로 기술합니다.
   - **체크리스트 JSON 연동**: UI 계획의 체크리스트 JSON에는 최종 visual parity/review 태스크를 반드시 포함합니다.
   - **논리 검증 ≠ 시각 검증**: `vitest` 통과만으로 UI 태스크를 완료 처리하면 안 됩니다. 두 가지를 모두 확인해야 태스크를 `done`으로 표시합니다.
