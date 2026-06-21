---
id: retry-with-backoff
language: typescript
version_bounds: "TS 4.x+ / any JS runtime with Promises"
last_validated: 2026-06-21
success_rate: null
applicability:
  - "calling a flaky remote dependency (network, rate-limited API, transient DB error)"
  - "the operation is idempotent OR carries an idempotency key"
forbidden_contexts:
  - "non-idempotent writes without an idempotency key (retries can double-apply)"
  - "errors that are deterministic (400/validation) — retrying just wastes time"
failure_modes:
  - "weak models write fixed-delay retries with no jitter -> thundering herd on recovery"
  - "retrying every error including non-retryable ones (auth, validation)"
  - "no ceiling on attempts or no circuit breaker -> hammering a dead dependency"
topology: "infrastructure / client-wrapper layer"
---

# Pattern: retry-with-backoff

**Language / stack:** TypeScript (portable to any Promise-based runtime)

## When to use
Wrapping a call to something that fails *transiently* — a network hop, a rate-limited API, a
momentary DB blip. Combine the retry (handle the blip) with a circuit breaker (stop calling a
dependency that's actually down).

## When NOT to use
- Non-idempotent writes without an idempotency key — a retry can apply the side effect twice.
- Deterministic failures (validation, auth) — they'll fail identically every attempt.

## Key decisions (the part the model can't derive)
- **Full jitter**, not fixed or pure-exponential delay. Backoff caps the window; jitter spreads
  retries randomly within it so a fleet doesn't synchronize and stampede the dependency the
  instant it recovers.
- **A `retryable` predicate** decides *which* errors are worth retrying. Default-retry-everything
  is a bug: it retries 400s and auth failures forever.
- **A hard attempt ceiling** — unbounded retries are an outage amplifier.
- **A circuit breaker** is a different control than retry: retry handles one call's blip; the
  breaker stops *all* calls after repeated failures and probes recovery after a cooldown.

## Gotchas
- The breaker must reset its failure count on success, or it never recovers.
- Tune `threshold`/`cooldown` to the dependency; too sensitive trips on normal variance.

## The example
See `retry.ts`.
