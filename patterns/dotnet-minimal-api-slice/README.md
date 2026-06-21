---
id: dotnet-minimal-api-slice
language: csharp
version_bounds: ".NET 8+ (minimal APIs; uses C# 12 collection expressions)"
last_validated: 2026-06-21
success_rate: null
applicability:
  - "adding an HTTP endpoint to a .NET minimal-API app"
  - "you want the request, handler, validation, and routing for ONE feature colocated"
forbidden_contexts:
  - "an existing MVC controller-based codebase (match its convention instead)"
  - "complex multi-aggregate transactions that need a real application/service layer"
failure_modes:
  - "weak models default to sprawling layered Controllers/Services across many folders"
  - "leaking persistence concerns into the handler instead of behind an interface"
topology: "web / endpoints layer (one file per feature)"
---

# Pattern: dotnet-minimal-api-slice

**Language / stack:** C# / .NET 8+ minimal APIs

## When to use
Adding an endpoint and you want everything for that feature in one place. Vertical slices keep a
feature's request/validation/handler/route together, so changes are local and the file reads
top-to-bottom — instead of hopping across a Controllers folder, a Services folder, and a DTOs
folder for one change.

## When NOT to use
- A codebase already committed to MVC controllers — consistency beats this pattern.
- Heavy cross-aggregate orchestration that genuinely needs a service/application layer.

## Key decisions (the part the model can't derive)
- **One feature = one static class = one file**, exposing a `MapXxx()` extension. `Program.cs`
  just calls `app.MapCreateWidget()`. Discoverable and self-contained.
- **The handler is a near-pure function**: validate → act → typed `IResult`. No framework noise.
- **Persistence sits behind an interface** (`IWidgetStore`) so the slice stays testable and the
  handler doesn't know about EF/Dapper/etc.
- **Validation returns a problem-details dictionary** via `Results.ValidationProblem` — standard
  shape, no extra library needed for the simple cases.

## Gotchas
- Don't let the slice grow a second responsibility; when it does, that's two slices.
- Keep the `Map` extension's metadata (`.Produces<>`, `.ProducesValidationProblem`) accurate —
  it's your OpenAPI contract.

## The example
See `CreateWidget.cs`.
