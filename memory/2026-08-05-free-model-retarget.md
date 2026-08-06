# 2026-08-05 — kit retargeted to free open-weights providers

- Providers are now `ollama` (local, $0/unlimited: reviewer-cheap primary + /commit) and
  `openrouter` (`:free` open-weights: everything else). All refs provider-prefixed.
- The `:free` roster CHURNS monthly (free DeepSeek/Qwen/Kimi/GLM/Llama all delisted in 2026).
  A dead slug is caught only by `node tools/doctor.mjs` WITHOUT `--offline` — the static
  catalog check cannot see it. Swap targets: another live `:free`, `openrouter/openrouter/free`,
  or the pennies tier commented in `opencode.jsonc`. New slugs must be added to the provider's
  `models` map before pinning.
- OpenRouter free-model caps: 20 req/min; 50 req/day keyless-tier, 1,000/day once the account
  has ≥$10 lifetime purchase history.
- Decorrelation invariant (checked in review, keep it when re-pinning): reviewer and
  reviewer-cheap must stay cross-family on BOTH primary and fallback
  (currently NVIDIA→inclusionAI vs Qwen-local→Google).
- Local serving on macOS: dedicated LaunchAgent, NOT `brew services` (restart resets
  OLLAMA_HOST); external-volume stores need a Full Disk Access grant for the ollama binary
  (TCC blocks launchd, not SSH). Details: `docs/local-models.md` §3.
