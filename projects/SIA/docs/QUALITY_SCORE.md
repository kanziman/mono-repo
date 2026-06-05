# Code Quality & Testing Standards (SIA)

Since SIA (Self Improving A.I.) features autonomous code modification and generation loops, quality scores, linters, and test suites are the primary boundary guards preventing system degradation.

## 🎯 Quality Scoring Rubric

- **Grade A (Production-Ready)**: Test coverage > 95% for core improvement algorithms, 0 linter errors or warnings, completely documented APIs, verified no-regression status.
- **Grade B (Stable)**: Test coverage > 85%, 0 linter errors, documented interfaces.
- **Grade C (Unsafe / Refactor Required)**: Test coverage < 85%, or contains linter errors/warnings. Autonomous improvements producing Grade C code must be automatically rolled back.

## 📏 General Quality Rules

1. **Linter-Driven CI**: All generated code must be automatically formatted (`prettier`) and linted (`eslint`) before passing to the evaluator.
2. **Deterministic Execution**: Avoid flaky tests. AI improvement steps must be tested under deterministic sandboxed environments.
3. **No-Regression Rule**: Autonomous modifications must maintain or improve the existing code coverage score and never lower it.

## 🧪 Test & TDD Standards

1. **Test-Driven Self-Improvement (TDD)**:
   - When the agent attempts to write/optimize a module, it must write a test describing the success criteria first, or extend the existing test suite, before changing the main file.
2. **Mocking Boundaries**:
   - Do not mock the file system or environment execution inside the agent control tests. Use sandboxed directories for physical validation.
   - Mock only external LLM APIs (e.g. mock OpenAI completions) when testing agent logic to keep tests fast, predictable, and cost-effective.
3. **Evaluation Sanitization**:
   - Test helpers and debug tools must be strictly separated. Never write helper hooks or debugging triggers into production modules that the agent might accidentally leave behind.
