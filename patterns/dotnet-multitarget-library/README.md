---
id: dotnet-multitarget-library
language: csharp
version_bounds: ".NET SDK that can build netstandard2.0 + net10.0"
last_validated: 2026-06-21
success_rate: null
applicability:
  - "authoring or contributing to a shared library that must support old and new runtimes"
  - "the lib multi-targets netstandard2.0 + net10.0 (max reach + modern features)"
forbidden_contexts:
  - "an app/service that only ever runs on one modern runtime (just target net10.0)"
  - "a mobile/Swift project (this is for the .NET side of the boundary)"
failure_modes:
  - "weak models put net10-only APIs (DateOnly, generic math) in the shared path -> ns2.0 build breaks"
  - "using record/init/required on ns2.0 without polyfills"
  - "forgetting to gate modern fast-paths behind #if NET"
topology: "shared .NET library (the cross-team dependency)"
---

# Pattern: dotnet-multitarget-library

**Language / stack:** C# library multi-targeting `netstandard2.0` + `net10.0`

## When to use
Authoring or contributing to a shared library that other teams consume on a mix of runtimes —
the recommended shape per Microsoft: target `netstandard2.0` for maximum reach AND `net10.0` for
modern features. The ns2.0 path is the compile floor (see `dotnet-standard-2.0-compat`).

## When NOT to use
- A service that only runs on one modern runtime → just target `net10.0`.
- The mobile/Swift side — this is the .NET side of the boundary.

## Key decisions (the part the model can't derive)
- **ns2.0 is the floor:** any code NOT inside an `#if NET` block must compile for ns2.0. Keep
  net10-only APIs (`DateOnly`, generic math, etc.) behind `#if NET8_0_OR_GREATER`.
- **Polyfill modern C# on the floor:** add `PolySharp` (source-only, no runtime dep) so `record`,
  `init`, and `required` compile on ns2.0.
- **Package, don't assume:** on ns2.0, `System.Text.Json`, `System.Memory`, and
  `Microsoft.Bcl.AsyncInterfaces` come from NuGet — reference them explicitly.
- **`<Nullable>enable</Nullable>`** for both TFMs — annotations are free safety.

## Gotchas
- Test BOTH targets in CI (`dotnet build` builds all TFMs; make sure tests run against ns2.0 too).
- `#if` fast-paths must be behaviorally identical to the floor path — divergence is a latent bug.

## The example
See `Library.csproj` and `WidgetFormatter.cs`.
