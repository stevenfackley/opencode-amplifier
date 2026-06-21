---
name: dotnet-standard-2.0-compat
description: Use when writing or contributing to .NET code that must target .NET Standard 2.0 — often multi-targeted with .NET 10 in shared libraries. Lists what is NOT available on the ns2.0 floor so you don't put .NET 10-only APIs in code that must compile for both.
---

# .NET Standard 2.0 Compatibility Guardrail

Shared libraries commonly multi-target `netstandard2.0;net10.0` — ns2.0 for reach (.NET Framework
4.6.1+, Xamarin, Unity, older runtimes), net10.0 for modern features. **Code in the shared
(non-`#if`'d) path must compile for the ns2.0 floor.** A constrained model will reach for
net10-only APIs and break the ns2.0 build.

## Detect first
Read the `.csproj`. `<TargetFrameworks>netstandard2.0;net10.0</TargetFrameworks>` = dual floor.
Anything outside an `#if NET` block must be ns2.0-safe.

## NOT available on ns2.0 (net-only) — don't use in shared code
- `DateOnly` / `TimeOnly` (net6+), `Half` (net5+), `Int128`/`UInt128`, generic math + static
  abstract interface members (net7+).
- Default interface methods (ns2.1 / .NET Core 3+ runtime feature).
- `required` members (C# 11) and `record`/`init` accessors — compile on ns2.0 ONLY with polyfill
  attributes (`IsExternalInit`, `RequiredMemberAttribute`, `CompilerFeatureRequiredAttribute`).
- `[CallerArgumentExpression]` and some nullable attributes — need polyfills.

## In-box on net, but NEEDS A NuGet PACKAGE on ns2.0
- `System.Text.Json` → add the `System.Text.Json` package.
- `Span<T>` / `Memory<T>` → `System.Memory`.
- `IAsyncEnumerable<T>` / `IAsyncDisposable` / `await foreach` → `Microsoft.Bcl.AsyncInterfaces`.
- `ValueTask` extras → `System.Threading.Tasks.Extensions`.

## Safe on ns2.0
- `async`/`await`, `Task<T>`, LINQ, generics, most `System.*` collections/strings/IO, `HttpClient`.
- Compiler-level C# features: nullable reference type ANNOTATIONS (`<Nullable>enable</Nullable>` +
  `LangVersion`), pattern matching, tuples, local functions, file-scoped namespaces.

## Patterns that work
- **Polyfills:** add `PolySharp` (source-only) or a tiny `IsExternalInit`/`RequiredMember` shim so
  you can use `record`/`init`/`required` while still targeting ns2.0.
- **Gate modern code:** `#if NET8_0_OR_GREATER … #else … #endif` for net-only fast paths.
- Turn on `<Nullable>enable</Nullable>` even on the ns2.0 floor — annotations cost nothing and
  catch bugs.

## Verify, don't guess
Unsure if an API exists on ns2.0? Check the API reference at learn.microsoft.com/dotnet/api with
the version selector set to **netstandard-2.0**.
