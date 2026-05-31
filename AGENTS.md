# Mono-Repo — Agent Map

## Repository Layout

```
mono-repo/
├── design-system/          # Shared design system (all projects consume this)
│   ├── components/         # Reusable UI components
│   ├── globals.css         # Global CSS variables & base styles
│   ├── tailwind.config.ts  # Shared Tailwind configuration
│   └── DESIGN.md           # Design tokens, typography, color system docs
└── projects/               # Individual product workspaces
    └── nsq/                # Project: NSQ Shadowing
```

## Design System

- **Single source of truth** for tokens, components, and Tailwind config.
- All projects **must** import from `design-system/` — no per-project style duplication.
- Before modifying any component or token, read `design-system/DESIGN.md`.
- Stack: TailwindCSS · Pretendard font · coolicons SVG · Light/Dark via `next-themes`.
- Tailwind numeric spacing utilities must preserve Tailwind base semantics. Design-system pixel spacing tokens are exposed only through `ds-*` keys such as `p-ds-8`; never redefine numeric spacing keys like `8` or `10`.
- When changing Tailwind config or shared primitives such as `Button`, verify rendered dimensions in a browser, not only with unit tests.

### Frontend Design Priority

UI/UX 구현, 리팩토링, 리뷰 시 다음 우선순위를 적용한다.

1. `design-system/` — 프로젝트의 최상위 기준. 토큰, 컴포넌트, Tailwind 설정을 우선 사용한다.
2. `frontend-design` — `design-system/`에 없는 레이아웃/상호작용 판단을 보완한다.
3. `web-design-guidelines` — 최종 UI 품질, 접근성, 사용성 리뷰 체크리스트로 사용한다.

충돌 시 항상 더 높은 우선순위의 기준을 따른다.

## Adding a New Project

1. Create `projects/<project-name>/`.
2. Add a `projects/<project-name>/AGENTS.md` following the pattern in `projects/nsq/AGENTS.md`.
3. Reference shared design-system assets rather than copying them.

## Per-Project Agent Docs

| Project | Agent Map                                                |
| ------- | -------------------------------------------------------- |
| nsq     | [projects/nsq/AGENTS.md](projects/nsq/AGENTS.md) |

## 🔄 모노레포 공통 개발 워크플로우 (zb- 스킬셋)

모든 에이전트는 기능 개발, 리팩토링, 버그 수정 시 다음 표준 프로세스를 엄격히 준수해야 합니다.

```mermaid
graph TD
    A[1. 기획 및 인터뷰] -->|요구사항 확정| B[2. 설계 및 브레인스토밍]
    B -->|설계 승인| C[3. 작업 계획서 수립]
    C -->|계획 승인| D[4. 작업 트리 격리 선택]
    D -->|Option A: 직접 실행| E[5a. 계획 실행 - zb-executing-plans]
    D -->|Option B: 서브에이전트 위임| F[5b. 계획 실행 - zb-subagent-driven]
    E & F -->|구현 완료 / 테스트 통과| G[6. 지식 문서화 선택]
    G -->|Yes| H[zb-learn 지식 기록]
    G -->|No| I[7. 브랜치 마감 및 PR - zb-finish-branch]
    H --> I
    
    E & F -.->|에러 및 테스트 실패 시| J[zb-debugging 적용]
    J -.->|해결 완료| E & F
```

### 단계별 스킬 및 역할 매핑

1. **기획/인터뷰 (`zb-goal-interview`)**: 목표 95% 확신 획득 및 `GOAL.md` 작성.
2. **설계 (`zb-brainstorming`)**: 시각화(`zb-visualize`) 동반 설계 시안 작성 및 승인.
3. **계획 수립 (`zb-writing-plans`)**: `*-plan.md` 및 `*-checklist.json` 작성, `exec-plans/index.md` 활성화 등록. 선택된 디자인 산출물이 요청에 포함되면 실행 전에 반드시 사용하고, UI/제품 계획은 `Source Artifact Ledger`, `Scope Lock`, `Visual Contract`, browser visual evidence로 브레인스토밍/목업 산출물을 보존한다.
4. **격리 환경 (`zb-worktrees`)**: 작업용 git worktree 격리 작업 공간 선택적 생성.
5. **실행 & 구현 (`zb-executing-plans` / `zb-subagent-driven-development`)**: `zb-TDD` 규칙에 맞춰 구현 및 리뷰어 검증. (실패 시 `zb-debugging` 발동)
6. **지식 문서화 (`zb-learn`)**: 에러 해결 지식을 `docs/solutions/`에 기록.
7. **마감 (`zb-finish-branch`)**: `AGENTS.md` 최신화 검토 및 로컬 머지/PR 생성.
