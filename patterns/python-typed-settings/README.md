---
id: python-typed-settings
language: python
version_bounds: "Python 3.10+ ; pydantic-settings v2"
last_validated: 2026-06-21
success_rate: null
applicability:
  - "an app/service reads configuration from environment variables or a .env file"
  - "you want fail-fast validation and a single typed config object"
forbidden_contexts:
  - "a tiny script with one or two env vars (os.getenv is fine)"
  - "secrets that must come from a vault/secret-manager, not env (use that client instead)"
failure_modes:
  - "weak models scatter os.getenv() calls across modules with ad-hoc str->int casts"
  - "no validation -> misconfiguration fails deep in a request instead of at startup"
topology: "app config / composition root"
---

# Pattern: python-typed-settings

**Language / stack:** Python 3.10+ with `pydantic-settings` v2

## When to use
Any app/service with more than a couple of config values pulled from env/`.env`. You get one
typed, validated config object, editor autocomplete, and — critically — **fail-fast at startup**
instead of an `int(None)` blowing up deep inside a request handler.

## When NOT to use
- A one-off script with one env var (`os.getenv` is fine).
- Secrets that must come from a real secret manager — load those via that client, not env.

## Key decisions (the part the model can't derive)
- **One `Settings` class is the single source of truth.** No `os.getenv()` sprinkled across the
  codebase; everything reads the typed object.
- **Types and constraints validate on load.** `PostgresDsn` rejects a malformed URL; `gt=0`
  rejects a non-positive timeout — at startup, not at use.
- **A required field with no default** (here `database_url`) means the app refuses to boot
  misconfigured. That's the fail-fast guarantee.
- **`@lru_cache` on the accessor** loads/validates once and gives every module the same instance.
- **`env_prefix`** namespaces your vars (`APP_DATABASE_URL`) so they don't collide.

## Gotchas
- `extra="ignore"` so unrelated env vars don't crash construction; use `"forbid"` if you want
  strictness.
- Don't log the settings object wholesale — it may contain secrets.

## The example
See `settings.py`.
