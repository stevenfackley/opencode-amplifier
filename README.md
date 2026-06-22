# opencode-amplifier

A portable, **contract-governed** OpenCode configuration that gets near-frontier results out of
constrained models (Sonnet 4.5, Sonnet 3.7, GPT-5.1, and cheaper corp-hosted models) by moving
*reasoning* out of the model and into artifacts the system can **check**: a task ledger, locked
tests, golden examples, plan↔artifact checks, cross-model review, and an eval harness.

> **Core thesis.** A weak model's ceiling ≈ *(what's in its context)* + *(how small each step
> is)*. You don't make Sonnet smarter — you remove the need for it to be smart, and you replace
> "the model promises to behave" with "the system verifies it did."

This design was pressure-tested by a 5-model council (GPT-5.4, Sonnet 4.6, Gemini 3.1 Pro, Kimi
K2.6). Their core verdict — *be contract-governed, not prompt-governed; add durable state,
hostile verification, and explicit recovery* — is baked into the structure below.

## What's in the box

| Piece | Where | Role |
|---|---|---|
| Standing rails | `AGENTS.md` | The 9 rules every turn obeys; the contract |
| Task ledger | `.opencode/templates/TASK.template.json` | Single source of truth; survives context loss |
| Skills (native) | `.opencode/skills/` | `brainstorming`, `test-driven-development`, `verification-before-completion`, `creative-naming`, `distinctive-ui-design`, `reviewing-others-code`, `consuming-shared-libraries`, `dotnet-standard-2.0-compat`, `porting-angular-to-mobile`, `accessibility-508` |
| Agents (per-model) | `.opencode/agent/` | `architect`, `tester`, `reviewer`, `reviewer-cheap`, `debugger`, `designer`, `pr-reviewer` |
| Commands | `.opencode/command/` | `/plan /spec-tests /verify /consistency /review /debug /pattern /cross-check /evidence /reground /revert-green /name /design /review-pr /explain /pr-description /adr /commit /swift-client /port-from-angular /a11y-review /capture-pattern /setup` |
| Plugins (hooks) | `.opencode/plugins/` | `tdd-lock`, `compaction`, `escalation`, `guardrails`, `metrics` |
| Cheat sheet | `USAGE.md` | One-line "reach for this when…" for every command/skill/agent, grouped by workflow |
| Onboarding / team | `ONBOARDING.md`, `CONTRIBUTING.md`, `.opencode/command/setup.md` | Get a teammate amplified in 5 min; how to extend the kit; `/setup` bootstrap |
| ROI / metrics | `eval/METRICS.md`, `metrics` plugin | Measure kit-vs-baseline on real tasks; the team-adoption + perf-review evidence |
| Examples / docs | `examples/`, `docs/` | Internal overlay example; contract-pipeline proposal + CI/codegen templates |
| Plugins (hooks) | `.opencode/plugins/` | `tdd-lock`, `compaction`, `escalation`, `guardrails` |
| Pattern corpus | `patterns/` + `PATTERNS.md` | Golden examples with fitness metadata; adapt, don't invent |
| Memory | `memory/MEMORY.md` | Durable cross-session notes (auto-loaded) |
| Eval harness | `eval/` | Prove the pipeline beats a single model; cut what doesn't earn its keep |
| Parity map | `CAPABILITY-PARITY.md` | How this matches/exceeds a local Claude Code setup |
| Config | `opencode.jsonc` | Proxy provider, instructions, MCP servers |

## The canonical workflow (one hardened loop)

```
/plan <task>          architect (strong model, read-only) -> TASK.json (goal, invariants,
                      forbidden files, steps, acceptance tests) + Approach brief
/spec-tests           tester (different model, never sees impl) writes FAILING spec tests
export TDD_LOCK_TESTS=1                # tests are now a locked contract
<do step 1>           Build agent (Sonnet 4.5) implements ONE step, updates TASK.json
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

## Setup (placeholders are marked)
1. **Proxy:** edit `opencode.jsonc` → `provider.lmproxy` (`baseURL`, API-key env var, real model
   IDs from `opencode models`).
2. **Per-agent models:** in `.opencode/agent/*.md`, set `model:` to real IDs. Make `reviewer`
   and `tester` *different families* from the executor — decorrelation is the point.
3. **Drop it in:** copy `.opencode/`, `AGENTS.md`, `PATTERNS.md`, `patterns/`, `memory/`, and the
   relevant `opencode.jsonc` bits into a work project, or merge into `~/.config/opencode/`.
   (Verify singular/plural dir names — `agent/` vs `agents/` — for your OpenCode version.)
4. **Test the lock:** `export TDD_LOCK_TESTS=1` and confirm the executor can't edit a `*.test.*`
   file.

## Model tiering (preserve premium quota)
Models referenced by **bare ID** (no provider prefix). Defaults wired across 4 families so the
`/review` consensus vote has uncorrelated blind spots:
| Tier | Models (bare IDs) | Use for |
|---|---|---|
| Reasoning | `gpt-5.1`, `nemotron-3-ultra-550b-a55b`, `mistral-large-3-675b-instruct-2512` | architect, tester, debugger, reviewer |
| Executor | `claude-4-5-sonnet-latest` | the Build agent, step edits, designer |
| Decorrelated review | `nemotron-3-nano-30b-a3b` (1M ctx) | reviewer-cheap (different blind spots) |
| Mechanical | `devstral-small-2-24b-instruct-2512`, `gemma-4-31b-it` | commit messages, boilerplate, renames |
| Huge context | `llama-4-scout`, `nemotron-3-super-120b-a12b` (1M) | reading whole Angular apps for `/port-from-angular` |

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
It moves no sensitive/weapons data anywhere and bypasses no data rule. It brings *generic public
reference material in* and *structures + verifies the workflow* — every model call still runs
through the approved proxy on approved data.
