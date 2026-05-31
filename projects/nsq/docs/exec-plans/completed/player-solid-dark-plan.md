# Plan: Player Solid Dark Theme Redesign

## 1. Source Artifact Ledger

- **Artifact Path**: `file:///Users/zorba/mono-repo/.zb/brainstorm/505-1780212927/content/player-v2.html`
- **Artifact Type**: brainstorm HTML / prototype
- **Selected Option**: Option B - Solid Dark Theme (Non-Glass)
- **User Decision Summary**: Glassmorphic theme was declined; option B (Solid Dark Theme) was selected for implementation.
- **Implementation Scope**: Exact reproduction of the styling, layout changes, active-inactive segment states, and visual tone in Next.js React components.
- **Non-Goals & Known Deviations**: 
  - Dynamic page functionality (such as fetching actual audio/AI tutor SSE API) remains unchanged.
  - Modifying mock state logic outside of style attributes is out of scope.

---

## 2. Scope Lock
This plan implements the complete redesign of the NSQ Player page layout and styling utilizing Option B (Solid Dark Theme) visual mockup from `player-v2.html`. 

> [!IMPORTANT]
> **CRITICAL RULE**: All CSS changes must strictly leverage Montage Design System semantic tokens or global CSS variables. **Directly writing hardcoded hex codes (like `#111625`, `#1e293b`, `#3b82f6`) in Tailwind classes or style blocks is strictly prohibited.**

---

## 3. Visual Contract

| Component / Area | Mockup Target (Design System Tokens) | Responsive Rule | Theme Rule | Spacing / Radius |
| --- | --- | --- | --- | --- |
| Header Bar | `bg-background-elevated-normal` Solid background, no blur | Fixed-height 80px | Dark only | Radius: None, Border-b: `border-line-normal-normal` |
| Segment Cards | `bg-background-elevated-normal`, `border-line-normal-normal` | Flex-1 scroll area | Dark only | Radius: `rounded-xl` (12px), Padding: `p-5` |
| Active Card | `bg-primary-normal/5`, `border-primary-normal`, `border-l-primary-normal` | Focus center | Dark only | Pulse green status badge (`text-status-positive`) |
| Focus Card | `bg-background-elevated-normal`, `border-line-normal-normal`, `shadow-normal-large` | Centered wrapper | Dark only | Radius: `rounded-2xl` (16px), Padding: `p-10` |
| Tutor AI Panel | `bg-background-normal-normal` | Width fixed at `420px` | Dark only | Border-l: `border-line-normal-normal` |
| AI Chat Bubble | User: `bg-primary-normal` / AI: `bg-background-elevated-normal` + `border-line-normal-normal` | Self-adjusting width | Dark only | Radius: `rounded-2xl` |

---

## 4. Task Breakdown

### Task 1: Redesign the Player Page Layout Header
- **Target File**: [page.tsx](file:///Users/zorba/mono-repo/projects/nsq/src/app/player/%5BvideoId%5D/page.tsx)
- **Modification Range**: Line 125 to 210 (Header and main flex layout wrapper)
- **Steps**:
  1. *Test (Pre-verification)*: Check compilation.
  2. *Implementation*: 
     - Replace hardcoded background `#1e293b` and border `#334155` with design system tokens: `bg-background-elevated-normal` and `border-line-normal-normal`.
     - Align control buttons (Prev, Play, Next, Repeat) and timeline tracking into a unified, inline horizontal bar using Design System `Button` variants and semantic icons.
     - Eliminate any raw hex color tags.
  3. *TDD / Verification*:
     - **시각 검증**:
       - [x] `npm run dev` 후 브라우저 `http://localhost:3000/player/visualdemo1` 접속 확인
       - [x] Screenshot Target: Full page header, saved to `docs/visual-evidence/player-header-redesign.png`
       - [x] Viewport List: Desktop (1440x900)
       - [x] Verify dark theme application (semantic elevated dark background)
       - [x] Verify correct playback progress rendering (blue bar `bg-primary-normal` fills based on time)
  4. *Git Commit*: `git commit -am "style(player): redesign player header bar with design system tokens"`

### Task 2: Redesign Immersion Mode Segment List
- **Target File**: [ImmersionMode.tsx](file:///Users/zorba/mono-repo/projects/nsq/src/components/ImmersionMode.tsx)
- **Modification Range**: Line 35 to 110
- **Steps**:
  1. *Test (Pre-verification)*: Check that existing tests pass.
  2. *Implementation*:
     - Update segment card list wrapper with custom spacing.
     - Change inactive card: `bg-background-elevated-normal border border-line-normal-normal rounded-xl mb-3 hover:border-primary-normal/30 transition-all`.
     - Change active card: `bg-primary-normal/5 border-primary-normal border-l-4 border-l-primary-normal border-y-line-normal-normal border-r-line-normal-normal shadow-normal-medium`. (No hardcoded `#151d30`).
     - Render translation text using transition blur-sm (`blur-sm transition-all hover:blur-none cursor-pointer`).
  3. *TDD / Verification*:
     - **시각 검증**:
       - [x] `npm run dev` 후 `http://localhost:3000/player/visualdemo1` 접속 및 몰입 모드 확인
       - [x] Screenshot Target: Segment list section, saved to `docs/visual-evidence/immersion-list.png`
       - [x] Viewport List: Desktop (1440x900)
       - [x] Verify active segment card has blue highlight bar and pulse status badge
       - [x] Verify translation blur and hover reveal logic
  4. *Git Commit*: `git commit -am "style(player): redesign immersion segment cards with design system tokens"`

### Task 3: Redesign Sentence Mode & Recorder Panel
- **Target File**: [SentenceMode.tsx](file:///Users/zorba/mono-repo/projects/nsq/src/components/SentenceMode.tsx)
- **Modification Range**: Line 64 to 170
- **Steps**:
  1. *Test (Pre-verification)*: Check that page loads in Sentence mode.
  2. *Implementation*:
     - Style central `focus-card` with `bg-background-elevated-normal border border-line-normal-normal rounded-2xl p-10 shadow-normal-large`. (No hardcoded `#111625`).
     - Apply solid dark theme and rounded styling to the recorder panel using semantic tokens.
     - Update Button elements inside action rows to leverage custom sizes and matching color schemes.
  3. *TDD / Verification*:
     - **시각 검증**:
       - [x] `npm run dev` 후 문장 모드로 토글 전환
       - [x] Screenshot Target: Sentence focus view, saved to `docs/visual-evidence/sentence-view.png`
       - [x] Viewport: Desktop (1440x900)
       - [x] Verify microphone recording state buttons (red danger pulse wave)
  4. *Git Commit*: `git commit -am "style(player): redesign sentence mode central focus card with design system tokens"`

### Task 4: Redesign AI Tutor Panel
- **Target File**: [TutorPanel.tsx](file:///Users/zorba/mono-repo/projects/nsq/src/components/TutorPanel.tsx)
- **Modification Range**: Line 92 to 190
- **Steps**:
  1. *Test (Pre-verification)*: Verify chatbot panel shows messages.
  2. *Implementation*:
     - Style Tutor header and persona buttons with outline solid borders (`border-line-solid-normal`). (No hardcoded `#334155`).
     - Change AI chat bubble to `bg-background-elevated-normal border border-line-normal-normal text-label-normal rounded-2xl` matching the solid dark aesthetic.
     - Refactor quick action chips (`Chip`) and TextField spacing to maintain visual alignment.
  3. *TDD / Verification*:
     - **시각 검증**:
       - [x] `npm run dev` 후 AI Tutor 채팅 영역 확인
       - [x] Screenshot Target: Tutor sidebar panel, saved to `docs/visual-evidence/tutor-panel.png`
       - [x] Viewport: Desktop (1440x900)
       - [x] Verify AI messages are readable in solid dark bubbles and quick action chips wrap properly
  4. *Git Commit*: `git commit -am "style(player): update AI tutor chat interface with design system tokens"`

### Task 5: AGENTS.md Updates and Visual Regression Test Validation
- **Target Files**: 
  - [AGENTS.md](file:///Users/zorba/mono-repo/projects/nsq/AGENTS.md)
  - [exec-plans/index.md](file:///Users/zorba/mono-repo/projects/nsq/docs/exec-plans/index.md)
- **Steps**:
  1. Update `exec-plans/index.md` moving `player-solid-dark-plan.md` to active/completed once done.
  2. Perform visual regression testing using Playwright: `npm run test:visual` to ensure no visual regressions across pages.
  3. Commit and wrap up.

---

## 5. Verification Matrix

| Requirement | Source Artifact | Implementation File | Verification Method | Evidence |
| --- | --- | --- | --- | --- |
| Header is solid with design system tokens (elevated bg & line border) | `player-v2.html` (Option B) | `src/app/player/[videoId]/page.tsx` | Visual check & Playwright test | verified |
| Inactive segment card is solid dark with semantic borders and border radius | `player-v2.html` (Option B) | `src/components/ImmersionMode.tsx` | Visual check & Playwright test | verified |
| Active segment has blue semantic highlight bar and primary-normal opacity backdrop | `player-v2.html` (Option B) | `src/components/ImmersionMode.tsx` | Visual check & Playwright test | verified |
| Focus card is solid dark with double border radius (16px) | `player-v2.html` (Option B) | `src/components/SentenceMode.tsx` | Visual check & Playwright test | verified |
| AI message bubbles are solid dark and outlined via design system tokens | `player-v2.html` (Option B) | `src/components/TutorPanel.tsx` | Visual check & Playwright test | verified |

---

## 6. Checklist JSON Mapping
- Map tasks 1 to 5 to `player-solid-dark-checklist.json` tasks.

---

## 7. Out-of-Scope and Intentional Deviations
- Glassmorphic backdrop filters and blur effects are explicitly disabled on the player pages.
- Backend APIs (streaming audio, AI openrouter chat endpoint) are not modified.
