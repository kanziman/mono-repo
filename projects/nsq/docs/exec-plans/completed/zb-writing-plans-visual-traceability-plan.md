# Plan: zb-writing-plans-visual-traceability

Date: 2026-05-31

## Background

`nsq-shadowing-plan.md` and `player-layout-fix-plan.md` were completed through the `zb-*` workflow, but the final UI diverged from the selected brainstorm mockups. The failure was not a single CSS bug. The planning workflow allowed gaps between:

- brainstorm artifact selection
- design document scope
- implementation plan acceptance criteria
- checklist completion
- browser-based visual verification

This plan updates `zb-writing-plans` so future plans preserve selected visual/product intent as executable requirements, not loose references.

## Scope

Modify:

- `.agents/skills/zb-writing-plans/SKILL.md`
- `.claude/skills/zb-writing-plans/SKILL.md`
- `.agents/skills/zb-writing-plans/plan-reviewer-prompt.md`
- `.claude/skills/zb-writing-plans/plan-reviewer-prompt.md`

Add verification references only if needed:

- `projects/nsq/docs/solutions/workflow/ui-plan-execution-visual-validation.md`

Out of scope:

- Rebuilding the NSQ UI
- Changing `zb-executing-plans`, `zb-subagent-driven-development`, or `zb-finish-branch`
- Moving completed historical plans

## Required Outcome

Future plans that touch UI, UX, product behavior, or generated design artifacts must include:

1. A source artifact ledger with exact paths and chosen option names.
2. A scope lock explaining whether the plan reproduces the selected mockup, implements only a subset, or intentionally deviates.
3. Per-task acceptance criteria that map visible UI requirements to files and selectors/components.
4. Browser visual verification before a task can be marked `done`.
5. A reviewer prompt that rejects plans missing those items.
6. `.agents` and `.claude` copies kept byte-identical.

## Task 1: Add skill pressure tests before editing

Files:

- Create: `projects/nsq/docs/exec-plans/active/zb-writing-plans-visual-traceability-pressure-tests.md`

TDD step 1, failing process tests:

Write three pressure scenarios that describe how the current skill can still produce a bad plan:

1. **Mockup drift**: user selects `layout-options-v1.html` option A, but plan only says "adjust TutorPanel width".
2. **Scope ambiguity**: plan references a design document but does not say whether it must match the selected brainstorm screen.
3. **False done**: checklist reaches `done` after `vitest`/HTTP 200 without screenshot or browser verification.

TDD step 2, failure confirmation:

Record why the current `SKILL.md` does not force rejection:

- It asks for UI visual verification, but not selected artifact traceability.
- It asks for expected rendering, but not source artifact path, selected option, or intentional deviation notes.
- It does not require checklist JSON to include visual verification task names.
- Reviewer prompt does not check visual traceability or selected mockup fidelity.

Verification:

```bash
test -s projects/nsq/docs/exec-plans/active/zb-writing-plans-visual-traceability-pressure-tests.md
rg -n "Mockup drift|Scope ambiguity|False done" projects/nsq/docs/exec-plans/active/zb-writing-plans-visual-traceability-pressure-tests.md
```

Expected:

- File exists.
- All three scenario headings are found.

Commit:

```bash
git add projects/nsq/docs/exec-plans/active/zb-writing-plans-visual-traceability-pressure-tests.md
git commit -m "test: document visual traceability pressure cases for planning skill"
```

## Task 2: Harden `zb-writing-plans` source artifact rules

Files:

- Modify: `.agents/skills/zb-writing-plans/SKILL.md`
- Modify: `.claude/skills/zb-writing-plans/SKILL.md`

Implementation:

Add a new section before "작업 분할 규칙":

```markdown
## 🎯 Source Artifact Traceability

When a plan is based on a brainstorm, mockup, screenshot, HTML prototype, product spec, or user-selected option, the plan must include a "Source Artifact Ledger" near the top.

Required fields:
- Artifact path or URL
- Artifact type: brainstorm HTML, screenshot, design doc, product spec, existing screen
- Selected option or screen name
- User decision summary
- Implementation scope: exact reproduction | scoped subset | intentional deviation
- Non-goals and known deviations

If the selected artifact is visual, the plan must include a "Visual Contract" section with measurable requirements: layout regions, widths/heights, spacing, visible controls, empty/loading/error states, responsive behavior, theme behavior, and screenshot targets.

The agent must not collapse a selected mockup into a vague task such as "improve layout" or "adjust UI". If only a subset will be implemented, the plan must state which visible parts are excluded and why.
```

Also extend the existing UI visual verification rule:

- Require a screenshot target per UI task.
- Require viewport list: at minimum desktop and one constrained width if responsive behavior can matter.
- Require evidence field in task completion notes: screenshot path, Playwright command output, or explicit user-confirmed screenshot.
- Require checklist JSON to include a final visual parity/review task for UI plans.

Verification:

```bash
rg -n "Source Artifact Ledger|Visual Contract|screenshot target|visual parity" .agents/skills/zb-writing-plans/SKILL.md .claude/skills/zb-writing-plans/SKILL.md
cmp -s .agents/skills/zb-writing-plans/SKILL.md .claude/skills/zb-writing-plans/SKILL.md
```

Expected:

- All required phrases found in both files.
- `cmp` exits with status 0.

Commit:

```bash
git add .agents/skills/zb-writing-plans/SKILL.md .claude/skills/zb-writing-plans/SKILL.md
git commit -m "docs: require source artifact traceability in planning skill"
```

## Task 3: Add plan template requirements

Files:

- Modify: `.agents/skills/zb-writing-plans/SKILL.md`
- Modify: `.claude/skills/zb-writing-plans/SKILL.md`

Implementation:

Add a mandatory plan structure for UI/product plans:

```markdown
## Required Plan Sections for UI/Product Work

1. Source Artifact Ledger
2. Scope Lock
3. Visual Contract
4. Task Breakdown
5. Verification Matrix
6. Checklist JSON Mapping
7. Out-of-Scope and Intentional Deviations
```

Add a `Verification Matrix` format:

```markdown
| Requirement | Source artifact | Implementation file | Verification method | Evidence |
| --- | --- | --- | --- | --- |
| Right tutor panel is 420px and full-height | layout-options-v1.html option A | src/app/player/[videoId]/page.tsx | Playwright screenshot desktop | pending |
```

Add a rule:

- A plan cannot be marked ready if any UI requirement has `Evidence` missing from the verification matrix after execution.
- If the implementation is only a subset of the selected visual artifact, the subset must be approved by the user before execution.

Verification:

```bash
rg -n "Required Plan Sections for UI/Product Work|Verification Matrix|Scope Lock|Intentional Deviations" .agents/skills/zb-writing-plans/SKILL.md .claude/skills/zb-writing-plans/SKILL.md
cmp -s .agents/skills/zb-writing-plans/SKILL.md .claude/skills/zb-writing-plans/SKILL.md
```

Expected:

- All required phrases found in both files.
- `cmp` exits with status 0.

Commit:

```bash
git add .agents/skills/zb-writing-plans/SKILL.md .claude/skills/zb-writing-plans/SKILL.md
git commit -m "docs: add visual contract template to planning skill"
```

## Task 4: Harden the plan reviewer prompt

Files:

- Modify: `.agents/skills/zb-writing-plans/plan-reviewer-prompt.md`
- Modify: `.claude/skills/zb-writing-plans/plan-reviewer-prompt.md`

Implementation:

Extend the reviewer checklist with mandatory rejection criteria:

```markdown
5. Source artifact traceability:
   - If the user selected a mockup/prototype/screenshot/design option, does the plan list exact artifact paths and selected options?
   - Does the plan say whether it is exact reproduction, scoped subset, or intentional deviation?

6. Visual contract completeness:
   - Are layout regions, dimensions, states, theme behavior, and responsive targets measurable?
   - Are expected screenshots or browser checks tied to specific routes?

7. Verification matrix:
   - Does every visual/product requirement map to implementation files and verification evidence?
   - Does the checklist JSON contain visual parity/review tasks when UI is involved?

Reject if:
- The plan says only "improve UI", "match design", "adjust layout", or similar vague wording.
- A selected visual artifact exists but is not converted into a visual contract.
- UI work can be marked done by tests alone.
```

Verification:

```bash
rg -n "Source artifact traceability|Visual contract completeness|Verification matrix|Reject if" .agents/skills/zb-writing-plans/plan-reviewer-prompt.md .claude/skills/zb-writing-plans/plan-reviewer-prompt.md
cmp -s .agents/skills/zb-writing-plans/plan-reviewer-prompt.md .claude/skills/zb-writing-plans/plan-reviewer-prompt.md
```

Expected:

- All required phrases found in both files.
- `cmp` exits with status 0.

Commit:

```bash
git add .agents/skills/zb-writing-plans/plan-reviewer-prompt.md .claude/skills/zb-writing-plans/plan-reviewer-prompt.md
git commit -m "docs: make plan reviewer reject missing visual traceability"
```

## Task 5: Add regression fixture plan review

Files:

- Create: `projects/nsq/docs/exec-plans/active/zb-writing-plans-visual-traceability-regression.md`

Implementation:

Create two short sample plan excerpts:

1. **Bad excerpt** based on the NSQ failure:
   - References `layout-options-v1.html`.
   - Says only "expand TutorPanel width and improve segment cards".
   - Omits selected option, visual contract, screenshot target, and verification matrix.

2. **Good excerpt**:
   - Lists the exact artifact path.
   - Names the selected option.
   - Defines exact scope.
   - Includes visual contract and verification matrix rows.

Verification:

```bash
rg -n "Bad excerpt|Good excerpt|layout-options-v1.html|Visual Contract|Verification Matrix" projects/nsq/docs/exec-plans/active/zb-writing-plans-visual-traceability-regression.md
```

Expected:

- All required phrases found.

Commit:

```bash
git add projects/nsq/docs/exec-plans/active/zb-writing-plans-visual-traceability-regression.md
git commit -m "test: add regression examples for visual planning review"
```

## Task 6: Verify skill synchronization and documentation quality

Files:

- Read only unless defects are found:
  - `.agents/skills/zb-writing-plans/SKILL.md`
  - `.claude/skills/zb-writing-plans/SKILL.md`
  - `.agents/skills/zb-writing-plans/plan-reviewer-prompt.md`
  - `.claude/skills/zb-writing-plans/plan-reviewer-prompt.md`

Verification:

```bash
cmp -s .agents/skills/zb-writing-plans/SKILL.md .claude/skills/zb-writing-plans/SKILL.md
cmp -s .agents/skills/zb-writing-plans/plan-reviewer-prompt.md .claude/skills/zb-writing-plans/plan-reviewer-prompt.md
rg -n "TODO|TBD|추후|나중에" .agents/skills/zb-writing-plans .claude/skills/zb-writing-plans
```

Expected:

- Both `cmp` commands exit with status 0.
- `rg` finds no placeholder text.

If `rg` finds a legitimate historical word that should remain, document the exact line and why it is acceptable in the commit message body.

Commit:

```bash
git add .agents/skills/zb-writing-plans .claude/skills/zb-writing-plans projects/nsq/docs/exec-plans/active/zb-writing-plans-visual-traceability-*.md
git commit -m "test: verify planning skill visual traceability safeguards"
```

## Task 7: AGENTS.md update

Files:

- Modify: `AGENTS.md`
- Modify: `projects/nsq/AGENTS.md`

Implementation:

Add a short workflow note:

- UI/product plans must preserve selected brainstorm/mockup artifacts through `Source Artifact Ledger`, `Scope Lock`, `Visual Contract`, and browser visual evidence.
- `zb-writing-plans` must be used before execution when a selected design artifact is part of the request.

Verification:

```bash
rg -n "Source Artifact Ledger|Visual Contract|browser visual evidence" AGENTS.md projects/nsq/AGENTS.md
```

Expected:

- Both files mention the new planning requirement.

Commit:

```bash
git add AGENTS.md projects/nsq/AGENTS.md
git commit -m "docs: document visual traceability planning requirement"
```

## Final Verification

Run:

```bash
cmp -s .agents/skills/zb-writing-plans/SKILL.md .claude/skills/zb-writing-plans/SKILL.md
cmp -s .agents/skills/zb-writing-plans/plan-reviewer-prompt.md .claude/skills/zb-writing-plans/plan-reviewer-prompt.md
rg -n "Source Artifact Ledger|Scope Lock|Visual Contract|Verification Matrix|Reject if" .agents/skills/zb-writing-plans .claude/skills/zb-writing-plans
test -s projects/nsq/docs/exec-plans/active/zb-writing-plans-visual-traceability-pressure-tests.md
test -s projects/nsq/docs/exec-plans/active/zb-writing-plans-visual-traceability-regression.md
```

Expected:

- Both `cmp` commands exit with status 0.
- `rg` finds all new governance terms.
- Both test fixture documents exist and are non-empty.

## Completion Criteria

- All tasks are complete.
- Checklist JSON is fully `done`.
- `projects/nsq/docs/exec-plans/index.md` moves this plan from active to completed.
- Future `zb-writing-plans` usage cannot produce a UI/product implementation plan without artifact traceability and visual verification requirements.
