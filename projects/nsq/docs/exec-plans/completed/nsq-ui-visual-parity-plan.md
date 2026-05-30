# Plan: nsq-ui-visual-parity

Date: 2026-05-31

## Source Artifact Ledger

| Artifact | Type | Selected option/screen | User decision summary | Implementation scope | Non-goals / known deviations |
| --- | --- | --- | --- | --- | --- |
| `projects/nsq/.superpowers/brainstorm/63778-1780113690/content/nsq-shadowing-v5.html` | brainstorm HTML prototype | Home, import, immersion, sentence screens | Use the v5 visual direction as the product baseline for NSQ Shadowing screens. | scoped subset: home and player screens only | Import progress and sentence recording refinements are excluded from this pass. |
| `.zb/brainstorm/11442-1780151611/content/layout-options-v1.html` | layout option HTML prototype | Option A, "항상 표시 (와이드 패널)" | Keep the AI tutor visible on the right with a wider, full-height panel. | exact reproduction of the player layout intent, excluding prototype wrapper/tabs/info box | The brainstorm comparison UI itself is not implemented in the app. |
| User screenshots in current thread | existing screen evidence | Current `/` and `/player/[videoId]` | Current screen still diverges from selected artifacts. | use as before-state evidence | Screenshots are conversation evidence, not repo files. New evidence must be saved under `projects/nsq/docs/visual-evidence/`. |

## Scope Lock

This plan implements a scoped subset: make the NSQ home and player screens visually match the selected v5/Option A intent, with explicit browser screenshot evidence before completion.

The subset is limited to `/` and `/player/[videoId]`. It does not redesign `/import/[videoId]`, backend import behavior, transcript parsing, or AI tutor response quality.

## Visual Contract

### Home `/`

- Full-screen dark surface using semantic design-system tokens.
- Header content centered in a constrained content column.
- Import row is a visible horizontal control: URL input fills available width, primary import button sits to the right.
- Episode grid uses card-like items with visible borders/elevation, thumbnail region, title, and imported date.
- Broken or missing thumbnails must render an intentional fallback visual, not a browser broken-image icon.
- Screenshot targets:
  - `projects/nsq/docs/visual-evidence/nsq-ui-visual-parity/home-desktop.png` at `1440x1000`
  - `projects/nsq/docs/visual-evidence/nsq-ui-visual-parity/home-narrow.png` at `900x1000`

### Player `/player/[videoId]`

- Header stays compact: title, current segment counter, mode toggle.
- Main area is a two-column layout: segment area plus always-visible AI tutor panel.
- Right tutor panel is visually stable, `420px` on desktop, full-height within the player body, no clipped chips/input.
- Segment list uses dense but readable rounded rows, visible inactive row background/border, and strong active row highlight.
- Player view does not show prototype tabs, option labels, or explanatory design text.
- Screenshot targets:
  - `projects/nsq/docs/visual-evidence/nsq-ui-visual-parity/player-desktop.png` at `1440x1000`
  - `projects/nsq/docs/visual-evidence/nsq-ui-visual-parity/player-narrow.png` at `1100x900`

## Task Breakdown

## Task 1: Visual test fixture and screenshot harness

Files:

- Create: `projects/nsq/e2e/seed-visual-fixture.mjs`
- Create: `projects/nsq/e2e/visual-parity.spec.ts`
- Create: `projects/nsq/playwright.config.ts`
- Modify: `projects/nsq/package.json`
- Modify: `projects/nsq/package-lock.json`

Steps:

1. Add `@playwright/test` as a dev dependency and scripts:
   - `"test:visual": "playwright test"`
   - `"seed:visual": "node e2e/seed-visual-fixture.mjs"`
2. Create deterministic fixture episode under `~/.shadowing/episodes/visualdemo1`:
   - `meta.json` with title matching the NSQ hard-worker episode
   - `segments.json` with 12 compact segments and translations
   - `thumbnail.jpg` as a valid small generated JPEG
3. Add Playwright tests that:
   - run against `http://127.0.0.1:3000`
   - capture `/`
   - capture `/player/visualdemo1`
   - save screenshots to `projects/nsq/docs/visual-evidence/nsq-ui-visual-parity/`
4. The first run is expected to fail or produce screenshots that do not meet the Visual Contract; record this as baseline evidence.

Verification:

```bash
cd projects/nsq
npm run seed:visual
npm run test:visual
```

Expected before implementation:

- Fixture exists.
- Screenshots are produced.
- Any visual contract mismatch is treated as the failing visual test baseline.

Checklist mapping:

- `task-1` creates the evidence mechanism and baseline.

## Task 2: Home screen visual parity

Files:

- Modify: `projects/nsq/src/app/page.tsx`
- Add or modify tests under `projects/nsq/src/__tests__/` if component behavior changes

Steps:

1. Preserve existing episode fetch/import behavior.
2. Replace the loose home layout with the v5-aligned structure:
   - constrained content column
   - compact title/subtitle block
   - visible import bar
   - card grid with fixed thumbnail region and stable text area
3. Add thumbnail fallback handling:
   - if `/api/thumbnail/[videoId]` fails, show a semantic fallback block with "NSQ" or podcast-style visual text
   - no broken browser image icon should be visible
4. Use design-system components and semantic tokens; avoid `blue-*`, `slate-*`, `gray-*`, `zinc-*` utility colors.

Verification:

```bash
cd projects/nsq
npm test -- src/__tests__/home-page.test.ts
npm run seed:visual
npm run test:visual -- --grep "home"
```

Visual evidence:

- `projects/nsq/docs/visual-evidence/nsq-ui-visual-parity/home-desktop.png`
- `projects/nsq/docs/visual-evidence/nsq-ui-visual-parity/home-narrow.png`

Checklist mapping:

- `task-2` cannot be marked done until the screenshots satisfy the Home Visual Contract.

## Task 3: Player layout and TutorPanel visual parity

Files:

- Modify: `projects/nsq/src/app/player/[videoId]/page.tsx`
- Modify: `projects/nsq/src/components/ImmersionMode.tsx`
- Modify: `projects/nsq/src/components/TutorPanel.tsx`
- Add or modify tests under `projects/nsq/src/__tests__/` if component behavior changes

Steps:

1. Align the player with `layout-options-v1.html` Option A:
   - stable two-column body
   - `420px` right tutor panel on desktop
   - full-height tutor body with messages/empty state filling available space
   - quick chips and input pinned at the bottom
2. Align segment rows with the v5 prototype:
   - dense rounded rows
   - visible inactive card background/border
   - strong active highlight
   - text does not stretch to the screen edge
3. Keep existing player behavior:
   - segment click playback
   - keyboard shortcuts
   - translation blur toggle
   - persona selection and send behavior
4. Replace hard-coded visual colors with semantic tokens unless a one-off prototype color is explicitly justified in the component comment.

Verification:

```bash
cd projects/nsq
npm test -- src/__tests__/player-layout.test.ts
npm run seed:visual
npm run test:visual -- --grep "player"
```

Visual evidence:

- `projects/nsq/docs/visual-evidence/nsq-ui-visual-parity/player-desktop.png`
- `projects/nsq/docs/visual-evidence/nsq-ui-visual-parity/player-narrow.png`

Checklist mapping:

- `task-3` cannot be marked done until the screenshots satisfy the Player Visual Contract.

## Task 4: Design-system compliance cleanup

Files:

- Modify: `projects/nsq/src/app/page.tsx`
- Modify: `projects/nsq/src/app/import/[videoId]/page.tsx` only if shared token cleanup is needed
- Modify: `projects/nsq/src/components/ImmersionMode.tsx`
- Modify: `projects/nsq/src/components/SentenceMode.tsx` only if shared token cleanup is needed
- Modify: `projects/nsq/src/components/TutorPanel.tsx`

Steps:

1. Scan UI files for non-semantic color utilities:

```bash
cd projects/nsq
rg -n "bg-(blue|slate|gray|zinc|red)-|text-(blue|slate|gray|zinc|red)-|border-(blue|slate|gray|zinc|red)-" src/app src/components
```

2. Replace hard-coded color utility usage with shared semantic tokens from `design-system/DESIGN.md`.
3. Preserve accessibility contrast and visible state differences.

Verification:

```bash
cd projects/nsq
rg -n "bg-(blue|slate|gray|zinc|red)-|text-(blue|slate|gray|zinc|red)-|border-(blue|slate|gray|zinc|red)-" src/app src/components
npm test
```

Expected:

- `rg` returns no unapproved hard-coded color utility usage.
- `npm test` passes.

Checklist mapping:

- `task-4` enforces design-system compliance before visual review.

## Task 5: Final browser visual parity review

Files:

- Create: `projects/nsq/docs/visual-evidence/nsq-ui-visual-parity/README.md`
- Modify: `projects/nsq/docs/exec-plans/active/nsq-ui-visual-parity-checklist.json`

Steps:

1. Start the app:

```bash
cd projects/nsq
npm run seed:visual
npm run dev
```

2. Capture screenshots:

```bash
cd projects/nsq
npm run test:visual
```

3. Write `README.md` documenting:
   - screenshot paths
   - viewport sizes
   - routes
   - remaining known deviations, if any
   - explicit statement that selected v5/Option A scope is satisfied

Verification:

```bash
test -s projects/nsq/docs/visual-evidence/nsq-ui-visual-parity/home-desktop.png
test -s projects/nsq/docs/visual-evidence/nsq-ui-visual-parity/home-narrow.png
test -s projects/nsq/docs/visual-evidence/nsq-ui-visual-parity/player-desktop.png
test -s projects/nsq/docs/visual-evidence/nsq-ui-visual-parity/player-narrow.png
test -s projects/nsq/docs/visual-evidence/nsq-ui-visual-parity/README.md
```

Checklist mapping:

- `task-5` is the required final visual parity/review task.

## Verification Matrix

| Requirement | Source artifact | Implementation file | Verification method | Evidence |
| --- | --- | --- | --- | --- |
| Home dark shell, import row, episode cards visible | `nsq-shadowing-v5.html` Home | `src/app/page.tsx` | Playwright home desktop/narrow screenshots | pending |
| Missing thumbnails render intentional fallback | current screenshot + v5 Home | `src/app/page.tsx` | Playwright screenshot + component test | pending |
| Player uses always-visible right TutorPanel | `layout-options-v1.html` Option A | `src/app/player/[videoId]/page.tsx`, `TutorPanel.tsx` | Playwright player desktop screenshot | pending |
| Segment rows are visible cards, not plain text lines | `nsq-shadowing-v5.html` immersion | `ImmersionMode.tsx` | Playwright player screenshots | pending |
| UI uses semantic design-system tokens | `design-system/DESIGN.md` | `src/app/*`, `src/components/*` | `rg` color scan + tests | pending |
| Visual evidence exists before done | updated `zb-writing-plans` rule | `docs/visual-evidence/nsq-ui-visual-parity/*` | file existence checks | pending |

## Checklist JSON Mapping

- `task-1`: Visual fixture and Playwright screenshot harness
- `task-2`: Home screen visual parity
- `task-3`: Player layout and TutorPanel visual parity
- `task-4`: Design-system compliance cleanup
- `task-5`: Final browser visual parity review

## Out-of-Scope and Intentional Deviations

- The brainstorm tab bars and option explanation panels are not product UI and must not be implemented.
- `/import/[videoId]` remains functionally unchanged unless shared token cleanup is necessary.
- Transcript parsing and AI response behavior are not part of this visual parity pass.
- Exact pixel-perfect matching of the standalone prototype frame is not required; the product routes must match the selected layout intent and visual hierarchy.
