# Project Rules (NSQ Shadowing)

This file maps agent behavior for the NSQ Shadowing app. Keep details in `docs/` when they grow beyond this summary.

## Core Commands

* **Dev Server**: `npm run dev`
* **Lint**: `npm run lint`
* **Test All**: `npm test`
* **Build**: `npm run build`

## Design System

* Import shared tokens and components from `../../design-system/`.
* Read `../../design-system/DESIGN.md` before changing shared styles or tokens.
* Do not duplicate design tokens inside this project.
* Use Pretendard, semantic color tokens, and `next-themes` class-based dark mode.

## Workflow

* Follow the active execution plan in `../fervent/docs/exec-plans/active/nsq-shadowing-plan.md`.
* Keep TDD order for new features and bug fixes.
* Update `../fervent/docs/exec-plans/active/nsq-shadowing-checklist.json` as task status changes.
