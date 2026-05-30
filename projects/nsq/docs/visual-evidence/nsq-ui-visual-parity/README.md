# NSQ UI Visual Parity — Screenshot Evidence

Date: 2026-05-31

## Screenshots

| File | Route | Viewport | Description |
|---|---|---|---|
| `home-desktop.png` | `/` | 1440×1000 | Home screen, desktop width |
| `home-narrow.png` | `/` | 900×1000 | Home screen, narrow width |
| `player-desktop.png` | `/player/visualdemo1` | 1440×1000 | Player screen, desktop width |
| `player-narrow.png` | `/player/visualdemo1` | 1100×900 | Player screen, narrow width |

## How screenshots were captured

```bash
cd projects/nsq
npm run seed:visual     # seeds ~/.shadowing/episodes/visualdemo1 fixture
npm run dev             # start dev server at http://127.0.0.1:3000
npm run test:visual     # runs Playwright to capture all 4 screenshots
```

## Selected artifact scope satisfied

- **Home screen** matches `nsq-shadowing-v5.html` Option A intent:
  - Full-screen dark surface (`bg-background-normal-normal`)
  - Import bar as a styled rounded container
  - Episode list as horizontal cards with thumbnail + title + date + play button
  - Thumbnail fallback renders "NSQ" text — no broken browser image icon

- **Player screen** matches `layout-options-v1.html` Option A intent:
  - Two-column layout: segment list (flex-1) + AI tutor panel (420px, always visible)
  - Segment rows: dense rounded cards with visible inactive background/border and strong active highlight
  - TutorPanel: full-height, persona chips at top, messages fill available space, quick chips + input pinned at bottom

- **Design-system compliance**: zero unapproved color utilities (`blue-*`, `slate-*`, `gray-*`, `zinc-*`, `red-*`) in `src/app` and `src/components`.

## Known deviations

- Exact pixel-perfect matching of the standalone HTML prototype is not required; the product routes match the selected layout intent and visual hierarchy.
- Import progress screen (`/import/[videoId]`) is functionally unchanged (out of scope).
- Transcript parsing and AI response behavior are not part of this visual parity pass.
- Prototype tab bars, option labels, and explanatory design text are not implemented in the app.
