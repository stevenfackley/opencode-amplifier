---
name: consuming-shared-libraries
description: Use when your (greenfield) project must depend on another team's shared library or API — especially across stacks (e.g. a Swift mobile team consuming a .NET/Angular team's backend). Consume the contract not their internals, isolate their model behind an anti-corruption layer, pin versions, never fork.
---

# Consuming Another Team's Shared Libraries

You don't own this dependency and can't change it on your schedule. Goal: benefit from it without
letting its shape, churn, or stack leak into your clean greenfield code.

## Cross-stack: the shared surface is the CONTRACT, not the assembly
- Swift/mobile cannot link a .NET library. The real integration point is the **API contract**
  (OpenAPI/Swagger, gRPC/proto, or published DTO schemas). Treat the *contract* as the dependency.
- **Generate** your client/models from the contract (swift-openapi-generator, OpenAPI Generator,
  protoc) — don't hand-transcribe their DTOs; hand copies drift silently. Regenerate on version bump.

## Anti-corruption layer (ACL) — the most important habit
- Map their DTOs into YOUR domain types at the boundary; never let a wire/generated type flow into
  your app's core. One mapping function per type (`toDomain()`).
- Payoff: their rename/reshape hits one file, not your whole app — and your domain stays designed
  for mobile, not for their backend's convenience.

## Version & change discipline
- **Pin** the contract/package version explicitly; upgrade deliberately, never float.
- Keep the compatibility shim in the ACL so a breaking change on their side is a one-file fix.
- **Never fork** their library to "fix" it locally — you'll diverge and own their bugs forever.
  File the issue; shim around it in your ACL meanwhile.

## Contract testing (catch drift in CI, not prod)
- Add a contract test that fails when their published schema diverges from what your generated
  client expects.
- Treat their service as untrusted at the boundary: validate, tolerate extra/missing fields,
  version your expectations.

## Collaboration up front
- Agree on the contract format + a versioning scheme (semver on the contract; additive changes
  preferred; deprecate before remove).
- If you must contribute C# to their library, respect its compile floor — see
  `dotnet-standard-2.0-compat`.
