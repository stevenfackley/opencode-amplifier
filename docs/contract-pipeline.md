# Contract pipeline (PROPOSAL — needs approval before wiring live)

> Status: **design + templates only.** Wiring this to live internal services needs sign-off
> (access to the shared services' OpenAPI, a CI runner that can reach them). The examples here are
> ready to hand to whoever approves it.

## The problem it kills
You consume another team's .NET backend. When they change a contract, your Swift app breaks
**silently** — you find out at runtime, or a user does. That's the single biggest structural risk
of the cross-team setup.

## The fix: contract as the source of truth, drift caught in CI
1. **Publish/fetch the contract.** The shared .NET services expose OpenAPI (Swashbuckle/NSwag).
   Pull the spec as a versioned artifact.
2. **Generate the Swift client** from the spec (Apple's swift-openapi-generator) — never
   hand-transcribe. The generated types are the wire layer; your anti-corruption layer
   (`swift-api-client`) maps them to your domain.
3. **Contract test in CI.** A job regenerates from the latest published spec and fails if the
   generated surface diverges from what your app expects — so drift is a red build, not a prod bug.
4. **Optional: auto-PR** the regenerated client when the contract changes, for review.

## What this changes
- Their breaking change → caught in CI the same day, as a diff you can read.
- New endpoints/fields → a generated update, not manual typing.
- Your domain stays insulated behind the ACL regardless of their churn.

## What to request approval for
- Read access to the shared services' OpenAPI endpoint(s) (or a published spec artifact).
- A CI runner allowed to reach them (or a manual spec-drop into the repo if network is restricted).
- Agreement with the other team on a contract versioning scheme (semver; additive-first; deprecate
  before remove).

## Templates in this repo
- `examples/ci/contract-sync.example.yml` — GitHub Actions: fetch spec → generate → contract-test.
- `examples/openapi-generator-config.example.yaml` — swift-openapi-generator config.

## If the network is locked down
Even without live fetch, you get most of the value: commit the spec file manually on each agreed
update, and keep the generate + contract-test steps in CI. The drift gate still works against the
committed spec.
