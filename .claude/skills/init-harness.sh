#!/bin/bash
# init-harness.sh
# This script initializes the standardized project structure and templates under projects/<project_name>.

set -e

if [ -z "$1" ]; then
    echo "Usage: init-harness.sh <project_name>"
    exit 1
fi

PROJECT_NAME="$1"

echo "=== Starting Standardized Project Structure Setup for project: $PROJECT_NAME ==="

# Helper function to create directory
create_dir_if_not_exist() {
    local dir="$1"
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        echo "Created directory: $dir"
    else
        echo "Directory already exists: $dir"
    fi
}

# Helper function to create file if not exist
create_file_if_not_exist() {
    local file="$1"
    local content="$2"
    if [ ! -f "$file" ]; then
        local parent
        parent=$(dirname "$file")
        if [ ! -d "$parent" ]; then
            create_dir_if_not_exist "$parent"
        fi
        echo "$content" > "$file"
        echo "Created file: $file"
    else
        echo "Skipped (already exists): $file"
    fi
}

# Find repository root and target directory
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
PROJECTS_DIR="${REPO_ROOT}/projects"
TARGET_DIR="${PROJECTS_DIR}/${PROJECT_NAME}"

# Ensure projects and target project directory exist
create_dir_if_not_exist "$PROJECTS_DIR"
create_dir_if_not_exist "$TARGET_DIR"

# Create folders
create_dir_if_not_exist "${TARGET_DIR}/.claude"
create_dir_if_not_exist "${TARGET_DIR}/.claude/skills"
create_dir_if_not_exist "${TARGET_DIR}/.claude/agents"
create_dir_if_not_exist "${TARGET_DIR}/.claude/guides"
create_dir_if_not_exist "${TARGET_DIR}/docs"
create_dir_if_not_exist "${TARGET_DIR}/docs/design-docs"
create_dir_if_not_exist "${TARGET_DIR}/docs/exec-plans"
create_dir_if_not_exist "${TARGET_DIR}/docs/exec-plans/active"
create_dir_if_not_exist "${TARGET_DIR}/docs/exec-plans/completed"
create_dir_if_not_exist "${TARGET_DIR}/docs/product-specs"
create_dir_if_not_exist "${TARGET_DIR}/docs/references"
create_dir_if_not_exist "${TARGET_DIR}/docs/generated"
create_dir_if_not_exist "${TARGET_DIR}/tests"

# Create AGENTS.md
agents_md=$(cat << 'EOF'
# Project Rules

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
EOF
)
create_file_if_not_exist "${TARGET_DIR}/AGENTS.md" "$agents_md"

# Create ARCHITECTURE.md
architecture_md=$(cat << 'EOF'
# Architecture Map

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
EOF
)
create_file_if_not_exist "${TARGET_DIR}/ARCHITECTURE.md" "$architecture_md"

# Create .claude/settings.json
settings_json=$(cat << 'EOF'
{
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
EOF
)
create_file_if_not_exist "${TARGET_DIR}/.claude/settings.json" "$settings_json"

# Create package.json
package_name=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]')
package_json=$(cat << EOF
{
  "name": "$package_name",
  "version": "1.0.0",
  "description": "Standardized development harness and configurations.",
  "main": "index.js",
  "scripts": {
    "format": "prettier --write .",
    "lint": "eslint . && prettier --check .",
    "test": "echo \\"Running tests...\\" && exit 0"
  },
  "devDependencies": {
    "eslint": "^9.0.0",
    "prettier": "^3.0.0"
  }
}
EOF
)
create_file_if_not_exist "${TARGET_DIR}/package.json" "$package_json"


# Create .claude/guides/pr-conventions.md
pr_conventions=$(cat << 'EOF'
# Git 커밋 및 Pull Request 컨벤션 (PR Conventions)

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
EOF
)
create_file_if_not_exist "${TARGET_DIR}/.claude/guides/pr-conventions.md" "$pr_conventions"

# Create .claude/guides/testing.md
testing_md=$(cat << 'EOF'
# 테스트 작성 및 검증 가이드 (Testing Guidelines)

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
EOF
)
create_file_if_not_exist "${TARGET_DIR}/.claude/guides/testing.md" "$testing_md"

# Create docs/design-docs/index.md
design_docs_index=$(cat << 'EOF'
# Design Documents Index

This folder contains the technical design specifications and architectural decisions for the project.

## 📝 Document List
* [Core Beliefs & Engineering Principles](core-beliefs.md)
EOF
)
create_file_if_not_exist "${TARGET_DIR}/docs/design-docs/index.md" "$design_docs_index"

# Create docs/design-docs/core-beliefs.md
core_beliefs=$(cat << 'EOF'
# Core Beliefs & Engineering Principles

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
EOF
)
create_file_if_not_exist "${TARGET_DIR}/docs/design-docs/core-beliefs.md" "$core_beliefs"

# Create docs/exec-plans/tech-debt-tracker.md
tech_debt_tracker=$(cat << 'EOF'
# Technical Debt Tracker

This tracker monitors architectural drift, dead code, dependency versions, and other technical debt items.

## 🚨 Active Technical Debt Items

| ID | Description | Severity | Target Resolution Date | Status |
| :--- | :--- | :--- | :--- | :--- |
| TD-001 | Initial structure setup and validation | Low | | In Progress |

## 🗃️ Resolved Technical Debt
*(Once items are resolved, move them here with resolution details)*
EOF
)
create_file_if_not_exist "${TARGET_DIR}/docs/exec-plans/tech-debt-tracker.md" "$tech_debt_tracker"

# Create docs/DESIGN.md
design_md=$(cat << 'EOF'
# System Design & Architecture Guidelines

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
EOF
)
create_file_if_not_exist "${TARGET_DIR}/docs/DESIGN.md" "$design_md"

# Create docs/QUALITY_SCORE.md
quality_score_md=$(cat << 'EOF'
# Code Quality Standards (Quality Score)

We score codebase domains and layers based on their adherence to code conventions, test coverage, and static analysis results.

## 🎯 Quality Scoring Rubric
* **Grade A (Excellent)**: Test coverage > 90%, zero linter warnings, zero code duplication, clear documentation.
* **Grade B (Good)**: Test coverage > 80%, zero linter errors (warnings allowed), documented APIs.
* **Grade C (Needs Improvement)**: Test coverage < 80%, contains linter errors/warnings. Needs technical debt resolution.

## 📏 General Quality Rules
1. **Lint Rules**: Linter checks must pass prior to merge. No warning-suppressing flags without explicit comments.
2. **Coverage Goal**: New code must have at least **85% unit test coverage**.
3. **Format**: All files must be formatted using the project's formatting tools.
EOF
)
create_file_if_not_exist "${TARGET_DIR}/docs/QUALITY_SCORE.md" "$quality_score_md"

# Create docs/RELIABILITY.md
reliability_md=$(cat << 'EOF'
# System Reliability & Fault Tolerance Guidelines

This document outlines policies for retry mechanisms, circuit breakers, timeout limits, and exception handling strategies.

## 1. Timeout Policy
* All outbound HTTP/gRPC requests must have explicit timeouts configured (default is **5000ms**).
* Database queries should have query timeouts to prevent blocking connection pools.

## 2. Retry with Exponential Backoff
* Network operations should implement retry with exponential backoff and jitter to mitigate transient errors.
* Maximum retry count should be capped (typically 3 times).

## 3. Circuit Breaker Pattern
* Implement circuit breakers for flaky external API integrations.
EOF
)
create_file_if_not_exist "${TARGET_DIR}/docs/RELIABILITY.md" "$reliability_md"

# Create docs/SECURITY.md
security_md=$(cat << 'EOF'
# Security & Data Protection Policy

This document defines core security practices, including key management, input validation, authentication, and authorization rules.

## 1. Secrets Management
* **Zero Hardcoded Secrets**: Absolutely no API keys, tokens, passwords, or connection strings in git.
* Use environment variables or a secure vault to inject secrets.

## 2. Input Validation & Sanitization
* All user inputs must be validated at API boundaries.
* Sanitize all inputs before saving to the database to prevent SQL Injection and XSS.
EOF
)
create_file_if_not_exist "${TARGET_DIR}/docs/SECURITY.md" "$security_md"

# Create .gitkeep files for empty folders
gitkeep_content="# Keep directory in git"
create_file_if_not_exist "${TARGET_DIR}/docs/exec-plans/active/.gitkeep" "$gitkeep_content"
create_file_if_not_exist "${TARGET_DIR}/docs/exec-plans/completed/.gitkeep" "$gitkeep_content"
create_file_if_not_exist "${TARGET_DIR}/docs/product-specs/.gitkeep" "$gitkeep_content"
create_file_if_not_exist "${TARGET_DIR}/docs/references/.gitkeep" "$gitkeep_content"
create_file_if_not_exist "${TARGET_DIR}/docs/generated/.gitkeep" "$gitkeep_content"
create_file_if_not_exist "${TARGET_DIR}/tests/.gitkeep" "$gitkeep_content"

echo "=== Standardized Project Structure Setup Completed for: $PROJECT_NAME ==="
