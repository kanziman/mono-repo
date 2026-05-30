---
name: zb-writing-plans
description: 사용자가 피처 개발, 버그 수정 등 여러 단계의 작업 실행 계획(Implementation Plan) 수립을 요청할 때 사용합니다. 구현 코드 작성 전에 구체적인 작업 분할 및 진행률 관리를 위한 체크리스트 JSON 파일을 생성합니다.
---

# zb-writing-plans

이 스킬은 상세한 기능 개발 작업을 작업자(에이전트 또는 개발자)가 컨텍스트 낭비 없이 순차적으로 실행할 수 있도록 정밀한 작업 계획(`[명칭]-plan.md`)과 상태 관리용 JSON 체크리스트(`[명칭]-checklist.json`)를 작성하는 워크플로우를 정의합니다.

## 📂 계획서 저장 및 생명주기 (Storage & Lifecycle)

모든 작업 계획서와 체크리스트는 프로젝트의 다음 경로에 저장되어 관리됩니다:

1. **활성 단계 (Active)**
   - 계획서 생성 시: `projects/[프로젝트명]/docs/exec-plans/active/[plan-name]-plan.md`
   - 체크리스트 생성 시: `projects/[프로젝트명]/docs/exec-plans/active/[plan-name]-checklist.json`
2. **완료 단계 (Completed)**
   - 모든 태스크 구현 및 검증 완료 후, 두 파일을 아래 경로로 이동(Move)합니다.
   - 이동 경로: `projects/[프로젝트명]/docs/exec-plans/completed/[plan-name]-plan.md` 및 `projects/[프로젝트명]/docs/exec-plans/completed/[plan-name]-checklist.json`

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

## 🛠️ 작업 분할 규칙 (Task Breakdown Rules)

1. **상세한 파일 정보 명시**: 각 Task마다 생성(`Create`), 수정(`Modify`), 테스트(`Test`)할 파일의 정확한 절대/상대 경로와 수정 라인 범위를 명시합니다.
2. **TDD 순서 적용**:
   - Step 1: 실패하는 테스트 코드 작성
   - Step 2: 테스트를 실행하여 실패 여부 확인
   - Step 3: 테스트를 통과할 최소한의 구현 코드 작성
   - Step 4: 테스트가 통과하는지 실행하여 확인
   - Step 5: Git 커밋 명령어 작성
3. **No Placeholders**: `TODO`, `TBD`, `추후 구현` 등의 모호한 단어는 절대 허용하지 않으며, 구현에 필요한 실제 코드 조각과 테스트 러너 명령어 및 예상 출력 메시지를 명시해야 합니다.
