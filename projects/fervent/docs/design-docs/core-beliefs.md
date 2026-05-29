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
