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
    └── fervent/            # Project: Fervent
```

## Design System

- **Single source of truth** for tokens, components, and Tailwind config.
- All projects **must** import from `design-system/` — no per-project style duplication.
- Before modifying any component or token, read `design-system/DESIGN.md`.
- Stack: TailwindCSS · Pretendard font · coolicons SVG · Light/Dark via `next-themes`.
- Tailwind numeric spacing utilities must preserve Tailwind base semantics. Design-system pixel spacing tokens are exposed only through `ds-*` keys such as `p-ds-8`; never redefine numeric spacing keys like `8` or `10`.
- When changing Tailwind config or shared primitives such as `Button`, verify rendered dimensions in a browser, not only with unit tests.

## Adding a New Project

1. Create `projects/<project-name>/`.
2. Add a `projects/<project-name>/AGENTS.md` following the pattern in `projects/fervent/AGENTS.md`.
3. Reference shared design-system assets rather than copying them.

## Per-Project Agent Docs

| Project | Agent Map                                                |
| ------- | -------------------------------------------------------- |
| fervent | [projects/fervent/AGENTS.md](projects/fervent/AGENTS.md) |
