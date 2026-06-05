# System Design & Architecture Guidelines (SIA)

This document details the architectural boundaries, design patterns, and interface conventions to be followed when developing in the SIA repository.

## 1. Architectural Style

- We use a **Clean Architecture / Agentic Control Loop** pattern.
- Keep external LLM client APIs, file systems, and command execution separate from core business logic (agent orchestration, state selection, self-improvement heuristics).
- Agent core logic must be independent of specific LLM provider client SDKs (use abstract adaptors/interfaces).

## 2. Component Isolation

- **Agent Core**: Manages state, improvement goals, history, and decision-making logic. It does NOT interact directly with shell command executions or external API endpoints.
- **Tools / Environment**: Handles safe execution of code, terminal tools, and sandboxed test execution.
- **Evaluator**: Critiques agent modifications based on static analysis, test results, and resource profiles, providing feedback to the Agent Core.

## 3. Dependency Flow

- Dependencies must always point inward (e.g., Tools -> Evaluator -> Core Agent Heuristics).
- Inner cores have no awareness of the specific database, testing frameworks, or LLM providers.

## 4. UI & Frontend Design System

- If SIA implements any user interface (dashboard, logs, playground), to maintain visual and component consistency across projects, you must refer to and utilize the shared custom design system located at [../../../../design-system](../../../design-system).
- Do not define ad-hoc design patterns or style tokens (colors, typography, spacing) without checking the shared design system first.
