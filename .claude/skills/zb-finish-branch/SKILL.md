---
name: zb-finish-branch
description: 구현 완료 후 통합 단계에서 프로젝트 테스트를 검증하고, PR 컨벤션 파일 존재 여부를 체크하여 자동 생성 여부를 사용자에게 문의한 뒤 로컬 머지, PR 생성, 또는 보존/폐기 옵션을 실행합니다.
---

# zb-finish-branch

이 스킬은 개발 완료된 기능 브랜치를 메인 코드베이스에 연동하거나 정리할 때 거쳐야 하는 최종 통합 절차를 정의합니다.

## 🛠️ 핵심 체크리스트 (Checklist)

1. `[ ]` **시작 선언**: 시작할 때 반드시 `"I'm using the zb-finish-branch skill to complete this work."`라고 선언합니다.
2. `[ ]` **테스트 검증**:
   - `npm test` 등 프로젝트 테스트 명령어를 먼저 실행하여 모든 테스트가 통과하는지 확인합니다. 실패 시 해결하기 전까지 진행하지 않습니다.
2-a. `[ ]` **Dev Server 스모크 테스트** (프로젝트에 `scripts/smoke-test.sh` 존재 시):
   - `bash scripts/smoke-test.sh`를 실행합니다.
   - 성공(exit 0) 시 다음 단계로 진행합니다.
   - 실패(exit 1) 시 **즉시 중단**하고 로그를 사용자에게 보고합니다. 해결 전까지 머지/PR을 진행하지 않습니다.
   - `scripts/smoke-test.sh`가 없는 프로젝트에서는 이 단계를 건너뜁니다.
3. **PR 컨벤션 파일 확인 및 예외 처리**:
   - `.claude/guides/pr-conventions.md` 파일이 존재하는지 검사합니다.
   - **[만약 없을 경우]**: 사용자에게 `".claude/guides/pr-conventions.md 파일이 존재하지 않습니다. 표준 템플릿으로 생성하시겠습니까?"`라고 묻습니다.
     - 사용자가 동의(Yes)하면 아래의 [표준 템플릿](#-pr-컨벤션-표준-템플릿) 내용을 기반으로 파일을 생성한 뒤 계속 진행합니다.
     - 사용자가 거절(No)하면 해당 단계를 건너뜁니다.
3-a. `[ ]` **지식 문서화 확인** (선택):
   - 사용자에게 묻습니다: `"이번 작업 중 해결한 어려운 문제가 있었나요? 있으면 zb-learn으로 문서화할 수 있습니다."`
   - Yes → **[zb-learn](../zb-learn/SKILL.md)** 실행 후 계속 진행
   - No / 없음 → 바로 4번으로 진행
   - 이 질문은 non-blocking — 거절해도 브랜치 종료 흐름에 영향 없음
4. `[ ]` **의사결정 옵션 제시**: 사용자에게 아래의 4가지 선택지를 명확히 제시합니다.
   ```text
   구현 및 검증이 완료되었습니다. 어떻게 진행할까요?
   
   1. 로컬에서 <base-branch>로 머지 (Merge locally)
   2. 원격 푸시 및 Pull Request 생성 (Push and create PR)
   3. 브랜치 그대로 보존 (Keep as-is)
   4. 작업 내용 폐기 (Discard this work)
   
   선택 번호를 입력해 주세요.
   ```

---

## ⚙️ 선택지별 세부 수행 가이드 (Execution Guide)

*   **1번: 로컬 머지**
    - 베이스 브랜치로 전환 후 `git pull` ➡️ 기능 브랜치 머지(`git merge`) ➡️ 테스트 재실행 ➡️ 성공 시 기능 브랜치 삭제 및 (Superpowers가 생성한 경우에만) 작업 트리(Worktree) 정리.
*   **2번: 원격 푸시 및 PR 생성**
    - 브랜치 원격 푸시(`git push -u origin`) 후 `gh pr create` 등을 통해 PR을 생성합니다.
    - PR 본문은 `.claude/guides/pr-conventions.md`의 컨벤션 양식을 철저히 준수하여 작성합니다. (PR 검토 및 피드백 대응을 위해 작업 트리는 삭제하지 않고 유지합니다.)
*   **3번: 브랜치 보존**
    - 브랜치와 작업 트리를 그대로 둔 상태로 작업을 종료합니다.
*   **4번: 작업 내용 폐기**
    - 반드시 `"discard"` 문자열 입력을 통해 사용자의 명시적인 폐기 의사를 재확인한 후, 브랜치 강제 삭제 및 작업 트리를 폐기합니다.

---

## 📄 PR 컨벤션 표준 템플릿 (pr-conventions.md)

생성 시 사용할 템플릿 마크다운 텍스트입니다:

```markdown
# Git 커밋 및 Pull Request 컨벤션 (PR Conventions)

에이전트가 코드를 완성하고 버전 관리를 수행할 때 준수해야 하는 가이드라인입니다.

## 📌 브랜치 네이밍 규칙
- 브랜치 명은 다음 패턴을 따릅니다: `<type>/<issue-number>-<short-description>`
  - 예: `feat/123-oauth-login`
  - 예: `fix/456-session-leak`

## 📝 커밋 메시지 규칙
Conventional Commits 명세에 맞추어 메시지를 작성합니다:
``<type>(<scope>): <subject>``

- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅
- `refactor`: 리팩토링

## 🔄 Pull Request 초안 작성
- 작업이 모두 성공하고 린트 및 테스트를 완료하면 다음 템플릿에 맞추어 PR 바디를 작성하여 제공합니다.
```markdown
## 변경 목적
- 이 변경사항이 필요한 이유를 기재합니다.

## 핵심 변경 내용
- 수정/생성된 핵심 모듈 및 로직을 요약합니다.

## 검증 결과
- 검증에 사용한 테스트 명령어 및 성공 로그를 기재합니다.
\```
```
