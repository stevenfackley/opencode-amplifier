# opencode-amplifier

A portable, **contract-governed** OpenCode configuration that gets near-frontier results out of
free, open-weights models (local Ollama models + OpenRouter's `:free` tier) by moving
*reasoning* out of the model and into artifacts the system can **check**: a task ledger, locked
tests, golden examples, plan↔artifact checks, cross-model review, and an eval harness.

> **Core thesis.** A weak model's ceiling ≈ *(what's in its context)* + *(how small each step
> is)*. You don't make the model smarter — you remove the need for it to be smart, and you replace
> "the model promises to behave" with "the system verifies it did."

This design was pressure-tested by a 5-model council of frontier models. Their core verdict —
*be contract-governed, not prompt-governed; add durable state, hostile verification, and
explicit recovery* — is baked into the structure below.

## What's in the box

| Piece | Where | Role |
|---|---|---|
| Standing rails | `AGENTS.md` | The 9 rules every turn obeys; the contract |
| Task ledger | `.opencode/templates/TASK.template.json` | Single source of truth; survives context loss |
| Skills (native) | `.opencode/skills/` | `brainstorming`, `test-driven-development`, `verification-before-completion`, `creative-naming`, `distinctive-ui-design`, `reviewing-others-code`, `consuming-shared-libraries`, `dotnet-standard-2.0-compat`, `porting-angular-to-mobile`, `accessibility-508` |
| Agents (per-model) | `.opencode/agent/` | `architect`, `tester`, `reviewer`, `reviewer-cheap`, `debugger`, `designer`, `pr-reviewer` |
| Commands | `.opencode/command/` | `/plan /spec-tests /verify /consistency /review /debug /pattern /cross-check /evidence /reground /revert-green /name /design /review-pr /explain /pr-description /adr /commit /swift-client /port-from-angular /a11y-review /capture-pattern /setup /handoff /resume /deep-design /deep-debug /deep-review /deep-read /council` |
| Council layer | `.opencode/agent/` (proposer-b/c, judge, mapper, refuter, synthesizer) + `deep-*` commands | Fresh-context multi-model fan-out; artifacts in `.analysis/`, briefs in `memory/briefs/` |
| Plugins (hooks) | `.opencode/plugins/` | `tdd-lock`, `compaction`, `escalation`, `guardrails`, `metrics`, `rot-guard` |
| Cheat sheet | `USAGE.md` | One-line "reach for this when…" for every command/skill/agent, grouped by workflow |
| Onboarding / team | `ONBOARDING.md`, `CONTRIBUTING.md`, `.opencode/command/setup.md` | Get a teammate amplified in 5 min; how to extend the kit; `/setup` bootstrap |
| ROI / metrics | `eval/METRICS.md`, `metrics` plugin | Measure kit-vs-baseline on real tasks; the team-adoption + perf-review evidence |
| Examples / docs | `examples/`, `docs/` | Personal-overlay example; contract-pipeline proposal + CI/codegen templates |
| Pattern corpus | `patterns/` + `PATTERNS.md` | Golden examples with fitness metadata; adapt, don't invent |
| Memory | `memory/MEMORY.md` | Durable cross-session notes (auto-loaded) |
| Eval harness | `eval/` | Prove the pipeline beats a single model; cut what doesn't earn its keep |
| Parity map | `CAPABILITY-PARITY.md` | How this matches/exceeds a local Claude Code setup |
| Config | `opencode.jsonc` | Providers (ollama + openrouter), instructions, MCP servers |

## The canonical workflow (one hardened loop)

```
/plan <task>          architect (strong model, read-only) -> TASK.json (goal, invariants,
                      forbidden files, steps, acceptance tests) + Approach brief
/spec-tests           tester (different model, never sees impl) writes FAILING spec tests
export TDD_LOCK_TESTS=1                # tests are now a locked contract
<do step 1>           Build agent (executor model) implements ONE step, updates TASK.json
/verify               run full suite, fix until green
/consistency          confirm the PLAN was satisfied, not just the tests
/review               reviewer + reviewer-cheap (two models) -> consensus findings
<repeat per step; commit each green step>
/evidence             merge-readiness pack with real output
```

Why each guard exists: small steps + ledger = no drift/decay; tester + TDD-lock = no
verification gaming; `/consistency` = catches the "tests green but plan violated" failure (~32%
in research); cross-model `/review` = catches what one model is blind to; commit-per-step +
`/revert-green` = recover instead of thrash; `escalation` plugin = stop burning a weak model on
a step it can't do.

## The council layer (deep analysis)

The canonical loop verifies execution; the council layer amplifies *analysis*. Model calls cost
nothing — context (and the daily free-tier request pool) is the scarce resource — so heavy
reading/reasoning fans out to **fresh-context workers across decorrelated model families** that
die after returning a capped artifact. The orchestrating session holds artifacts only; rot can't accumulate in a context
that is thrown away.

| Reach for | When |
|---|---|
| `/deep-design <q>` | Architecture/trade-off call — 3 blind proposals, judge-scored, synthesized with a **dissent register** (where models disagree = where the risk lives) |
| `/deep-debug <symptom>` | Unknown root cause — hypothesis tournament with falsification tests; no fix while ≥2 hypotheses live |
| `/deep-review [target]` | High-stakes diff — 4 dimension shards + adversarial **refuter** gate; only findings that survive attack reach you |
| `/deep-read <area>` | Unfamiliar code — 1M-ctx mapper compresses subsystems into a durable, SHA-stamped brief (`memory/briefs/`) |
| `/council <q>` | Any other hard question — generic blind 3-model poll + synthesis |

Rails: packet in (≤200 lines, assembled by hand or `tools/packet.mjs`), artifact out (≤150
lines, `.analysis/`), workers are blind to each other, the synthesizer must log dissent
instead of averaging it away. Optional parallel execution: `tools/council.mjs` (dead workers
retry once on their declared `fallback:` model). When rot-guard warns, `/handoff` → fresh
session → `/resume` continues from a distilled state artifact instead of a bloated context.
Discipline lives in the `deep-analysis` skill + AGENTS.md rule 10.

## Setup (one free API key + two installs, five minutes)
1. **OpenCode CLI:** `npm i -g opencode-ai` (or the platform installer at opencode.ai);
   `opencode --version` must answer before anything below works.
2. **Doctor:** `node tools/doctor.mjs --offline` for static sanity now; run it again WITHOUT
   `--offline` once your key is set — it round-trips every pinned model and proves
   headless agent routing before you bet a workday on it.
3. **OpenRouter:** create a free key at openrouter.ai/keys, `export OPENROUTER_API_KEY=…`.
   Free tier = 50 req/day (20/min); a one-time $10 credit purchase unlocks 1,000/day — worth it.
4. **Ollama (local tier):** install from ollama.com, then
   `ollama pull qwen3.5:9b && ollama pull ornith:9b && ollama pull qwen3.5:4b`
   (~16GB on disk; `OLLAMA_MAX_LOADED_MODELS=1` keeps one resident at a time). No agent pins
   `ornith:9b` — it's the manual executor-swap target, so skip that pull until you want it.
   Hosting on a separate LAN box instead? See `docs/local-models.md` + `examples/`.
5. **Drop it in:** copy `.opencode/`, `AGENTS.md`, `PATTERNS.md`, `patterns/`, `memory/`, and the
   relevant `opencode.jsonc` bits into your project, or merge into `~/.config/opencode/`.
   (Verify singular/plural dir names — `agent/` vs `agents/` — for your OpenCode version.)
6. **Test the lock:** `export TDD_LOCK_TESTS=1` and confirm the executor can't edit a `*.test.*`
   file.

## Model tiering (free tier, preserved quota)
Every shipped pin is `openrouter/…:free` — one API key, no local model server required. Defaults
are wired across 5+ families so the `/review` consensus vote has uncorrelated blind spots. All of
it spends the same 1,000/day OpenRouter pool, so cheap roles get small models on purpose:
| Tier | Models | Use for |
|---|---|---|
| Reasoning | `nvidia/nemotron-3-ultra-550b-a55b:free` (1M ctx) | architect, debugger, judge, mapper, `/adr`, `/port-from-angular` |
| Executor | `poolside/laguna-s-2.1:free` | the Build agent, step edits |
| Cross-family review | `nvidia/nemotron-3-super-120b-a12b:free`, `cohere/north-mini-code:free` | reviewer, synthesizer, tester |
| Decorrelated review | `minimax/minimax-m3:free` (1M ctx, vision) | reviewer-cheap, pr-reviewer |
| Council diversity | `thinkingmachines/inkling-small:free`, `poolside/laguna-s-2.1:free`, `minimax/minimax-m2.7:free` | proposers, refuter, designer, `/a11y-review`, `/name` |
| Mechanical | `poolside/laguna-xs-2.1:free` | commit messages, boilerplate, renames |

The `/review` consensus vote runs four different families — poolside (executor), NVIDIA
(reviewer), MiniMax (reviewer-cheap), ThinkingMachines (refuter) — and the fallbacks are chosen
so they stay distinct even if every primary is rate-limited at once. Vision roles (`designer`,
`pr-reviewer`, `/a11y-review`) are pinned to multimodal slugs on purpose.

**Optional local tier ($0, unmetered).** Running Ollama lets you move the chatty roles
(`reviewer-cheap`, `/commit`) off the OpenRouter pool entirely. It is opt-in, not assumed —
see `docs/local-models.md` for the server and `examples/opencode.overlay.example.jsonc` for the
provider block and which pins to move.

⚠️ **The `:free` roster churns monthly, and the catalog lies.** `opencode models` keeps listing
slugs OpenRouter has since moved to paid, so a static check passes and only a real call fails
with *"This model is unavailable for free."* On 2026-08-29 five of nine declared slugs were
broken this way — including a **primary**. Verify with a live round-trip, never the catalog:

```bash
node tools/doctor.mjs          # round-trips every primary
node tools/doctor.mjs --deep   # ...and every fallback (2x the calls, catches the silent rot)
```

Fallbacks rot most — they only run when everything else broke, so nothing exercises them. Run
`--deep` after any provider change. Swap in a live `:free` model or a pennies-tier one (see
`opencode.jsonc` comments).

## Claude Code parity
OpenCode is Claude-Code-compatible: it auto-discovers `.claude/skills/` and falls back to
`~/.claude/CLAUDE.md`. So on your personal machine your existing superpowers library "just
works." See `CAPABILITY-PARITY.md` for the full feature map — and the three areas where this
setup **exceeds** local CC (per-agent models, cross-model ensembles, contract-governed state).

## Growing the corpus (the core trick, systematized)
Build a minimal, generic worked example of an advanced pattern offline with a strong model; add
it under `patterns/<name>/` (copy `_TEMPLATE/`, fill the fitness frontmatter — `applicability`
and `forbidden_contexts` matter most); register it in `PATTERNS.md`. Keep it generic and
data-free so the public MIT repo is unambiguously yours and import-safe.

## Proving it works
Don't trust elaboration — measure. `eval/` runs your pipeline against single-model baselines and
ablations across greenfield/brownfield/bugfix tasks. If a component's ablation delta is tiny, cut
it. See `eval/README.md`.

## What this does NOT do
It moves no sensitive data anywhere and bypasses no data rule. It brings *generic public
reference material in* and *structures + verifies the workflow* — every model call runs through
providers you chose, on endpoints you control.
