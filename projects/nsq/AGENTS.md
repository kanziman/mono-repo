# Project Rules (NSQ)

This file maps agent behavior for the NSQ project. Keep details in `docs/` when they grow beyond this summary. Keep this file under 100 lines.

## Core Commands

* **Dev Server**: `npm run dev`
* **Lint**: `npm run lint`
* **Test All**: `npm test`
* **Test Specific File**: `npm test -- <path_to_test_file>`
* **Build**: `npm run build`
* **Seed Visual Fixture**: `npm run seed:visual` — `~/.shadowing/episodes/visualdemo1` 테스트 픽스처 생성
* **Visual Screenshots**: `npm run test:visual` — Playwright로 Home/Player 스크린샷 캡처 (dev 서버 기동 필요)

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

## 🗺️ Documentation Map (Lazy-Load Index)

토큰 및 컨텍스트 낭비를 방지하기 위해, 에이전트는 이 지도를 먼저 읽고 필요한 문서만 지연 로딩(Lazy-Load)하여 참조해야 합니다.

### 📐 설계 및 제품 스펙 (Design & Spec)
* **[docs/GOAL.md](docs/GOAL.md)**: 앱 전체 기능 요건, 핵심 유저 플로우(유튜브 임포트, 재생 화면, AI 튜터 채팅).
* **[docs/DESIGN.md](docs/DESIGN.md)**: 폴더 구조, Context API 상태 관리, HTTP Range 오디오 스트리밍, Next.js 라우팅 패턴 설계.
* **[../../design-system/DESIGN.md](../../design-system/DESIGN.md)**: 공통 디자인 시스템 컴포넌트 사용 가이드라인 및 시맨틱 디자인 토큰 명세.

### 🛡️ 안정성 및 보안 (Reliability & Security)
* **[docs/RELIABILITY.md](docs/RELIABILITY.md)**: 외부 API(OpenRouter 등) 호출 회복력 패턴 (타임아웃 5초 상한, 지수 백오프, 서킷 브레이커).
* **[docs/SECURITY.md](docs/SECURITY.md)**: videoId 화이트리스트 검증(11자 정규식), Path Traversal 이중 방어, 환경변수 유출 방지 규칙.

### 📋 품질 및 개발 컨벤션 (Quality & Testing)
* **[docs/QUALITY_SCORE.md](docs/QUALITY_SCORE.md)**: 코드 자가 진단을 위한 체크리스트 및 품질 점수 산정 기준.
* **[.claude/guides/pr-conventions.md](.claude/guides/pr-conventions.md)**: 브랜치 생성 명명 규칙, Conventional Commits 규칙, PR 본문 서식.
* **[.claude/guides/testing.md](.claude/guides/testing.md)**: 테스트 도구 사용법, 테스트 모킹 범위, TDD 개발 단계 가이드.
* **[docs/solutions/](docs/solutions/)**: `zb-learn`을 통해 기록된 과거 문제 해결 지식 저장소 및 트러블슈팅 사례들.

---

## Workflow Conventions

이 프로젝트는 모노레포 공통 `zb-*` 개발 스킬셋을 사용하여 진행률과 품질을 엄격히 통제합니다.

* **기획 & 인터뷰**: 새로운 피처나 프로젝트 기획 시 **[zb-goal-interview](../../.claude/skills/zb-goal-interview/SKILL.md)** 스킬을 실행하십시오.
* **설계 & 브레인스토밍**: 실제 코드 작성 및 계획 수립 전에 **[zb-brainstorming](../../.claude/skills/zb-brainstorming/SKILL.md)** 스킬을 통해 설계를 완료하고 승인을 받으십시오.
* **실행 계획 수립**: 구현 시작 전에 **[zb-writing-plans](../../.claude/skills/zb-writing-plans/SKILL.md)** 스킬을 통해 `docs/exec-plans/active/[plan-name]-plan.md` 및 체크리스트 JSON 파일을 작성하십시오. 선택된 디자인 산출물이 요청에 포함되면 실행 전에 반드시 사용하고, UI/제품 계획은 `Source Artifact Ledger`, `Scope Lock`, `Visual Contract`, browser visual evidence로 브레인스토밍/목업 산출물을 보존하십시오.
* **개발 및 검증**: 계획 실행 시 **[zb-subagent-driven-development](../../.claude/skills/zb-subagent-driven-development/SKILL.md)** 스킬을 활성화하여 격리된 서브에이전트 제어와 TDD 기반 구현 및 사후 품질 검증을 수행하십시오.
* **브랜치 마무리**: 구현 완료 후 **[zb-finish-branch](../../.claude/skills/zb-finish-branch/SKILL.md)** 스킬을 사용하여 브랜치를 정리하고 PR을 작성하십시오.
* **디버깅**: 에러나 테스트 실패 시 **[zb-debugging](../../.claude/skills/zb-debugging/SKILL.md)** 스킬을 사용하여 근본 원인을 분석하십시오.
* **커밋 및 브랜치 규칙**: [.claude/guides/pr-conventions.md](.claude/guides/pr-conventions.md) 및 [.claude/guides/testing.md](.claude/guides/testing.md)를 준수하십시오.
* **완료된 실행 계획**: `docs/exec-plans/completed/`를 참조하십시오.
