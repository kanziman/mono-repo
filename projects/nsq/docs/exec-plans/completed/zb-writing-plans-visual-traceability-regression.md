# Visual Traceability Regression Fixture

## Bad excerpt

Source: `layout-options-v1.html`

Task: expand TutorPanel width and improve segment cards.

Why this must be rejected: it does not name the selected option, define a Visual Contract, provide a screenshot target, or include a Verification Matrix.

## Good excerpt

### Source Artifact Ledger

- Artifact path: `projects/nsq/docs/visual-brainstorming/layout-options-v1.html`
- Artifact type: brainstorm HTML
- Selected option: Option A, right tutor panel layout
- Scope: scoped subset; implement only the right TutorPanel width/full-height behavior and segment card visual separation.
- Non-goals: no transcript feature changes, no new tutor streaming behavior, no navigation redesign.

### Visual Contract

- Route: `/player/[videoId]`
- TutorPanel wrapper is 420px wide on desktop and fills the available player viewport height.
- Segment cards have visible border and background separation from the page surface.
- Screenshot target: desktop `1440x900` at `/player/test-video`.

### Verification Matrix

| Requirement | Source artifact | Implementation file | Verification method | Evidence |
| --- | --- | --- | --- | --- |
| TutorPanel is 420px wide and full-height | `projects/nsq/docs/visual-brainstorming/layout-options-v1.html` Option A | `projects/nsq/src/app/player/[videoId]/page.tsx` | Playwright screenshot at 1440x900 | pending |
| Segment cards have border and background separation | `projects/nsq/docs/visual-brainstorming/layout-options-v1.html` Option A | `projects/nsq/src/app/player/[videoId]/page.tsx` | Playwright screenshot at 1440x900 | pending |
