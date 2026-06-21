# PATTERNS.md — golden-example index

Read this before designing anything non-trivial. Each entry is a minimal, self-contained,
**generic** worked example of a pattern a constrained model tends not to reach for on its own.
Pull one into context with `/pattern <name>` and **adapt** it rather than inventing.

> Keep every pattern generic and free of employer-derived code/data. That is what makes this
> repo legitimately public/MIT and import-safe.

## Retrieve by FIT, not by similarity

The council's hardest critique: embedding-distance retrieval picks superficially-similar
patterns that are wrong to adapt (a weak model will grab a complex CQRS example for a simple
CRUD task and mangle it). So every pattern carries **applicability predicates** and
**forbidden contexts** in its frontmatter. Choose a pattern only when the predicates match —
not because it "looks close."

Rank candidates by: (1) applicability-predicate match, (2) language + version-bounds match,
(3) repo topology match — *then* similarity. Skip any pattern whose `forbidden_contexts` fit
the task. **Freshness rule:** if `last_validated` is stale relative to the library version in
use, treat the pattern as a hint to verify, not gospel — re-validate it (offline, strong model)
before relying on it.

## Pattern frontmatter schema (in each `patterns/<name>/README.md`)
```yaml
id: <name>
language: <csharp|typescript|python|...>
version_bounds: "<e.g. C# 9+ / TS 4.x+>"
last_validated: <YYYY-MM-DD>
success_rate: <null until measured by the eval harness>
applicability:        # pick this pattern when these are true
  - "<predicate>"
forbidden_contexts:   # do NOT use it when these are true
  - "<anti-predicate>"
failure_modes:        # how adapting it tends to go wrong
  - "<failure>"
topology: "<where it lives, e.g. service/domain layer>"
```

## Index

| Name | Lang | Use when (applicability) | Avoid when | Validated |
|---|---|---|---|---|
| `result-railway` | C# | Many *expected* failure modes; you're reaching for exceptions or nested null checks | Truly exceptional errors; trivial one-step ops | 2026-06-21 |
| `discriminated-union-state` | TS | Several mutually-exclusive states modeled with boolean flags | Independent flags that can co-occur | 2026-06-21 |
| `dotnet-minimal-api-slice` | C# | Adding an endpoint to a minimal-API app; want feature colocated | Existing MVC controllers; multi-aggregate transactions | 2026-06-21 |
| `retry-with-backoff` | TS | Calling a flaky/idempotent remote dependency | Non-idempotent writes w/o idempotency key; deterministic errors | 2026-06-21 |
| `python-typed-settings` | Py | App reads config from env/.env; want fail-fast validation | One-off scripts; vault-managed secrets | 2026-06-21 |
| `maui-mvvm-toolkit` | C# | MAUI ViewModel binding to async data w/ loading/error state | Static pages; non-MAUI .NET | 2026-06-21 |
| `maui-di-services` | C# | Wiring MAUI services/VMs/pages via constructor injection | Non-MAUI; trivial app w/o services | 2026-06-21 |
| `swift-observable-viewmodel` | Swift | SwiftUI model w/ async load + state, iOS 17+ | Below iOS 17; view-local state only | 2026-06-21 |
| `swift-actor-state` | Swift | Shared mutable state across concurrent tasks, race-free | Single-task state; UI state | 2026-06-21 |
| `design-tokens` | CSS | Starting a UI; want a cohesive, tunable, non-generic aesthetic | One-off page; component-lib tokens already set | 2026-06-21 |
| `swift-api-client` | Swift | Swift app consuming a REST/contract from another team's backend | Throwaway call; official SDK exists | 2026-06-21 |
| `dotnet-multitarget-library` | C# | Shared lib must support old + new runtimes (ns2.0 + net10) | Single-runtime app; the mobile side | 2026-06-21 |
| `angular-feature-anatomy` | TS | Reading an Angular feature to reproduce it on mobile | Building/maintaining Angular itself | 2026-06-21 |

## How to add a pattern
1. Copy `patterns/_TEMPLATE/` to `patterns/<your-name>/`.
2. Fill in the **frontmatter** (applicability/forbidden/failure_modes matter most) and the
   `README.md` body, plus the code file.
3. Keep it minimal — one idea, runnable in isolation, commented at the decision points.
4. Add a row above. Set `last_validated` to today; the eval harness fills `success_rate`.
