# Public open-model retarget + local hosting — design

**Date:** 2026-08-05
**Status:** Approved
**Goal:** Make the kit usable by the general public on free, open-weights models only —
no corp-proxy references — and stand up the owner's Mac mini (M4/16GB + 1TB external SSD)
as the local-model tier, properly.

## Context / current state

- All 13 agents + `opencode.jsonc` route through a single work proxy (`lmproxy`) with a
  mixed roster (Claude, GPT-5.1, Nemotron, Mistral…). 24 files carry work-specific framing.
- Mac mini (verified over SSH, `steve@10.0.0.49`): M4, 16GB, macOS 26.5.2. Ollama **0.24.0**
  via brew services, already LAN-exposed (`OLLAMA_HOST=0.0.0.0:11434`), flash-attention +
  q8_0 KV enabled. 12 stale models (~59GB, pulled 2026-05-27) on the 82%-full internal
  500GB disk. **The 1TB external SSD (disk6) is attached but uninitialized.** Hostname is
  garbage (`amazon-4ec36ed51`). Tailscale installed, not running.
- Research (2026-08-05, live-verified): OpenRouter's `:free` roster churned hard in 2026 —
  free DeepSeek/Qwen/Kimi/GLM/Llama/Mistral are gone. 14 `:free` models remain, dominated
  by NVIDIA Nemotron 3 (ultra-550b @ 1M ctx — the only free 1M model), poolside laguna
  (coding), Cohere north-mini-code, Gemma 4, ling-3.0-flash, gpt-oss-20b. Limits: 20 req/min;
  50 req/day keyless-tier, **1,000/day after a one-time $10 credit purchase**.
- 16GB Apple Silicon local picks (verified on ollama.com): `qwen3.5:9b` (6.6GB, reasoner),
  `ornith:9b` (5.6GB, MIT agentic coder, Jul 2026), `qwen3.5:4b` (3.4GB, mechanical),
  `qwen3-embedding:0.6b` (639MB), `gemma4:12b-it-qat` (7.2GB, family diversity). No small
  qwen3-coder exists; devstral-small-2:24b (15GB) does not fit 16GB. Ollama ≥0.32.x is
  **required** for the 2026 model families → upgrade mandatory.

## Decisions (user-approved)

1. **Strategy A** — two open providers: `ollama` (localhost default) + `openrouter`
   (`:free` open-weights big models). Personal LAN wiring lives only in the overlay example.
2. **Mac mini:** format the uninitialized 1TB SSD (APFS, volume "Models"), relocate the
   Ollama model store to it, prune all 12 stale models, pull the 5-model roster above,
   rename host to `macmini` (→ `macmini.local`), manage over SSH.
3. Free-tier reality documented honestly; $10 unlock recommended; chatty tiers run local.

## Design

### 1. Providers (`opencode.jsonc`)

- `ollama`: `@ai-sdk/openai-compatible`, `baseURL http://localhost:11434/v1`, no key.
- `openrouter`: `@ai-sdk/openai-compatible`, `baseURL https://openrouter.ai/api/v1`,
  `{env:OPENROUTER_API_KEY}`.
- Model refs become provider-prefixed (`ollama/qwen3.5:9b`,
  `openrouter/nvidia/nemotron-3-ultra-550b-a55b:free`).
- Churn guard in comments: `openrouter/free` auto-router as emergency stand-in + a
  "pennies tier" menu (`qwen/qwen3.7-flash` $0.03/M, `z-ai/glm-4.7-flash`,
  `deepseek/deepseek-v4-flash-0731`) for when a `:free` slug delists.
- Default (Build/executor) model: `openrouter/poolside/laguna-s-2.1:free`.

### 2. Agent re-tiering (≥4 decorrelated families)

| Agent | Model | Fallback |
|---|---|---|
| architect | `openrouter/nvidia/nemotron-3-ultra-550b-a55b:free` | `openrouter/nvidia/nemotron-3-super-120b-a12b:free` |
| debugger | `openrouter/nvidia/nemotron-3-ultra-550b-a55b:free` | `openrouter/nvidia/nemotron-3-super-120b-a12b:free` |
| judge | `openrouter/nvidia/nemotron-3-ultra-550b-a55b:free` | `openrouter/nvidia/nemotron-3-super-120b-a12b:free` |
| executor (default `model`) | `openrouter/poolside/laguna-s-2.1:free` | `ollama/ornith:9b` |
| tester | `openrouter/cohere/north-mini-code:free` | `ollama/qwen3.5:9b` |
| reviewer | `openrouter/nvidia/nemotron-3-super-120b-a12b:free` | `openrouter/google/gemma-4-31b-it:free` |
| reviewer-cheap | `ollama/qwen3.5:9b` | `ollama/gemma4:12b-it-qat` |
| mapper | `openrouter/nvidia/nemotron-3-ultra-550b-a55b:free` (only free 1M ctx) | `openrouter/nvidia/nemotron-3-super-120b-a12b:free` |
| proposer-b | `openrouter/inclusionai/ling-3.0-flash:free` | `openrouter/openai/gpt-oss-20b:free` |
| proposer-c | `openrouter/google/gemma-4-31b-it:free` | `openrouter/google/gemma-4-26b-a4b-it:free` |
| synthesizer | `openrouter/nvidia/nemotron-3-super-120b-a12b:free` | `openrouter/nvidia/nemotron-3-ultra-550b-a55b:free` |
| refuter | `openrouter/openai/gpt-oss-20b:free` | `openrouter/inclusionai/ling-3.0-flash:free` |
| designer | `openrouter/google/gemma-4-31b-it:free` | `openrouter/inclusionai/ling-3.0-flash:free` |
| pr-reviewer | `openrouter/google/gemma-4-31b-it:free` | `openrouter/inclusionai/ling-3.0-flash:free` |
| mechanical (`/commit`) | `ollama/qwen3.5:4b` | `ollama/qwen3.5:9b` |

Rationale: high-volume roles (executor fallback, mechanical, reviewer-cheap) run local so
the 1,000/day OpenRouter pool feeds bursty council fan-outs. Families across the review
gate stay decorrelated: poolside executor / Cohere tester / NVIDIA reviewer / Qwen(local)
reviewer-cheap / Google + inclusionAI + OpenAI in the council.

### 3. Docs scrub (24 files)

Remove all Lockheed/proxy/corp framing (`README`, `USAGE`, `ONBOARDING`, `CONTRIBUTING`,
`CAPABILITY-PARITY`, `PATTERNS`, eval docs, `docs/contract-pipeline.md`, plugin comments,
`/setup`, `/capture-pattern`, affected skills/patterns READMEs, CI/openapi examples).
README thesis reframes to "near-frontier results from free open models"; tiering table
replaced with §2. `examples/opencode.overlay.example.jsonc` becomes a **personal LAN
overlay** (`http://macmini.local:11434/v1`, comments on DHCP reservation vs mDNS).

### 4. New `docs/local-models.md` (generic hosting guide)

RAM-tiered menus (16/32/64GB), launchd plist template (env: `OLLAMA_HOST=0.0.0.0`,
`OLLAMA_MODELS` on external volume, `OLLAMA_FLASH_ATTENTION=1`, `OLLAMA_KV_CACHE_TYPE=q8_0`,
single-model residency for 16GB), mDNS addressing, upgrade note (`opt` symlink), security:
Ollama's API is unauthenticated — LAN only, never port-forward; Tailscale for remote.

### 5. Mac mini execution (SSH, ordered)

1. `brew upgrade ollama` → ≥0.32.6 (required for qwen3.5/gemma4/ornith runtimes).
2. Format disk6 → APFS volume "Models" (verified uninitialized; user authorized).
3. Stop service; move `~/.ollama/models` → `/Volumes/Models/ollama`; install dedicated
   LaunchAgent (replaces brew-managed plist, which brew regenerates on restart and would
   clobber hand-edited env); binary via `/opt/homebrew/opt/ollama/bin/ollama` (survives
   upgrades); start; verify `/api/tags` intact.
4. `scutil --set` ComputerName/LocalHostName/HostName → `macmini`; verify `macmini.local`
   resolves from the Windows PC.
5. Prune all 12 stale models (exact `ollama rm` list shown before execution); pull:
   `qwen3.5:9b`, `ornith:9b`, `qwen3.5:4b`, `qwen3-embedding:0.6b`, `gemma4:12b-it-qat`
   (~25GB on the 1TB volume).
6. `pmset` — disable sleep for server duty; note auto-login requirement for the
   LaunchAgent (it is per-user).
7. End-to-end verify from the Windows PC: `curl macmini.local:11434/api/tags` + one real
   generation per pulled model.

### 6. Validation

- `tools/doctor.mjs`: update placeholder regex (drop `PROXY_HOST`), keep live catalog
  round-trip; run `--offline` immediately, live once `OPENROUTER_API_KEY` exists.
- One real completion through each provider; README setup steps rewritten to match.

## Error handling / risks

- **Free-slug churn** (observed monthly): fallback chains + pennies-tier menu + doctor's
  live catalog check make delisting a 1-line fix, not an outage.
- **Rate limiting mid-session:** executor falls back to `ollama/ornith:9b`; council
  commands degrade gracefully via per-agent `fallback:` (council.mjs retry path).
- **External SSD absent at boot:** Ollama starts with empty store → LaunchAgent gains a
  pre-flight that waits for `/Volumes/Models` before exec.
- **LaunchAgent vs logout:** documented; mini keeps auto-login (owner-accepted).

## Testing

Doctor offline+live green; every §2 pin + fallback present in `opencode models`; one real
generation per provider; `/plan → /spec-tests → /verify` smoke on a toy task; mini survives
a reboot with models intact on the external volume.

## Out of scope

Paid-tier defaults, Tailscale enablement, non-Ollama serving stacks (LM Studio/llama.cpp
documented as alternatives only), eval-harness reruns.

## User action items

- Create OpenRouter account + `OPENROUTER_API_KEY`; recommended one-time $10 credit
  purchase (unlocks 1,000 free req/day, lifetime).
