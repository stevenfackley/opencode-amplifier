# Eval task — greenfield: rate limiter

**Tier:** greenfield (new code)
**Work type:** greenfield

## Prompt
Implement a token-bucket rate limiter as a single, self-contained module in the project's
primary language. Public API: `allow(key): boolean` and configurable `capacity` and
`refillPerSecond`.

## Acceptance tests (objective success)
- Allows up to `capacity` immediate calls for a key, then denies.
- Refills over time at `refillPerSecond` (a call allowed after waiting the refill interval).
- Separate keys have independent buckets.
- Thread/async-safe for concurrent calls on the same key (if the language has concurrency).

## Scoring notes
- pass@1 = all acceptance tests green on first completion.
- Watch: did it reach for a clean pattern (token bucket) or hand-roll something fragile?
