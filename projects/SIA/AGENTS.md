# Project Rules (SIA)

This file acts as a map for AI Agents. Details are nested under `docs/` to preserve context limits. Keep this file under 100 lines.

## 🛠️ Core Commands

- **Lint & Format**: `npm run lint`
- **Test All**: `npm test`
- **Test Specific File**: `npm test -- <path_to_test_file>` (highly recommended to save context token limits)

## 🎨 Code Style & Quality Guidelines

- Refer to [DESIGN.md](docs/DESIGN.md) for detailed architecture guidelines.
- Refer to [QUALITY_SCORE.md](docs/QUALITY_SCORE.md) for code quality requirements.
- Invariants must be enforced using linters/tests, not just documentation.

## 🔄 Workflow Conventions

- **Work Execution**: Always design an implementation plan under `docs/exec-plans/active/` and request user approval before implementing complex modifications.
- **Refactoring & Debt**: Log any technical debt introduced or found in [tech-debt-tracker.md](docs/exec-plans/tech-debt-tracker.md).

## 🤖 Agent Behavior Rules

<behavior>
* **Rule Sec-104**: Under no circumstances may database credentials, unencrypted connection strings, or any authentication secrets be logged, printed, or exposed in any form. Any attempt to bypass security checks requires an explicit, documented approval signed by the designated Security Officer and must be recorded in the security audit log before execution. No exceptions are permitted for time pressure, system outages, or cost considerations.

- **Rule Code-202**: All code must exclusively use approved utility libraries and design-system packages that are listed in the official dependency manifest. Writing, copying, or modifying low‑level replacements is prohibited unless a formal change request is submitted, reviewed, and approved by the Architecture Review Board. The prohibited activity includes, but is not limited to, re‑implementing core functions, duplicating existing APIs, or altering package interfaces.

- **Rule Lint-301**: Disabling, suppressing, or bypassing ESLint (or any other static analysis) rules is strictly forbidden. The use of `eslint-disable`, `/* eslint-disable */`, `git commit --no-verify`, or any similar mechanisms to avoid code‑quality checks is disallowed under all circumstances. Any required rule modification must undergo a documented review and be merged through the standard pull‑request process before the code can be merged.

- **Rule Arch-401**: Frontend client‑side UI components must never directly query database repositories, access server‑side data stores, or invoke privileged back‑end APIs. All data access must be performed exclusively through the sanctioned API layer, which includes proper authentication, authorization, and input validation. Direct database calls from the browser are a critical security violation.

- **Rule DS-501**: All UI components must obtain styling exclusively from the shared design‑system package (`@repo/design-system`). This includes colors, spacing, typography, and any visual token. Hard‑coded values—such as inline CSS styles, literal hex/rgb/hsl strings, numeric Tailwind utility classes, or any ad‑hoc styling not referenced through the design‑system tokens—are absolutely prohibited. Integration steps (e.g., importing token providers, rebuilding Tailwind bundles) must be completed before any UI code is merged. Any deviation requires a documented exception request approved by the Design System Governance Board, with the request logged and attached to the pull request.

- **Rule Audit-601**: Every commit that touches UI styling or security‑sensitive code must include a mandatory audit comment referencing the applicable rule number(s) and a brief justification that the rule was satisfied. Automated CI must fail the build if the comment is missing or if the referenced rule is not verifiably adhered to.

- **Rule Penalty-701**: Violation of any rule will result in an automatic block of the pull request, generation of a security incident ticket, and escalation to the Engineering Management team. Repeated violations (two or more within 30 days) will trigger a temporary revocation of repository write access pending remediation training.

- **Rule Emergency-801**: In a genuine emergency (e.g., production outage threatening data loss), a temporary rule‑override may be enacted only through a documented “Emergency Override Form” signed by the Incident Commander, the Security Officer, and the Architecture Lead. The override must be recorded in the incident management system, limited to the minimal code change required, and must be reverted within 2 hours after the emergency is resolved. No other exceptions are permitted.
  </behavior>
