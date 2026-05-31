---
name: zb-subagent-driven-development
description: 독립적인 태스크로 구성된 실행 계획서를 처리할 때, 각 태스크별로 격리된 컨텍스트를 가진 서브에이전트를 소환해 순차적으로 병렬성 충돌 없이 구현하고 2단계 검증(스펙 검증 후 코드 품질 검증)을 수행하며 JSON 체크리스트의 생명주기를 관리합니다.
---

# zb-subagent-driven-development

이 스킬은 메인 세션의 컨텍스트를 오염시키지 않으면서도, 정밀한 개별 서브에이전트 제어를 통해 구현 계획서(`[plan-name]-plan.md`)의 각 태스크들을 효율적이고 견고하게 처리하는 워크플로우를 정의합니다.

## 🛠️ 핵심 체크리스트 (Checklist)

1. `[ ]` **작업 시작 선언**: 에이전트는 시작할 때 반드시 `"I'm using the zb-subagent-driven-development skill to implement this plan."`라고 선언합니다.
2. `[ ]` **Todo 로드 및 준비**:
   - `projects/[프로젝트명]/docs/exec-plans/active/[plan-name]-plan.md` 및 `[plan-name]-checklist.json`을 읽고 분석합니다.
   - JSON 체크리스트의 `"status"`를 `"in-progress"`로 변경하여 즉시 저장합니다.
3. `[ ]` **태스크 루프 실행 (멈춤 없이 연속 수행)**:
   - 각 태스크를 수행할 때 JSON 파일 내 해당 태스크의 `"status"`를 `"in-progress"`로 변경 및 저장합니다.
   - **Step 3-1. 구현 서브에이전트 소환**: [implementer-prompt.md](implementer-prompt.md) 양식에 맞추어 태스크 요구사항과 아키텍처 맥락을 제공하고 서브에이전트를 호출합니다.
     - **UI 태스크인 경우**: 계획서의 `Visual Contract` 섹션과 `Source Artifact Ledger`의 CSS 값을 **요약 없이 원문 그대로** implementer prompt에 포함합니다. 픽셀 단위 수치가 축약되면 구현이 시안에서 벗어납니다.
   - **Step 3-2. 스펙 검증 서브에이전트 소환**: 구현 완료 후 [spec-reviewer-prompt.md](spec-reviewer-prompt.md) 양식에 맞추어 서브에이전트를 소환하여 구현 코드가 요구사항과 정확히 일치하는지(YAGNI 위반 또는 미구현 사항 검출) 검증합니다.
   - **Step 3-2.5. 시각 증거 게이트 (UI 태스크 전용)**: 스펙 검증이 ✅이더라도, UI 태스크의 경우 implementer 보고서의 `Visual Evidence` 필드에 실제 screenshot path가 있는지 **주 에이전트가 직접 확인**합니다.
     - screenshot path가 없거나 비어있으면 → 구현 서브에이전트를 **재소환**하여 시각 검증 완료 후 재보고 요청
     - 코드 품질 검증(Step 3-3)은 시각 증거 확인 이후에만 진행합니다
   - **Step 3-3. 코드 품질 검증 서브에이전트 소환**: 스펙 검증이 ✅ 완료되면 [code-quality-reviewer-prompt.md](code-quality-reviewer-prompt.md) 양식에 맞추어 서브에이전트를 소환하여 클린 코드 규칙과 아키텍처 정렬을 심사합니다.
   - **Step 3-4. 상태 마감**: 두 검증이 모두 승인되면 JSON 파일 내 태스크 상태를 `"done"`으로 변경 및 저장합니다.
4. `[ ]` **생명주기(Lifecycle) 마감**:
   - 모든 태스크가 완료되면 JSON 체크리스트 전체의 `"status"`를 `"done"`으로 업데이트합니다.
   - 계획서와 체크리스트 파일을 완료(`completed`) 디렉토리로 이동시킵니다.
     - `projects/[프로젝트명]/docs/exec-plans/active/[plan-name]-plan.md` ➡️ `projects/[프로젝트명]/docs/exec-plans/completed/[plan-name]-plan.md`
     - `projects/[프로젝트명]/docs/exec-plans/active/[plan-name]-checklist.json` ➡️ `projects/[프로젝트명]/docs/exec-plans/completed/[plan-name]-checklist.json`
   - **인덱스 파일 동기화**: `projects/[프로젝트명]/docs/exec-plans/index.md` 파일에서 해당 계획을 "⚡ 활성 계획" 목록에서 제거하고, "🏁 완료된 계획" 표로 이동시키며 완료 날짜, 변경 요약 및 상태(`[x] 완료`)를 최신화합니다.
5. `[ ]` **통합 및 정리**:
   - 마지막으로 전체 구현 내용을 검증하는 최종 리뷰어 서브에이전트를 소환해 코드 무결성을 검증한 후, `zb-finish-branch` 스킬을 사용하여 병합 또는 PR을 수행합니다.

---

## ⚠️ 핵심 규칙 (Core Rules)

- **독립적 컨텍스트 제공**: 서브에이전트 소환 시 메인 세션의 대화 내역 전체를 물려주지 마십시오. 오직 해당 태스크 명세와 직간접적으로 연관된 파일 정보, 아키텍처 맥락만 선별하여 컴팩트하게 제공하십시오.
- **실시간 체크리스트 동기화**: 서브에이전트의 작업 단계 전환(구현 시작 ➡️ 완료) 시점에 실시간으로 `[plan-name]-checklist.json` 파일의 상태 값을 보존해야 합니다.
- **검증의 순서 보장**: 스펙 검증이 완벽하게 승인(✅)되기 전에는 절대로 코드 품질 검증 단계를 수행하지 마십시오.
- **작업 진행 중단 기준**: 구현 중 구조적 설계 오류를 발견하거나, 서브에이전트가 `BLOCKED` 또는 `NEEDS_CONTEXT` 상태를 보고하여 메인 에이전트 선에서 해결할 수 없을 때만 파트너(사용자)에게 보고하고 정지합니다. 그 외에는 흐름을 정지시키지 않고 계속 다음 태스크를 진행합니다.
- **테스트 실패 및 디버깅 연동**: 서브에이전트 구현이나 자체 검증 도중 오류 또는 테스트 실패를 발견하면, **REQUIRED SUB-SKILL: [zb-debugging](../zb-debugging/SKILL.md)**을 사용하여 원인을 진단한 후 수정을 유도하십시오.
