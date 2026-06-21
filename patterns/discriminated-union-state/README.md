---
id: discriminated-union-state
language: typescript
version_bounds: "TS 4.x+"
last_validated: 2026-06-21
success_rate: null
applicability:
  - "a component/process has several MUTUALLY-EXCLUSIVE states"
  - "states are currently modeled with separate boolean flags (isLoading, hasError, ...)"
forbidden_contexts:
  - "independent flags that CAN co-occur (isEditable + isSelected) — that's any-of-N, not one-of-N"
  - "a single boolean that really is just a boolean"
failure_modes:
  - "adding a catch-all default branch that defeats the `never` exhaustiveness check"
  - "using a non-literal discriminant (string) so narrowing doesn't kick in"
topology: "UI state / reducer / view-model layer"
---

# Pattern: discriminated-union-state

**Language / stack:** TypeScript (4.x+)

## When to use
A component or process has several **mutually-exclusive** states (loading / loaded / error /
empty) and you're modeling them with separate boolean flags (`isLoading`, `hasError`,
`data?`). Boolean soup lets impossible states exist (`isLoading && hasError`) and the compiler
can't help you. Use a tagged union to make illegal states unrepresentable.

## When NOT to use
- Genuinely independent flags that *can* co-occur (e.g. `isEditable` and `isSelected`). Unions
  are for *one-of-N*, not *any-of-N*.
- A single boolean that really is just a boolean.

## Key decisions (the part the model can't derive)
- **One discriminant field (`status`) drives everything.** Each variant carries *only* the
  data valid in that state — `error` only exists on the error variant, `data` only on the
  loaded variant. You literally cannot read `data` while loading; it's not on the type.
- **Exhaustive `switch` + `never` guard.** The `default` branch assigns the value to a
  `never`-typed variable. If someone later adds a variant and forgets to handle it, the build
  **fails** — the compiler becomes your checklist. This is the whole payoff.
- Model states as data first, then render — don't scatter the state logic across JSX/markup.

## Gotchas
- The `never` trick only works if you don't have a catch-all that swallows new cases. Keep the
  `default` branch as the exhaustiveness check, not a fallback renderer.
- Narrowing requires the discriminant to be a literal type (`"loading"`), not `string`.

## The example
See `state.ts` — a fetch-state union with an exhaustive reducer/renderer and the `never`
exhaustiveness guard that turns "I forgot a case" into a compile error.
