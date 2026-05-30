# System Reliability & Fault Tolerance Guidelines

This document outlines policies for retry mechanisms, circuit breakers, timeout limits, and exception handling strategies.

## 1. Timeout Policy
* All outbound HTTP/gRPC requests must have explicit timeouts configured (default is **5000ms**).
* Database queries should have query timeouts to prevent blocking connection pools.

## 2. Retry with Exponential Backoff
* Network operations should implement retry with exponential backoff and jitter to mitigate transient errors.
* Maximum retry count should be capped (typically 3 times) to avoid compounding system load.

## 3. Circuit Breaker Pattern
* Implement circuit breakers for flaky external API integrations.
* Fail fast when the external service is down, returning fallback data if appropriate.
