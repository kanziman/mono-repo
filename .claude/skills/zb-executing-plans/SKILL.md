---
name: zb-executing-plans
description: 작성된 작업 실행 계획(Implementation Plan)과 JSON 체크리스트를 기반으로 각 태스크를 실행하고, 상태를 업데이트하며 완료된 계획서의 생명주기를 관리합니다.
---

# zb-executing-plans

이 스킬은 작성된 작업 실행 계획서(`[plan-name]-plan.md`)와 이에 대응하는 JSON 체크리스트(`[plan-name]-checklist.json`)를 바탕으로 작업을 정밀하고 투명하게 수행하는 워크플로우를 정의합니다.

## 🛠️ 핵심 체크리스트 (Checklist)

1. `[ ]` **작업 시작 선언**: 에이전트는 시작할 때 반드시 `"I'm using the zb-executing-plans skill to implement this plan."`라고 선언합니다.
2. `[ ]` **계획 로드 및 검토**:
   - `projects/[프로젝트명]/docs/exec-plans/active/[plan-name]-plan.md` 및 `[plan-name]-checklist.json`을 읽고 분석합니다.
   - 계획서의 상태를 확인하고, JSON 체크리스트의 `"status"`를 `"in-progress"`로 변경하여 즉시 저장합니다.
3. `[ ]` **순차적 태스크 실행 (태스크별 피드백루프)**:
   - 각 태스크를 수행할 때 JSON 파일 내 해당 태스크의 `"status"`를 `"in-progress"`로 변경 및 저장합니다.
   - **3-1. 구현**: 계획서에 정의된 각 파일별 수정 및 테스트(TDD 순서 준수)를 수행합니다.
     - **프론트엔드 태스크인 경우** (`.tsx`, `.jsx`, React 컴포넌트, 훅 등): 구현 전 **[react-best-practices](../react-best-practices/SKILL.md)** 스킬을 반드시 참조합니다.
   - **3-2. 코드리뷰 요청**: 태스크 구현 완료 후 **[zb-code-review](../zb-code-review/SKILL.md)** Part 1에 따라 서브에이전트를 디스패치합니다.
     - 리뷰어 프롬프트: `../zb-code-review/subagent-reviewer-prompt.md` 템플릿 사용
     - `BASE_SHA`: 해당 태스크 시작 직전 커밋
     - `HEAD_SHA`: 태스크 구현 완료 후 커밋
   - **3-3. 피드백 수신 및 처리**: **zb-code-review** Part 2 규칙을 그대로 적용합니다 (감사 금지, 검증 후 반영).
     - Critical 또는 Important 이슈 있음 → 수정 → 3-2로 재진입 (최대 3회)
     - Minor만 남거나 이슈 없음 → `"status"`를 `"done"`으로 변경 후 다음 태스크로 진행
   - **3-4. 루프 강제 탈출**: 3회 재리뷰 후에도 Critical 이슈가 잔존하면 즉시 실행을 중단하고 사용자에게 보고합니다.
4. `[ ]` **생명주기(Lifecycle) 마감**:
   - 모든 태스크 완료 시, JSON 체크리스트 전체의 `"status"`를 `"done"`으로 업데이트합니다.
   - 활성(`active`) 상태인 계획서와 체크리스트 파일을 완료(`completed`) 디렉토리로 이동시킵니다.
     - `projects/[프로젝트명]/docs/exec-plans/active/[plan-name]-plan.md` ➡️ `projects/[프로젝트명]/docs/exec-plans/completed/[plan-name]-plan.md`
     - `projects/[프로젝트명]/docs/exec-plans/active/[plan-name]-checklist.json` ➡️ `projects/[프로젝트명]/docs/exec-plans/completed/[plan-name]-checklist.json`
   - **인덱스 파일 동기화**: `projects/[프로젝트명]/docs/exec-plans/index.md` 파일에서 해당 계획을 "⚡ 활성 계획" 목록에서 제거하고, "🏁 완료된 계획" 표로 이동시키며 완료 날짜, 변경 요약 및 상태(`[x] 완료`)를 최신화합니다.
5. `[ ]` **통합 및 정리**:
   - 최종 작업물 확인 후, 통합(Git PR/머지) 단계는 프로젝트 브랜치 정리 규칙(`zb-finish-branch` 등)을 따릅니다.

---

## ⚠️ 예외 및 중단 조건 (Edge Cases & Halt Conditions)

- **즉시 실행 중단**: 다음 상황에서는 작업을 즉시 중단하고 파트너(사용자)에게 알립니다.
  - 구현 중 계획에 없던 심각한 구조적 문제나 예외 케이스(Edge Case)를 발견한 경우
  - 명시된 검증(테스트) 명령어가 계속 실패하여 해결이 불가능할 경우
  - 계획서의 명령어나 의도가 모호하여 추가 조율이 필요할 경우
  - 코드리뷰 루프 3회 후에도 Critical 이슈가 잔존하는 경우
- **독립적 상태 업데이트**: 도구 사용 중(PostToolUse 린터 실행 포함) 체크리스트의 실시간 상태 동기화가 중단되지 않도록 수시로 체크리스트 파일을 보존하고 수정 내역을 기록해야 합니다.
- **테스트 실패 및 디버깅 연동**: 작업 중 예기치 못한 에러나 테스트 실패를 겪을 경우, 즉시 **REQUIRED SUB-SKILL: [zb-debugging](../zb-debugging/SKILL.md)**을 활성화하여 체계적 원인 분석을 마친 후 코드를 수정하십시오.
