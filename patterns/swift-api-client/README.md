---
id: swift-api-client
language: swift
version_bounds: "Swift 5.5+ (async/await)"
last_validated: 2026-06-21
success_rate: null
applicability:
  - "a Swift app consumes a REST API / another team's backend contract"
  - "you want the app decoupled from the wire/DTO shape (especially a cross-team contract)"
forbidden_contexts:
  - "a single throwaway request with no domain modeling"
  - "an official generated SDK already exists (use it, then add the ACL mapping on top)"
failure_modes:
  - "weak models use the wire DTO directly throughout the app -> couples app to the backend"
  - "no typed errors; force-unwrapping JSON decoding; ignoring non-2xx status"
  - "hand-transcribing DTOs that then drift from the contract"
topology: "networking / data layer (mobile)"
---

# Pattern: swift-api-client

**Language / stack:** Swift 5.5+ (async/await, Codable, URLSession)

## When to use
A Swift mobile app talking to a backend you don't own — e.g. another team's .NET service. This is
the concrete form of `consuming-shared-libraries`: the contract is the dependency, and an
**anti-corruption layer** keeps their wire shape out of your app's core.

## When NOT to use
- A one-off request with no real domain.
- When an official generated client exists — use it, but still map into your domain via an ACL.

## Key decisions (the part the model can't derive)
- **Two type layers.** A `WidgetDTO` that mirrors the wire contract EXACTLY (dumb, matches their
  JSON), and a `Widget` domain type designed for YOUR app. They are not the same type.
- **One ACL crossing.** `DTO.toDomain()` is the single place their shape meets yours — their
  rename/reshape becomes a one-line fix instead of an app-wide refactor.
- **Typed errors**, not `throws` of anonymous errors — callers branch on `.http(code)` vs
  `.decoding` vs `.transport`.
- **Status + decode handled at the boundary**: check `2xx`, decode safely (never force-unwrap),
  return domain types only.
- If you have an OpenAPI spec, **generate** the DTO layer (swift-openapi-generator) and keep the
  ACL on top — don't hand-transcribe.

## Gotchas
- Snake_case wire fields: either name DTO fields to match, or set
  `decoder.keyDecodingStrategy = .convertFromSnakeCase` / use `CodingKeys`.
- Treat the backend as untrusted: tolerate missing optionals, unexpected extra fields.

## The example
See `APIClient.swift`.
