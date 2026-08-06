# Public Open-Model Retarget + Mac Mini Hosting — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retarget the kit to free open-weights models (Ollama local + OpenRouter `:free`), scrub all work-proxy framing, and stand up the Mac mini (M4/16GB, `steve@10.0.0.49`) as the local tier.

**Architecture:** Two OpenAI-compatible providers replace `lmproxy`; all agent/command `model:` pins become provider-prefixed; chatty tiers run local, bursty council tiers run OpenRouter free. Mac mini gets Ollama ≥0.32, model store on the new 1TB APFS volume, a dedicated LaunchAgent, and hostname `macmini.local`.

**Tech Stack:** OpenCode (jsonc config, agent frontmatter), Node ≥20 (`tools/*.mjs`), Homebrew Ollama on macOS 26, SSH from Windows (key auth already works).

**Spec:** `docs/superpowers/specs/2026-08-05-public-open-models-design.md`
**Branch:** `feat/public-open-models` (already checked out)
**Subagent routing (owner directive):** mechanical file-edit tasks (2, 3, 4, 6, 7) → Sonnet; prose-heavy rewrites (1, 5, 8) → Opus; Mac-mini SSH tasks (9-14) → Opus with verification gates; orchestration/review stays in the main session.

**Verification harness:** `node tools/doctor.mjs --offline` is the test suite for config tasks; `grep` emptiness is the test for scrub tasks; `curl`/`ssh` probes are the tests for mini tasks. Run from repo root `C:\Users\steve\projects\opencode-amplifier` unless stated. SSH prefix for all mini commands: `ssh -o BatchMode=yes steve@10.0.0.49`.

---

### Task 1: Rewrite `opencode.jsonc` providers

**Files:**
- Modify: `opencode.jsonc:1-45` (header comment, provider block, default model; MCP docs URL at L70; comments L56, L67)

- [ ] **Step 1: Replace lines 1–45** (everything through the `"instructions"` intro comment stays as below; `instructions` array and `mcp` block structure are unchanged except noted lines):

```jsonc
{
  // opencode reads opencode.jsonc (comments allowed). Merge into your project's existing config
  // if you have one. Works out of the box on FREE, open-weights models only:
  //   - ollama:      local models (http://localhost:11434 — or a LAN box, see examples/ overlay)
  //   - openrouter:  big open-weights models on OpenRouter's :free tier (needs OPENROUTER_API_KEY;
  //                  free account = 50 req/day, a one-time $10 credit purchase unlocks 1,000/day)
  //
  // Auto-discovered from .opencode/ (no config needed): agent/, command/, skills/, plugins/.
  // OpenCode also auto-discovers .claude/skills/ — so your existing superpowers skills work too.
  "$schema": "https://opencode.ai/config.json",

  // --- 1. Providers (both OpenAI-compatible) -------------------------------------------------
  // Agents reference models PROVIDER-PREFIXED (e.g. `model: ollama/qwen3.5:9b`).
  // ⚠️ The :free roster churns monthly. If a slug 404s: run `node tools/doctor.mjs`, then swap in
  //    a live :free slug, `openrouter/openrouter/free` (auto-router), or a pennies-tier model below.
  "provider": {
    "ollama": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Ollama (local)",
      "options": { "baseURL": "http://localhost:11434/v1" },   // no API key needed
      "models": {
        "qwen3.5:9b":          { "name": "Qwen3.5 9B — local reasoner/reviewer-cheap (262k)" },
        "ornith:9b":           { "name": "Ornith 9B — agentic coder, executor fallback (MIT)" },
        "qwen3.5:4b":          { "name": "Qwen3.5 4B — mechanical (/commit), fast" },
        "gemma4:12b-it-qat":   { "name": "Gemma 4 12B QAT — family-diverse local alt (256k)" }
      }
    },
    "openrouter": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "OpenRouter (free open-weights)",
      "options": {
        "baseURL": "https://openrouter.ai/api/v1",
        "apiKey": "{env:OPENROUTER_API_KEY}"                   // free account: openrouter.ai/keys
      },
      "models": {
        "nvidia/nemotron-3-ultra-550b-a55b:free":  { "name": "Nemotron 3 Ultra 550B — top reasoner, only free 1M ctx" },
        "nvidia/nemotron-3-super-120b-a12b:free":  { "name": "Nemotron 3 Super 120B — reviewer/synthesizer (262k)" },
        "poolside/laguna-s-2.1:free":              { "name": "Laguna-S 2.1 118B — coding agent, executor (262k)" },
        "cohere/north-mini-code:free":             { "name": "North Mini Code 30B — tester (256k)" },
        "google/gemma-4-31b-it:free":              { "name": "Gemma 4 31B — designer/pr-review, multimodal (262k)" },
        "google/gemma-4-26b-a4b-it:free":          { "name": "Gemma 4 26B MoE — fast fallback (262k)" },
        "inclusionai/ling-3.0-flash:free":         { "name": "Ling 3.0 Flash 124B — proposer (262k)" },
        "openai/gpt-oss-20b:free":                 { "name": "gpt-oss 20B — refuter, Apache 2.0 (131k)" }
        // Pennies tier (paid but ~free) if a :free slug delists:
        //   "qwen/qwen3.7-flash"            ($0.03/M in, 1M ctx)
        //   "z-ai/glm-4.7-flash"            ($0.06/M in)
        //   "deepseek/deepseek-v4-flash-0731" ($0.09/M in, 1M ctx)
      }
    }
  },
  "model": "openrouter/poolside/laguna-s-2.1:free",   // Build/executor default; local fallback: ollama/ornith:9b
```

- [ ] **Step 2:** In the `mcp.docs` block, change `"url": "https://INTERNAL_DOCS_MCP"` → `"url": "https://YOUR_DOCS_MCP"`. In the comment above it, change `Prefer an internal mirror if external fetch isn't approved.` → `Point at whatever docs MCP you use, or leave disabled.` At ~L56, change `the server from your internal mirror and point the command at the installed binary.` → `the server from your registry mirror and point the command at the installed binary.`

- [ ] **Step 3: Verify** — `node tools/doctor.mjs --offline`
Expected: no FAIL rows; the "provider configured" check passes (no `PROXY_HOST|YOUR-` marker except `YOUR_DOCS_MCP`, which Task 4 de-conflicts — WARN acceptable until then).
Also: `node -e "const s=require('fs').readFileSync('opencode.jsonc','utf8');JSON.parse(s.replace(/\/\/.*$/gm,'').replace(/\/\*[\s\S]*?\*\//g,''))"` → exits 0 (comment-stripped JSON parses).

- [ ] **Step 4: Commit** — `git add opencode.jsonc && git commit -m "feat: replace corp proxy with ollama + openrouter free providers"`

---

### Task 2: Re-pin all 13 agent files

**Files:** Modify `model:` + `fallback:` lines (and only those) in `.opencode/agent/*.md`. Descriptions mentioning old families (proposer-b "family B (Mistral)", proposer-c "(NVIDIA Nemotron)", refuter, reviewer-cheap, reviewer comments) update as shown.

- [ ] **Step 1: Apply exact replacements** (comment text included — copy verbatim):

| File | New `model:` line | New `fallback:` line |
|---|---|---|
| architect.md | `model: openrouter/nvidia/nemotron-3-ultra-550b-a55b:free   # strongest free reasoner (1M ctx), ≠ poolside executor` | `fallback: openrouter/nvidia/nemotron-3-super-120b-a12b:free   # used by tools/council.mjs --retry path; doctor.mjs validates it` |
| debugger.md | `model: openrouter/nvidia/nemotron-3-ultra-550b-a55b:free   # biggest free reasoner (550B MoE), 1M ctx for logs+code` | `fallback: openrouter/nvidia/nemotron-3-super-120b-a12b:free   # used by tools/council.mjs --retry path; doctor.mjs validates it` |
| judge.md | `model: openrouter/nvidia/nemotron-3-ultra-550b-a55b:free   # judging needs calibration more than creativity` | `fallback: openrouter/nvidia/nemotron-3-super-120b-a12b:free   # used by tools/council.mjs --retry path; doctor.mjs validates it` |
| mapper.md | `model: openrouter/nvidia/nemotron-3-ultra-550b-a55b:free   # the ONLY free 1M-ctx model — built for whole-subsystem reads` | `fallback: openrouter/nvidia/nemotron-3-super-120b-a12b:free   # used by tools/council.mjs --retry path; doctor.mjs validates it` |
| tester.md | `model: openrouter/cohere/north-mini-code:free   # agentic coding model, Cohere family ≠ poolside executor` | `fallback: ollama/qwen3.5:9b   # local — used by tools/council.mjs --retry path; doctor.mjs validates it` |
| reviewer.md | `model: openrouter/nvidia/nemotron-3-super-120b-a12b:free   # ≠ poolside executor & ≠ reviewer-cheap's local Qwen → /review stays cross-family` | `fallback: openrouter/google/gemma-4-31b-it:free   # used by tools/council.mjs --retry path; doctor.mjs validates it` |
| reviewer-cheap.md | `model: ollama/qwen3.5:9b   # local = $0 + no rate limits; Qwen family ≠ reviewer's NVIDIA` | `fallback: ollama/gemma4:12b-it-qat   # used by tools/council.mjs --retry path; doctor.mjs validates it` |
| proposer-b.md | `model: openrouter/inclusionai/ling-3.0-flash:free   # family B — ≠ NVIDIA (judge), ≠ Google (proposer-c)` | `fallback: openrouter/openai/gpt-oss-20b:free   # used by tools/council.mjs --retry path; doctor.mjs validates it` |
| proposer-c.md | `model: openrouter/google/gemma-4-31b-it:free   # family C — ≠ NVIDIA, ≠ inclusionAI` | `fallback: openrouter/google/gemma-4-26b-a4b-it:free   # used by tools/council.mjs --retry path; doctor.mjs validates it` |
| synthesizer.md | `model: openrouter/nvidia/nemotron-3-super-120b-a12b:free   # strong reasoner; synthesis is the judgment-heavy pass` | `fallback: openrouter/nvidia/nemotron-3-ultra-550b-a55b:free   # used by tools/council.mjs --retry path; doctor.mjs validates it` |
| refuter.md | `model: openrouter/openai/gpt-oss-20b:free   # ≠ reviewer (NVIDIA) and ≠ reviewer-cheap (Qwen) — correlated skepticism is a rubber stamp` | `fallback: openrouter/inclusionai/ling-3.0-flash:free   # used by tools/council.mjs --retry path; doctor.mjs validates it` |
| designer.md | `model: openrouter/google/gemma-4-31b-it:free   # multimodal (sees screenshots) + best free UI taste` | *(add line after model:)* `fallback: openrouter/inclusionai/ling-3.0-flash:free   # used by tools/council.mjs --retry path; doctor.mjs validates it` |
| pr-reviewer.md | `model: openrouter/google/gemma-4-31b-it:free     # strong free general reviewer, multimodal` | `fallback: openrouter/inclusionai/ling-3.0-flash:free   # used by tools/council.mjs --retry path; doctor.mjs validates it` |

Description-line family fixes: proposer-b.md `family B (Mistral)` → `family B (inclusionAI Ling)`; proposer-c.md `family C (NVIDIA Nemotron)` → `family C (Google Gemma)`.

- [ ] **Step 2: Verify** — `node tools/doctor.mjs --offline` → no FAIL; every agent has mode+model; every fallback ≠ model.
`grep -rn "gpt-5.1\|claude-4-5\|mistral-large\|mistral-small-4\|devstral\|llama-4-scout\|nemotron-3-nano-30b" .opencode/agent/` → no output.

- [ ] **Step 3: Commit** — `git add .opencode/agent && git commit -m "feat: re-tier all 13 agents onto free open-weights models"`

---

### Task 3: Re-pin 5 command frontmatters

**Files:** `.opencode/command/commit.md:3`, `a11y-review.md:3`, `adr.md:3`, `name.md:3`, `port-from-angular.md:3`

- [ ] **Step 1: Replace each `model:` line:**

```yaml
# commit.md
model: ollama/qwen3.5:4b   # local + instant — mechanical task, costs nothing
# a11y-review.md
model: openrouter/google/gemma-4-31b-it:free     # criterion-by-criterion audit; multimodal helps with UI evidence
# adr.md
model: openrouter/nvidia/nemotron-3-ultra-550b-a55b:free     # strongest free reasoner for weighing alternatives
# name.md
model: openrouter/google/gemma-4-31b-it:free     # creative range across naming techniques
# port-from-angular.md
model: openrouter/nvidia/nemotron-3-ultra-550b-a55b:free     # reads unfamiliar Angular & extracts exact rules; 1M ctx covers whole apps
```

(`port-from-angular.md` line drops its old `nemotron-3-super-120b-a12b or llama-4-scout` tail — the 1M note is now inline.)

- [ ] **Step 2: Verify** — `grep -rn "devstral\|gpt-5.1\|llama-4-scout" .opencode/command/` → no output.
- [ ] **Step 3: Commit** — `git add .opencode/command && git commit -m "feat: re-pin command models to local/free tiers"`

---

### Task 4: doctor.mjs placeholder check + eval baselines

**Files:** `tools/doctor.mjs:86`, `eval/run-eval.mjs:22-23`, `eval/README.md:10`, `eval/RESULTS.template.md:3`

- [ ] **Step 1:** `doctor.mjs` L86 — replace with:
```js
  if (/PROXY_HOST|YOUR-REAL|changeme/i.test(jsonc)) record("WARN", "opencode.jsonc provider configured", "placeholder marker found — fine at home, fix before real use");
```
(`YOUR-` → `YOUR-REAL` so the legit `YOUR_DOCS_MCP` placeholder in a disabled MCP block stops tripping it.)
- [ ] **Step 2:** `eval/run-eval.mjs` L22-23:
```js
  B0: { label: "single constrained", args: ["--model", "openrouter/poolside/laguna-s-2.1:free"] },
  B1: { label: "single strong",      args: ["--model", "openrouter/nvidia/nemotron-3-ultra-550b-a55b:free"] },
```
- [ ] **Step 3:** `eval/README.md` L10: `(GPT-5.1 alone)` → `(the strongest free reasoner alone)`. `eval/RESULTS.template.md` L3: `Proxy model IDs used:` → `Model IDs used:`.
- [ ] **Step 4: Verify** — `node tools/doctor.mjs --offline` → "provider configured" now PASS (no WARN). `grep -rn "gpt-5.1\|claude-4-5" eval/ tools/` → no output.
- [ ] **Step 5: Commit** — `git add tools/doctor.mjs eval && git commit -m "fix: doctor placeholder regex + free-model eval baselines"`

---

### Task 5: README rewrite

**Files:** Modify `README.md` (lines 3-6, 12-14, 30, 44, 81-93, 95-104, 124-126)

- [ ] **Step 1:** Intro para (L3-6) →
```markdown
A portable, **contract-governed** OpenCode configuration that gets near-frontier results out of
free, open-weights models (local Ollama models + OpenRouter's `:free` tier) by moving
*reasoning* out of the model and into artifacts the system can **check**: a task ledger, locked
tests, golden examples, plan↔artifact checks, cross-model review, and an eval harness.
```
- [ ] **Step 2:** L12-14 council note: `pressure-tested by a 5-model council (GPT-5.4, Sonnet 4.6, Gemini 3.1 Pro, Kimi K2.6)` → `pressure-tested by a 5-model council of frontier models`.
- [ ] **Step 3:** L30 table row: `Internal overlay example; contract-pipeline proposal` → `Personal-overlay example; contract-pipeline proposal`. L44: `Build agent (Sonnet 4.5) implements ONE step` → `Build agent (executor model) implements ONE step`.
- [ ] **Step 4:** Setup section (L81-93) →
```markdown
## Setup (two free accounts, five minutes)
0. **Doctor:** `node tools/doctor.mjs --offline` for static sanity now; run it again WITHOUT
   `--offline` once your key is set — it round-trips every pinned model and proves
   headless agent routing before you bet a workday on it.
1. **OpenRouter:** create a free key at openrouter.ai/keys, `export OPENROUTER_API_KEY=…`.
   Free tier = 50 req/day (20/min); a one-time $10 credit purchase unlocks 1,000/day — worth it.
2. **Ollama (local tier):** install from ollama.com, then
   `ollama pull qwen3.5:9b ornith:9b qwen3.5:4b` (~16GB, fits 16GB unified RAM).
   Hosting on a separate LAN box instead? See `docs/local-models.md` + `examples/`.
3. **Drop it in:** copy `.opencode/`, `AGENTS.md`, `PATTERNS.md`, `patterns/`, `memory/`, and the
   relevant `opencode.jsonc` bits into your project, or merge into `~/.config/opencode/`.
   (Verify singular/plural dir names — `agent/` vs `agents/` — for your OpenCode version.)
4. **Test the lock:** `export TDD_LOCK_TESTS=1` and confirm the executor can't edit a `*.test.*`
   file.
```
- [ ] **Step 5:** Tiering table (L95-104) →
```markdown
## Model tiering (free tier, preserved quota)
Models are provider-prefixed (`ollama/…` local, `openrouter/…:free` hosted). Chatty roles run
local (no rate limits); bursty council roles spend the 1,000/day OpenRouter pool. Defaults wired
across 5+ families so the `/review` consensus vote has uncorrelated blind spots:
| Tier | Models | Use for |
|---|---|---|
| Reasoning | `openrouter/nvidia/nemotron-3-ultra-550b-a55b:free` (1M ctx) | architect, debugger, judge, mapper |
| Executor | `openrouter/poolside/laguna-s-2.1:free` → `ollama/ornith:9b` | the Build agent, step edits |
| Cross-family review | `openrouter/nvidia/nemotron-3-super-120b-a12b:free`, `openrouter/cohere/north-mini-code:free` | reviewer, tester |
| Decorrelated review | `ollama/qwen3.5:9b` (local, $0) | reviewer-cheap (different blind spots) |
| Council diversity | `openrouter/inclusionai/ling-3.0-flash:free`, `openrouter/google/gemma-4-31b-it:free`, `openrouter/openai/gpt-oss-20b:free` | proposers, refuter, designer |
| Mechanical | `ollama/qwen3.5:4b` | commit messages, boilerplate, renames |

⚠️ The `:free` roster churns monthly. `node tools/doctor.mjs` catches delisted slugs; swap in a
live `:free` model or a pennies-tier one (see `opencode.jsonc` comments).
```
- [ ] **Step 6:** L124-126 →
```markdown
It brings *generic public reference material in* and *structures + verifies the workflow* —
every model call runs through providers you chose, on endpoints you control.
```
- [ ] **Step 7:** L85 area check: the word "work project" (L89-90) is covered by Step 4's rewrite. Verify: `grep -in "lockheed\|lmproxy\|sonnet\|gpt-5\|proxy" README.md` → no output (except allowed generic uses; expect zero).
- [ ] **Step 8: Commit** — `git add README.md && git commit -m "docs: retarget README to free open-model stack"`

---

### Task 6: Narrative docs scrub

**Files:** `ONBOARDING.md`, `CONTRIBUTING.md`, `CAPABILITY-PARITY.md`, `AGENTS.md`, `.opencode/command/setup.md`, `.opencode/plugins/guardrails.js`, `.opencode/plugins/metrics.js`, `docs/contract-pipeline.md`, `examples/ci/contract-sync.example.yml`

- [ ] **Step 1:** Exact line replacements:

| File:line | Old → New |
|---|---|
| ONBOARDING.md:7 | `- OpenCode CLI installed, pointed at the LM AI-factory proxy.` → `- OpenCode CLI installed. Ollama running locally (or on a LAN box — see docs/local-models.md).` |
| ONBOARDING.md:8 | `- \`export LM_PROXY_API_KEY=…\` (your proxy key).` → `- \`export OPENROUTER_API_KEY=…\` (free key from openrouter.ai/keys).` |
| ONBOARDING.md:13 | `- Apply the **team overlay** (internal repo) for real proxy IDs + our conventions — ask your lead,` → `- Optionally apply a **personal overlay** (LAN model host, paid-tier IDs) — see \`examples/opencode.overlay.example.jsonc\`,` |
| CONTRIBUTING.md:6 | `Never commit employer code, internal names, secrets, or` → `Never commit private code, private hostnames, secrets, or` |
| CONTRIBUTING.md:37 | `## Two layers: public kit vs internal overlay` → `## Two layers: public kit vs personal overlay` |
| CONTRIBUTING.md:38-39 | `This repo is the public, generic kit. Real proxy IDs, internal endpoints, and team conventions live in a SEPARATE private overlay repo (see …) — never` → `This repo is the public, generic kit. Personal endpoints (your LAN model host), paid model IDs, and private conventions live in a SEPARATE overlay (see \`examples/opencode.overlay.example.jsonc\`) — never` |
| CAPABILITY-PARITY.md:4 | `constrained models through the LM proxy.` → `free open-weights models.` |
| CAPABILITY-PARITY.md:33 | `so the **work** environment` → `so any environment` |
| AGENTS.md:59 | `- Executor → Sonnet 4.5. Decorrelated reviewer → a cheap model.` → `- Executor → a coding-tuned mid model (laguna-s / local ornith). Decorrelated reviewer → a cheap local model.` |
| setup.md:10 | `2. **Wire the proxy:** in \`opencode.jsonc\`, confirm \`provider.lmproxy.baseURL\` + the API-key env` → `2. **Wire providers:** in \`opencode.jsonc\`, confirm the \`ollama\` baseURL (localhost vs LAN) and \`OPENROUTER_API_KEY\` env` |
| setup.md:14 | `4. **Apply the team overlay** if one exists (real IDs + team conventions) — see` → `4. **Apply your personal overlay** if you have one (LAN host, paid IDs) — see` |
| guardrails.js:3 | `//     model context — important on a corp proxy where context may be logged.` → `//     model context — important on any hosted endpoint where context may be logged.` |
| metrics.js:6 | `// Point it ONLY at a local/internal collector.` → `// Point it ONLY at a local collector.` |
| contract-pipeline.md:3 | `Wiring this to live internal services needs sign-off` → `Wiring this to your live services needs review` |
| contract-sync.example.yml:26 | `curl -fsSL "<INTERNAL_OPENAPI_URL>" -o openapi/spec.yaml` → `curl -fsSL "<YOUR_OPENAPI_URL>" -o openapi/spec.yaml` |

Leave alone (false positives): `PATTERNS.md:58` + `patterns/swiftui-accessibility/README.md` ("internal throwaway tooling" = generic phrase), `patterns/maui-mvvm-toolkit` (.NET API fact), `examples/openapi-generator-config.example.yaml` (Swift keyword), `.opencode/templates/BRIEF.template.md:22` (generic), all "pattern corpus" hits.

- [ ] **Step 2: Verify** — `grep -rin "lockheed\|lmproxy\|lm_proxy\|proxy_host\|ai.factory\|LM AI\|team overlay\|employer" --include="*.md" --include="*.js" --include="*.jsonc" --include="*.yml" . | grep -v docs/superpowers | grep -v node_modules` → no output.
- [ ] **Step 3: Commit** — `git add -A && git commit -m "docs: scrub work-proxy framing for public audience"`

---

### Task 7: Overlay example → personal LAN overlay

**Files:** Rewrite `examples/opencode.overlay.example.jsonc` entirely:

- [ ] **Step 1: Replace file content:**
```jsonc
{
  // PERSONAL OVERLAY EXAMPLE — layer your private wiring (LAN model host, paid model IDs)
  // over the generic kit. Keep a filled-in copy out of public repos.
  //
  // Usage: merge into the project's opencode.jsonc, or keep as ~/.config/opencode/opencode.jsonc.
  "$schema": "https://opencode.ai/config.json",

  // Point the local tier at a LAN model server instead of localhost.
  // Stable addressing: give the box a real hostname (mDNS → macmini.local) or a DHCP
  // reservation — never pin a dynamic IP. See docs/local-models.md for the server side.
  "provider": {
    "ollama": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Ollama (LAN)",
      "options": { "baseURL": "http://macmini.local:11434/v1" },
      "models": {
        "qwen3.5:9b":        { "name": "Qwen3.5 9B (LAN)" },
        "ornith:9b":         { "name": "Ornith 9B (LAN)" },
        "qwen3.5:4b":        { "name": "Qwen3.5 4B (LAN)" },
        "gemma4:12b-it-qat": { "name": "Gemma 4 12B QAT (LAN)" }
      }
    }
    // Paid "pennies tier" upgrades when a :free slug delists or rate limits bite —
    // add under the kit's openrouter provider:
    //   "qwen/qwen3.7-flash", "z-ai/glm-4.7-flash", "deepseek/deepseek-v4-flash-0731"
  },

  // Load personal conventions on top of the kit's AGENTS.md.
  "instructions": [
    "AGENTS.md",
    "memory/MEMORY.md"
  ]

  // Tip: pin which model each agent uses here too, if you don't want to edit the kit's agent
  // files directly — keeps the public kit pristine and your real choices in the overlay.
}
```
- [ ] **Step 2: Verify** — comment-stripped parse check (same `node -e` one-liner as Task 1 against this file) → exits 0.
- [ ] **Step 3: Commit** — `git add examples && git commit -m "feat: personal LAN overlay example (macmini.local)"`

---

### Task 8: New `docs/local-models.md`

**Files:** Create `docs/local-models.md`

- [ ] **Step 1: Write the guide** with exactly these sections (each 10-25 lines, concrete commands only, no filler):
1. **Why local** — the chatty tiers (executor fallback, reviewer-cheap, /commit) are free + unlimited locally; rate-limited free APIs serve the bursty council.
2. **RAM-tier model menus** (verified 2026-08): 16GB → `qwen3.5:9b` (6.6GB) / `ornith:9b` (5.6GB) / `qwen3.5:4b` (3.4GB) / `qwen3-embedding:0.6b` / optional `gemma4:12b-it-qat` (7.2GB); 32GB adds `qwen3.6:27b`, `qwen3-coder:30b`, `devstral-small-2:24b`; 64GB adds 70B-class at Q4. Note: no small qwen3-coder exists; Ollama ≥0.32 required for 2026 families.
3. **Install + serve (macOS)** — `brew install ollama`; dedicated LaunchAgent (NOT `brew services` — brew regenerates its plist on restart and clobbers env edits); full plist template from Task 11 Step 2 embedded verbatim, with `OLLAMA_MODELS` pointed at an external volume and the pre-flight volume wait explained.
4. **LAN exposure + addressing** — `OLLAMA_HOST=0.0.0.0:11434`; mDNS hostname (`sudo scutil --set LocalHostName macmini`) or DHCP reservation; client side = overlay example.
5. **16GB tuning** — `OLLAMA_FLASH_ATTENTION=1`, `OLLAMA_KV_CACHE_TYPE=q8_0`, `OLLAMA_MAX_LOADED_MODELS=1`, `OLLAMA_NUM_PARALLEL=1`, `OLLAMA_KEEP_ALIVE=30m`.
6. **Security** — Ollama's API is UNAUTHENTICATED: bind 0.0.0.0 only on a trusted LAN, never port-forward; remote access = Tailscale.
7. **Server duty checklist** — `pmset -a sleep 0`, auto-login on (LaunchAgent is per-user), external volume auto-mounts by default, `brew upgrade ollama` safe (plist points at `/opt/homebrew/opt/ollama/bin/ollama`, an upgrade-stable symlink).
8. **Alternatives** — LM Studio (MLX backend ~20-30% faster on Apple Silicon, GUI-centric) and llama.cpp `llama-server` (max control) both speak OpenAI-compatible; only the `baseURL` changes.
- [ ] **Step 2: Verify** — file renders as valid Markdown; `grep -in "lockheed\|lmproxy\|internal" docs/local-models.md` → no output.
- [ ] **Step 3: Commit** — `git add docs/local-models.md && git commit -m "docs: generic local-model hosting guide"`

---

### Task 9: Mini — upgrade Ollama

- [ ] **Step 1:** `ssh -o BatchMode=yes steve@10.0.0.49 '/opt/homebrew/bin/brew upgrade ollama'` (long: ~2-5 min).
- [ ] **Step 2: Verify** — `ssh … '/opt/homebrew/opt/ollama/bin/ollama --version'` → ≥ 0.32.6. `curl -s http://10.0.0.49:11434/api/version` → still serving (brew restarts it; if not: `ssh … '/opt/homebrew/bin/brew services restart ollama'`).

### Task 10: Mini — format the 1TB SSD

- [ ] **Step 1:** Re-verify it's still uninitialized: `ssh … 'diskutil list disk6'` → shows raw 1.0 TB, no partitions. **If partitions appear, STOP and ask the owner.**
- [ ] **Step 2:** `ssh … 'diskutil eraseDisk APFS Models disk6'` (if it errors with "authentication required": run interactively — the owner types `! ssh -t steve@10.0.0.49 "sudo diskutil eraseDisk APFS Models disk6"`).
- [ ] **Step 3: Verify** — `ssh … 'ls /Volumes && df -h /Volumes/Models'` → volume mounted, ~1TB free.

### Task 11: Mini — dedicated LaunchAgent + store on the 1TB volume

- [ ] **Step 1:** Stop + detach the brew-managed service: `ssh … '/opt/homebrew/bin/brew services stop ollama'`.
- [ ] **Step 2:** Write `~/Library/LaunchAgents/com.local.ollama.plist` on the mini (heredoc over SSH):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.local.ollama</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string><string>-c</string>
    <string>until [ -d /Volumes/Models ]; do sleep 5; done; exec /opt/homebrew/opt/ollama/bin/ollama serve</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>OLLAMA_HOST</key><string>0.0.0.0:11434</string>
    <key>OLLAMA_MODELS</key><string>/Volumes/Models/ollama</string>
    <key>OLLAMA_FLASH_ATTENTION</key><string>1</string>
    <key>OLLAMA_KV_CACHE_TYPE</key><string>q8_0</string>
    <key>OLLAMA_MAX_LOADED_MODELS</key><string>1</string>
    <key>OLLAMA_NUM_PARALLEL</key><string>1</string>
    <key>OLLAMA_KEEP_ALIVE</key><string>30m</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/ollama.log</string>
  <key>StandardErrorPath</key><string>/tmp/ollama.log</string>
</dict>
</plist>
```
- [ ] **Step 3:** `ssh … 'mkdir -p /Volumes/Models/ollama && launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.local.ollama.plist'`
- [ ] **Step 4: Verify** — `curl -s http://10.0.0.49:11434/api/version` → responds; `curl -s http://10.0.0.49:11434/api/tags` → `{"models":[]}` (EMPTY is CORRECT — new store; old store still intact at `~/.ollama/models` until Task 13).

### Task 12: Mini — hostname

- [ ] **Step 1:** Try non-interactive: `ssh … 'sudo -n scutil --set ComputerName macmini && sudo -n scutil --set LocalHostName macmini && sudo -n scutil --set HostName macmini'`. If `sudo -n` fails (password required), the owner runs: `! ssh -t steve@10.0.0.49 'sudo scutil --set ComputerName macmini; sudo scutil --set LocalHostName macmini; sudo scutil --set HostName macmini'`.
- [ ] **Step 2: Verify from Windows** — `ping -n 1 macmini.local` resolves to 10.0.0.49 (mDNS may take ~1 min; retry once). `curl -s http://macmini.local:11434/api/version` → responds.

### Task 13: Mini — model roster

- [ ] **Step 1: Pull the 5-model roster** (sequential, ~25GB total; run in background, ~20-40 min):
`ssh … '/opt/homebrew/opt/ollama/bin/ollama pull qwen3.5:9b && … pull ornith:9b && … pull qwen3.5:4b && … pull qwen3-embedding:0.6b && … pull gemma4:12b-it-qat'`
- [ ] **Step 2: Verify** — `curl -s http://macmini.local:11434/api/tags` lists exactly the 5; smoke-generate on each: `curl -s http://macmini.local:11434/v1/chat/completions -d '{"model":"<tag>","messages":[{"role":"user","content":"Say OK"}],"max_tokens":5}' -H "Content-Type: application/json"` → valid completion per tag.
- [ ] **Step 3: Delete the old store** (frees 59GB on the internal disk; the 12 stale models — llama3, hermes3, mistral-nemo, qwen2.5-coder:7b, deepseek-coder-v2:16b, deepseek-r1:8b, phi4:14b, gemma3:12b, gemma3:4b, qwen3:8b, qwen3:4b, nomic-embed-text — all live only there): `ssh … 'rm -rf ~/.ollama/models'`. **Gate: only after Step 2 passes.**
- [ ] **Step 4: Verify** — `ssh … 'df -h /System/Volumes/Data | tail -1'` → ~140GB free (was 82GB).

### Task 14: Mini — server-duty settings

- [ ] **Step 1:** `ssh … 'sudo -n pmset -a sleep 0 displaysleep 10'` (same interactive fallback pattern as Task 12 if sudo needs a password).
- [ ] **Step 2:** Check auto-login (LaunchAgent requires a logged-in session): `ssh … 'defaults read /Library/Preferences/com.apple.loginwindow autoLoginUser 2>/dev/null || echo NOT-SET'`. If NOT-SET → report to owner (set in System Settings → Users & Groups; cannot be done headlessly).
- [ ] **Step 3: Reboot test (with owner's OK):** `ssh … 'sudo -n reboot'` or owner reboots; after ~2 min: `curl -s http://macmini.local:11434/api/tags` → 5 models, served from `/Volumes/Models/ollama`.

### Task 15: End-to-end validation + PR

- [ ] **Step 1:** `node tools/doctor.mjs --offline` → all PASS.
- [ ] **Step 2:** With owner's `OPENROUTER_API_KEY` exported: `node tools/doctor.mjs` (live) → every pinned model + fallback found in `opencode models`; one real completion through each provider. If a `:free` slug is missing (roster churn since 2026-08-05): swap per the README churn note, re-run, record the substitution in the PR body.
- [ ] **Step 3:** `git push -u origin feat/public-open-models` and open a PR titled `feat: retarget kit to free open-weights models + local hosting guide` summarizing: provider swap, 13-agent re-tier, scrub, hosting guide, and (in a "infra done out-of-band" note) the Mac mini work.
- [ ] **Step 4:** Update repo `memory/MEMORY.md`: add one line — date, "kit retargeted to ollama+openrouter free tier; mini serves 5-model roster at macmini.local; :free roster churns — doctor catches it".

---

## Self-review (done at write time)

- **Spec coverage:** §1→Task 1; §2→Tasks 2-3; §3→Tasks 5-6 (+4 eval); §4→Task 8; §5→Tasks 9-14; §6→Tasks 1/4/15. Overlay (§3 tail)→Task 7. ✔
- **Placeholders:** none — every step carries exact content/commands. ✔
- **Consistency:** local tags in Tasks 1/2/3/7/8 all appear in Task 13's pull list; plist env matches docs template (Task 8 embeds Task 11's plist); doctor regex change (Task 4) matches Task 1's `YOUR_DOCS_MCP`. ✔
