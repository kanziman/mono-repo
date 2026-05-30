# Project Rules (NSQ)

This file maps agent behavior for the NSQ project. Keep details in `docs/` when they grow beyond this summary. Keep this file under 100 lines.

## Core Commands

* **Dev Server**: `npm run dev`
* **Lint**: `npm run lint`
* **Test All**: `npm test`
* **Test Specific File**: `npm test -- <path_to_test_file>`
* **Build**: `npm run build`

## Design System

* Import shared tokens and components from `../../design-system/`.
* Read `../../design-system/DESIGN.md` before changing shared styles or tokens.
* Do not duplicate design tokens inside this project.
* Use Pretendard, semantic color tokens, and `next-themes` class-based dark mode.

### Monorepo Symlink Setup (필수)

Turbopack root가 mono-repo root(`../..`)이므로, design-system peer deps를 mono-repo root `node_modules/`에서 찾는다.
`npm install` 이후 또는 `node_modules` 초기화 시 반드시 아래 심링크를 생성해야 `npm run dev`가 정상 동작한다:

```bash
NSQ="$(pwd)/node_modules"   # projects/nsq/ 에서 실행
MONO="$(pwd)/../../node_modules"
ln -sf "$NSQ/@radix-ui"        "$MONO/@radix-ui"
ln -sf "$NSQ/next-themes"      "$MONO/next-themes"
ln -sf "$NSQ/react-day-picker" "$MONO/react-day-picker"
```

## Code Style & Quality Guidelines

* Refer to [DESIGN.md](docs/DESIGN.md) for detailed architecture guidelines.
* Refer to [QUALITY_SCORE.md](docs/QUALITY_SCORE.md) for code quality requirements.
* Invariants must be enforced using linters/tests, not just documentation.

## Workflow Conventions

이 프로젝트는 모노레포 공통 `zb-*` 개발 스킬셋을 사용하여 진행률과 품질을 엄격히 통제합니다.

* **기획 & 인터뷰**: 새로운 피처나 프로젝트 기획 시 **[zb-goal-interview](../../.claude/skills/zb-goal-interview/SKILL.md)** 스킬을 실행하십시오.
* **설계 & 브레인스토밍**: 실제 코드 작성 및 계획 수립 전에 **[zb-brainstorming](../../.claude/skills/zb-brainstorming/SKILL.md)** 스킬을 통해 설계를 완료하고 승인을 받으십시오.
* **실행 계획 수립**: 구현 시작 전에 **[zb-writing-plans](../../.claude/skills/zb-writing-plans/SKILL.md)** 스킬을 통해 `docs/exec-plans/active/[plan-name]-plan.md` 및 체크리스트 JSON 파일을 작성하십시오.
* **개발 및 검증**: 계획 실행 시 **[zb-subagent-driven-development](../../.claude/skills/zb-subagent-driven-development/SKILL.md)** 스킬을 활성화하여 격리된 서브에이전트 제어와 TDD 기반 구현 및 사후 품질 검증을 수행하십시오.
* **브랜치 마무리**: 구현 완료 후 **[zb-finish-branch](../../.claude/skills/zb-finish-branch/SKILL.md)** 스킬을 사용하여 브랜치를 정리하고 PR을 작성하십시오.
* **디버깅**: 에러나 테스트 실패 시 **[zb-debugging](../../.claude/skills/zb-debugging/SKILL.md)** 스킬을 사용하여 근본 원인을 분석하십시오.
* **커밋 및 브랜치 규칙**: [.claude/guides/pr-conventions.md](.claude/guides/pr-conventions.md) 및 [.claude/guides/testing.md](.claude/guides/testing.md)를 준수하십시오.
* **완료된 실행 계획**: `docs/exec-plans/completed/`를 참조하십시오.
