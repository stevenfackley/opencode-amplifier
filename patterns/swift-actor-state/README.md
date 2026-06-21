---
id: swift-actor-state
language: swift
version_bounds: "Swift 5.5+ (actors, async/await)"
last_validated: 2026-06-21
success_rate: null
applicability:
  - "shared mutable state accessed concurrently from multiple tasks (a cache, a counter, a pool)"
  - "you want the compiler to guarantee no data races"
forbidden_contexts:
  - "state confined to one task/thread (no sharing -> no actor needed)"
  - "UI state (use @MainActor / the main actor, not a custom actor)"
failure_modes:
  - "weak models reach for NSLock / a serial DispatchQueue and get it subtly wrong"
  - "forgetting that actor access is async (`await`) from outside"
  - "not coalescing concurrent loads -> duplicate work / thundering herd"
topology: "concurrency / infrastructure layer"
---

# Pattern: swift-actor-state

**Language / stack:** Swift 5.5+ (structured concurrency)

## When to use
Mutable state touched by multiple concurrent tasks — a cache, a connection pool, a counter. An
`actor` serializes access so races are impossible *by construction*, and the compiler enforces
it. This replaces hand-rolled `NSLock`/serial-`DispatchQueue` synchronization.

## When NOT to use
- State that lives on a single task/thread (no sharing → no actor).
- UI state — use the main actor (`@MainActor`), not a custom actor.

## Key decisions (the part the model can't derive)
- **The actor owns the state; all mutation is actor-isolated.** External callers `await` access,
  and the compiler prevents touching the state off-actor — no manual locks.
- **Request coalescing:** stash the in-flight `Task` per key so concurrent callers for the same
  key `await` the *same* load instead of each starting their own (avoids duplicate work /
  thundering herd). This is the non-obvious part weak models miss.
- **`@Sendable` closures / `Sendable` types** cross the actor boundary safely.

## Gotchas
- Every external call is `async` — design call sites for it.
- `nonisolated` is for members that don't touch mutable state (e.g. `let` config) so they can be
  read synchronously.
- Don't hop to the actor in a tight loop; batch where you can (actor hops have cost).

## The example
See `RequestCache.swift`.
