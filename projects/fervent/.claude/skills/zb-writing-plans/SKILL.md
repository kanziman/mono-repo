---
name: zb-writing-plans
description: 사용자가 피처 개발, 버그 수정 등 여러 단계의 작업 실행 계획(Implementation Plan) 수립을 요청할 때 사용합니다. 구현 코드 작성 전에 구체적인 작업 분할 및 진행률 관리를 위한 체크리스트 JSON 파일을 생성합니다.
---

# zb-writing-plans

이 스킬은 상세한 기능 개발 작업을 작업자(에이전트 또는 개발자)가 컨텍스트 낭비 없이 순차적으로 실행할 수 있도록 정밀한 작업 계획(`[명칭]-plan.md`)과 상태 관리용 JSON 체크리스트(`[명칭]-checklist.json`)를 작성하는 워크플로우를 정의합니다.

## 📂 계획서 저장 및 생명주기 (Storage & Lifecycle)

모든 작업 계획서와 체크리스트는 프로젝트의 다음 경로에 저장되어 관리됩니다:

1. **활성 단계 (Active)**
   - 계획서 생성 시: `docs/exec-plans/active/[plan-name]-plan.md`
   - 체크리스트 생성 시: `docs/exec-plans/active/[plan-name]-checklist.json`
2. **완료 단계 (Completed)**
   - 모든 태스크 구현 및 검증 완료 후, 두 파일을 아래 경로로 이동(Move)합니다.
   - 이동 경로: `docs/exec-plans/completed/[plan-name]-plan.md` 및 `docs/exec-plans/completed/[plan-name]-checklist.json`

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

## 🔗 연관 스킬

계획 작성 후 실행 전, 격리된 워크스페이스가 필요한 경우 **[zb-worktrees](../zb-worktrees/SKILL.md)** 를 선택적으로 사용한다 (optional).

```
zb-writing-plans → (선택) zb-worktrees → zb-executing-plans → zb-finish-branch
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
