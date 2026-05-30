# Architecture Map (Fervent)

This document provides a high-level package and domain mapping of the repository to orient agents and human developers.

```mermaid
graph TD
    Root[/Project Root/] --> ClaudeDir[".claude/ (Configuration & Custom Agents)"]
    Root --> DocsDir["docs/ (Standardized Docs & Plans)"]
    Root --> GuidesDir["guides/ (Original Reference Guides)"]
    
    DocsDir --> DesignDocs["design-docs/"]
    DocsDir --> ExecPlans["exec-plans/"]
    DocsDir --> Specs["product-specs/"]
    
    ClaudeDir --> Skills["skills/ (On-demand knowledge)"]
    ClaudeDir --> Agents["agents/ (Subagents)"]
```

## 📂 Core Component Map

* **`/.claude/`**: Specific developer harness configurations.
  * **`skills/`**: Domain specific instructions loaded on-demand.
  * **`agents/`**: Task-specific subagents for security, refactoring, and linting.
* **`/docs/`**: Primary documentation hub.
  * **`design-docs/`**: High-level designs and core decisions.
  * **`exec-plans/`**: Active and completed execution plans, and the technical debt tracker.
* **`/guides/`**: System guidelines and references.
