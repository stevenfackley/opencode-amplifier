---
description: Generate a typed Swift API client + anti-corruption mapping from a contract/DTO/endpoint
---

Follow `consuming-shared-libraries` and the `swift-api-client` pattern. From the contract below,
produce:
1. A **wire DTO** that mirrors the contract exactly (CodingKeys or `convertFromSnakeCase` for
   naming) — dumb, matches their JSON.
2. A clean **domain model** designed for the app.
3. A `toDomain()` **anti-corruption mapping** (the one crossing point).
4. **Typed errors** + an async/await URLSession call that checks status and decodes safely
   (no force-unwraps).

If an OpenAPI spec is given, prefer generating the DTO layer (swift-openapi-generator) and put the
ACL on top. Never let wire DTOs leak into the app core.

Contract / endpoint / DTO:
$ARGUMENTS
