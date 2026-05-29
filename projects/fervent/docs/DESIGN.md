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
* Inward pointing dependencies prevent circular dependencies and simplify unit testing.

## 4. UI & Frontend Design System
* To maintain visual and component consistency across projects, you must refer to and utilize the shared custom design system located at [../design-system](../design-system).
* Do not define ad-hoc design patterns or style tokens (colors, typography, spacing) without checking the shared design system first.
