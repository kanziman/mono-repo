# zb-writing-plans Visual Traceability Pressure Tests

These pressure tests capture the NSQ planning failure where selected visual intent from brainstorm artifacts did not become executable requirements.

## Mockup drift

Scenario: The user selects `layout-options-v1.html` option A for the NSQ player layout, but the implementation plan reduces that decision to "adjust TutorPanel width".

Expected rejection: A valid plan must preserve the selected mockup path and option, then translate visible requirements such as right-panel width, full-height layout, control placement, and responsive behavior into task acceptance criteria.

Baseline failure before this hardening:

- The previous `SKILL.md` asked for UI visual verification, but not selected artifact traceability.
- It asked for expected rendering, but not source artifact path, selected option, or intentional deviation notes.
- The previous reviewer prompt did not check visual traceability or selected mockup fidelity.

## Scope ambiguity

Scenario: The plan references an NSQ design document, but does not say whether implementation must match the selected brainstorm screen, implement only a subset, or intentionally diverge from the mockup.

Expected rejection: A valid plan must include a scope lock that states exact reproduction, scoped subset, or intentional deviation, with visible non-goals called out before execution.

Baseline failure before this hardening:

- The previous `SKILL.md` asked for expected rendering, but not source artifact path, selected option, or intentional deviation notes.
- It did not force the plan to reject vague UI work such as "improve layout" when a selected visual artifact existed.
- The previous reviewer prompt did not check whether design-document references preserved selected mockup fidelity.

## False done

Scenario: The checklist reaches `done` after `vitest` passes and the route returns HTTP 200, but no screenshot or browser visual verification confirms that the NSQ player matches the selected layout.

Expected rejection: A valid UI plan must include browser visual verification before a task can be marked `done`, with screenshot targets or equivalent user-confirmed visual evidence tied to checklist tasks.

Baseline failure before this hardening:

- The previous `SKILL.md` asked for UI visual verification, but not selected artifact traceability.
- It did not require checklist JSON to include visual verification task names.
- The previous reviewer prompt did not check visual traceability, screenshot evidence, or selected mockup fidelity before allowing `done`.
