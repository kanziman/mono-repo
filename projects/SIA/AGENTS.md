# Project Rules (SIA)

This file acts as a map for AI Agents. Details are nested under `docs/` to preserve context limits. Keep this file under 100 lines.

## 🛠️ Core Commands
* **Lint & Format**: `npm run lint`
* **Test All**: `npm test`
* **Test Specific File**: `npm test -- <path_to_test_file>` (highly recommended to save context token limits)

## 🎨 Code Style & Quality Guidelines
* Refer to [DESIGN.md](docs/DESIGN.md) for detailed architecture guidelines.
* Refer to [QUALITY_SCORE.md](docs/QUALITY_SCORE.md) for code quality requirements.
* Invariants must be enforced using linters/tests, not just documentation.

## 🔄 Workflow Conventions
* **Work Execution**: Always design an implementation plan under `docs/exec-plans/active/` and request user approval before implementing complex modifications.
* **Refactoring & Debt**: Log any technical debt introduced or found in [tech-debt-tracker.md](docs/exec-plans/tech-debt-tracker.md).
