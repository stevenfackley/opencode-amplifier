---
id: result-railway
language: csharp
version_bounds: "C# 9+"
last_validated: 2026-06-21
success_rate: null
applicability:
  - "a flow has multiple EXPECTED failure modes (validation, not-found, conflict)"
  - "code currently uses exceptions for control flow or nested null/if ladders"
forbidden_contexts:
  - "truly exceptional, unrecoverable conditions (let those throw)"
  - "trivial single-step operations where a nullable return is already clear"
failure_modes:
  - "over-applied to trivial CRUD, adding Bind/Map ceremony for no benefit"
  - "mixing paradigms: a method both returns Result AND throws for expected failures"
topology: "service / domain layer"
---

# Pattern: result-railway

**Language / stack:** C# (works in any version with generics; uses C# 9+ records)

## When to use
A flow has several **expected** failure modes (validation failed, not found, conflict, etc.)
and you find yourself either throwing exceptions for control flow or writing deeply nested
`if (x != null) { if (y.IsValid) { … } }` ladders. Use this when failure is a normal outcome,
not an exceptional one.

## When NOT to use
- Truly exceptional, unrecoverable conditions (out of memory, programmer bugs) — let those
  throw.
- Trivial single-step operations where a nullable return is already clear.

## Key decisions (the part the model can't derive)
- **Errors are values, not exceptions.** A `Result<T,E>` carries either a success value or a
  typed error. This makes every failure path visible in the signature and impossible to
  forget — the compiler won't let you read `.Value` without handling failure via `Match`.
- **`Bind` chains fallible steps; `Map` transforms success.** `Bind` is for the next operation
  that *can also fail* (returns a `Result`); `Map` is for a pure transform that *can't*. Using
  the right one keeps the "railway" intact — once you're on the error track you stay there and
  skip the rest, with no null checks between steps.
- **`Match` is the only way out.** Forcing callers through `Match(onOk, onErr)` means there is
  no unguarded happy-path access — the single biggest source of null-ref bugs disappears.
- A typed error (`record Error(string Code, string Message)`) beats a bare string: callers can
  branch on `Code` (map to HTTP status, retry, etc.) without string-matching.

## Gotchas
- Don't mix paradigms: if a method returns `Result`, it should not also throw for expected
  failures. Pick one per layer.
- `Bind` short-circuits — side effects after the first error won't run. That's the point, but
  it surprises people expecting every line to execute.

## The example
See `Result.cs` — a minimal `Result<T,E>` with `Bind`, `Map`, `Match`, and a worked usage
showing a 3-step pipeline that short-circuits on the first failure.
