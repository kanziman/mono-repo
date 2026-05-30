# Security & Data Protection Policy

This document defines core security practices, including key management, input validation, authentication, and authorization rules.

## 1. Secrets Management
* **Zero Hardcoded Secrets**: Absolutely no API keys, tokens, passwords, or connection strings in git.
* Use environment variables or a secure vault to inject secrets.

## 2. Input Validation & Sanitization
* All user inputs must be validated at API boundaries.
* Sanitize all inputs before saving to the database to prevent SQL Injection and XSS attacks.

## 3. Least Privilege
* Processes, subagents, and services should only have the minimum permissions necessary to accomplish their tasks.
