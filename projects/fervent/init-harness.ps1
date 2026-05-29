# init-harness.ps1
# This script initializes the standardized project structure and templates in the current directory.

$ErrorActionPreference = "Stop"

Write-Output "=== Starting Standardized Project Structure Setup ==="

# 1. Helper function to create directory
function Create-DirIfNotExist($path) {
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path | Out-Null
        Write-Output "Created directory: $path"
    } else {
        Write-Output "Directory already exists: $path"
    }
}

# 2. Helper function to create file if not exist
function Create-FileIfNotExist($path, $content) {
    if (-not (Test-Path $path)) {
        # Ensure parent directory exists
        $parent = Split-Path $path -Parent
        if ($parent -and -not (Test-Path $parent)) {
            Create-DirIfNotExist $parent
        }
        New-Item -ItemType File -Path $path -Value $content -Force | Out-Null
        Write-Output "Created file: $path"
    } else {
        Write-Output "Skipped (already exists): $path"
    }
}

# 3. Create folders
$directories = @(
    ".claude",
    ".claude/skills",
    ".claude/agents",
    ".claude/guides",
    "docs",
    "docs/design-docs",
    "docs/exec-plans",
    "docs/exec-plans/active",
    "docs/exec-plans/completed",
    "docs/product-specs",
    "docs/references",
    "docs/generated",
    "tests"
)

foreach ($dir in $directories) {
    Create-DirIfNotExist $dir
}

# 4. Create files with templates

# AGENTS.md
$agentsMd = '# Project Rules

This file acts as a map for AI Agents. Details are nested under `docs/` or `.claude/guides/` to preserve context limits. Keep this file under 100 lines.

## 🛠️ Core Commands
* **Lint & Format**: `npm run lint`
* **Test All**: `npm test`
* **Test Specific File**: `npm test -- <path_to_test_file>`

## 🎨 Code Style & Quality Guidelines
* Refer to [DESIGN.md](docs/DESIGN.md) for detailed architecture guidelines.
* Refer to [QUALITY_SCORE.md](docs/QUALITY_SCORE.md) for code quality requirements.
* Invariants must be enforced using linters/tests, not just documentation.

## 🔄 Workflow Conventions
* **Branching & Commits**: Follow [.claude/guides/pr-conventions.md](.claude/guides/pr-conventions.md).
* **Testing Guidelines**: Follow [.claude/guides/testing.md](.claude/guides/testing.md).
* **Work Execution**: Always design an implementation plan under `docs/exec-plans/active/` and request user approval before implementing complex modifications.
* **Refactoring & Debt**: Log any technical debt introduced or found in [tech-debt-tracker.md](docs/exec-plans/tech-debt-tracker.md).
'
Create-FileIfNotExist "AGENTS.md" $agentsMd

# ARCHITECTURE.md
$architectureMd = '# Architecture Map

This document provides a high-level package and domain mapping of the repository.

```mermaid
graph TD
    Root[/Project Root/] --> ClaudeDir[".claude/ (Configuration & Custom Agents)"]
    Root --> DocsDir["docs/ (Standardized Docs & Plans)"]
    Root --> SrcDir["src/ (Source Code)"]
    
    DocsDir --> DesignDocs["design-docs/"]
    DocsDir --> ExecPlans["exec-plans/"]
    
    ClaudeDir --> Skills["skills/"]
    ClaudeDir --> Agents["agents/"]
```

## 📂 Core Component Map
* **`/.claude/`**: Specific developer harness configurations.
* **`/docs/`**: Primary documentation hub.
* **`/src/`**: Application source code.
'
Create-FileIfNotExist "ARCHITECTURE.md" $architectureMd

# .claude/settings.json
$settingsJson = '{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "write_to_file|replace_file_content|multi_replace_file_content",
        "hooks": [
          {
            "type": "command",
            "command": "npm run format && npm run lint",
            "statusMessage": "Running formatter and linter after file modification..."
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -c \"[console]::beep(1000, 300)\"",
            "statusMessage": "Alerting task stop..."
          }
        ]
      }
    ]
  },
  "permissions": {
    "allowedCommands": [
      "npm run format",
      "npm run lint",
      "npm test"
    ]
  }
}
'
Create-FileIfNotExist ".claude/settings.json" $settingsJson

# package.json
$projectName = (Get-Item .).Name
$packageJson = '{
  "name": "' + $projectName.ToLower() + '",
  "version": "1.0.0",
  "description": "Standardized development harness and configurations.",
  "main": "index.js",
  "scripts": {
    "format": "prettier --write .",
    "lint": "eslint . && prettier --check .",
    "test": "echo \"Running tests...\" && exit 0"
  },
  "devDependencies": {
    "eslint": "^9.0.0",
    "prettier": "^3.0.0"
  }
}
'
Create-FileIfNotExist "package.json" $packageJson


# .claude/guides/pr-conventions.md
$prConventions = '# Git 커밋 및 Pull Request 컨벤션 (PR Conventions)

에이전트가 코드를 완성하고 버전 관리를 수행할 때 준수해야 하는 가이드라인입니다.

## 📌 브랜치 네이밍 규칙
- 브랜치 명은 다음 패턴을 따릅니다: `<type>/<issue-number>-<short-description>`
  - 예: `feat/123-oauth-login`
  - 예: `fix/456-session-leak`

## 📝 커밋 메시지 규칙
Conventional Commits 명세에 맞추어 메시지를 작성합니다:
```text
<type>(<scope>): <subject>

<body>
```
- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅 (로직 변경 없음)
- `refactor`: 리팩토링

## 🔄 Pull Request 초안 작성
- 작업이 모두 성공하고 린트 및 테스트를 완료하면 다음 템플릿에 맞추어 PR 바디를 작성하여 제공합니다.
```markdown
## 변경 목적
- 이 변경사항이 필요한 이유를 기재합니다.

## 핵심 변경 내용
- 수정/생성된 핵심 모듈 및 로직을 요약합니다.

## 검증 결과
- 검증에 사용한 테스트 명령어 및 성공 로그를 기재합니다.
```
'
Create-FileIfNotExist ".claude/guides/pr-conventions.md" $prConventions

# .claude/guides/testing.md
$testingMd = '# 테스트 작성 및 검증 가이드 (Testing Guidelines)

에이전트가 테스트 코드를 작성하거나 실행할 때 지켜야 할 가이드입니다.

## 🧪 테스트 작성 원칙
1. **자체 완성형 검증**: 테스트는 외부 서비스에 의존하지 않아야 하며, Mocking 기법을 적극 사용하여 오프라인에서도 작동하도록 설계합니다.
2. **경계값 검증(Edge Case)**: 정상 작동 케이스뿐만 아니라, `null`, `undefined`, 경계 범위 밖의 값 등 오류 대응 코드 경로를 반드시 테스트 케이스에 포함합니다.
3. **단일 실패 원칙**: 하나의 테스트 함수/블록은 하나의 비즈니스 요구사항만 독립적으로 확인해야 합니다.

## ⚡ 효율적인 검증 워크플로우
- 전체 테스트 스위트를 돌리면 세션 토큰과 시간이 많이 낭비됩니다.
- 변경이 일어난 특정 모듈의 유닛 테스트만 골라서 실행하십시오.
  * 예: `npm test -- <특정_테스트_파일_경로>`
- 테스트 실패 시, 즉각 에러 로그를 보고 원인을 파악한 후 코드를 수정하고 해당 테스트를 재실행하십시오.
'
Create-FileIfNotExist ".claude/guides/testing.md" $testingMd

# docs/design-docs/index.md
$designDocsIndex = '# Design Documents Index

This folder contains the technical design specifications and architectural decisions for the project.

## 📝 Document List
* [Core Beliefs & Engineering Principles](core-beliefs.md)
'
Create-FileIfNotExist "docs/design-docs/index.md" $designDocsIndex

# docs/design-docs/core-beliefs.md
$coreBeliefs = '# Core Beliefs & Engineering Principles

This document outlines the core values and architectural philosophy of our development methodology, particularly optimized for AI-Human collaborative programming.

## 1. AI-Friendly Architecture
* **High Modularity**: Keep modules small, cohesive, and single-purpose. AI models perform significantly better with focused contexts.
* **Boring Technology**: Prefer stable, mature, and well-documented technology stacks. Novelty is for business logic; keep infrastructure boring.

## 2. Fast Verification Loop
* **Local Executability**: The local setup must be simple and runnable without external network dependencies.
* **Hermetic Testing**: Tests should be isolated and heavily rely on mock interfaces so they can run quickly and offline.

## 3. Strict Invariant Enforcement
* **Linter Over Documentation**: If a rule can be linted, lint it. Do not rely on developers (human or AI) reading documents to remember rules.
* **Continuous Feedback**: Automated hooks should run tests and linters immediately after code edits.
'
Create-FileIfNotExist "docs/design-docs/core-beliefs.md" $coreBeliefs

# docs/exec-plans/tech-debt-tracker.md
$techDebtTracker = '# Technical Debt Tracker

This tracker monitors architectural drift, dead code, dependency versions, and other technical debt items.

## 🚨 Active Technical Debt Items

| ID | Description | Severity | Target Resolution Date | Status |
| :--- | :--- | :--- | :--- | :--- |
| TD-001 | Initial structure setup and validation | Low | | In Progress |

## 🗃️ Resolved Technical Debt
*(Once items are resolved, move them here with resolution details)*
'
Create-FileIfNotExist "docs/exec-plans/tech-debt-tracker.md" $techDebtTracker

# docs/DESIGN.md
$designMd = '# System Design & Architecture Guidelines

This document details the architectural boundaries, design patterns, and interface conventions to be followed when developing in this repository.

## 1. Architectural Style
* We use a **Modular Monolith / Clean Architecture** pattern.
* Keep infrastructure separate from business logic (Domain/Core layers).
* Domain objects must be independent of framework-specific libraries.

## 2. Component Isolation
* **UI Components** must never talk directly to databases or persistent storage. They should query services or APIs.
* **Services** contain core business logic and state transitions.
* **Repositories / Adapters** handle external network and data persistence mechanisms.

## 3. Dependency Flow
* Dependencies must always point inward (e.g., UI -> Services -> Repositories -> Domain Entities).

## 4. UI & Frontend Design System
* To maintain visual and component consistency across projects, you must refer to and utilize the shared custom design system located at [../design-system](../design-system).
* Do not define ad-hoc design patterns or style tokens (colors, typography, spacing) without checking the shared design system first.
'
Create-FileIfNotExist "docs/DESIGN.md" $designMd

# docs/QUALITY_SCORE.md
$qualityScoreMd = '# Code Quality Standards (Quality Score)

We score codebase domains and layers based on their adherence to code conventions, test coverage, and static analysis results.

## 🎯 Quality Scoring Rubric
* **Grade A (Excellent)**: Test coverage > 90%, zero linter warnings, zero code duplication, clear documentation.
* **Grade B (Good)**: Test coverage > 80%, zero linter errors (warnings allowed), documented APIs.
* **Grade C (Needs Improvement)**: Test coverage < 80%, contains linter errors/warnings. Needs technical debt resolution.

## 📏 General Quality Rules
1. **Lint Rules**: Linter checks must pass prior to merge. No warning-suppressing flags without explicit comments.
2. **Coverage Goal**: New code must have at least **85% unit test coverage**.
3. **Format**: All files must be formatted using the project''s formatting tools.
'
Create-FileIfNotExist "docs/QUALITY_SCORE.md" $qualityScoreMd

# docs/RELIABILITY.md
$reliabilityMd = '# System Reliability & Fault Tolerance Guidelines

This document outlines policies for retry mechanisms, circuit breakers, timeout limits, and exception handling strategies.

## 1. Timeout Policy
* All outbound HTTP/gRPC requests must have explicit timeouts configured (default is **5000ms**).
* Database queries should have query timeouts to prevent blocking connection pools.

## 2. Retry with Exponential Backoff
* Network operations should implement retry with exponential backoff and jitter to mitigate transient errors.
* Maximum retry count should be capped (typically 3 times).

## 3. Circuit Breaker Pattern
* Implement circuit breakers for flaky external API integrations.
'
Create-FileIfNotExist "docs/RELIABILITY.md" $reliabilityMd

# docs/SECURITY.md
$securityMd = '# Security & Data Protection Policy

This document defines core security practices, including key management, input validation, authentication, and authorization rules.

## 1. Secrets Management
* **Zero Hardcoded Secrets**: Absolutely no API keys, tokens, passwords, or connection strings in git.
* Use environment variables or a secure vault to inject secrets.

## 2. Input Validation & Sanitization
* All user inputs must be validated at API boundaries.
* Sanitize all inputs before saving to the database to prevent SQL Injection and XSS.
'
Create-FileIfNotExist "docs/SECURITY.md" $securityMd

# Create .gitkeep files for empty folders
$gitkeepContent = "# Keep directory in git"
Create-FileIfNotExist "docs/exec-plans/active/.gitkeep" $gitkeepContent
Create-FileIfNotExist "docs/exec-plans/completed/.gitkeep" $gitkeepContent
Create-FileIfNotExist "docs/product-specs/.gitkeep" $gitkeepContent
Create-FileIfNotExist "docs/references/.gitkeep" $gitkeepContent
Create-FileIfNotExist "docs/generated/.gitkeep" $gitkeepContent
Create-FileIfNotExist "tests/.gitkeep" $gitkeepContent

Write-Output "=== Standardized Project Structure Setup Completed ==="
