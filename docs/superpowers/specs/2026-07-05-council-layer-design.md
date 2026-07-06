# Council Layer — design spec

**Date:** 2026-07-05
**Status:** approved (design), pending implementation plan
**Repo:** opencode-amplifier

## Problem

Field feedback from real use on the work network: the kit's verification rails work, but

1. **Analysis is still shallow.** Architecture calls, root-cause debugging, deep code
   comprehension, and review depth are all noticeably below Opus-level even with the rails.
   Every step still produces ONE candidate from ONE weak model.
2. **Context decays.** Long sessions rot; a bloated context makes the weak models markedly
   worse. Ledger + compaction help but don't stop the drift.

Constraint discovered: the proxy is **effectively unmetered** — calls are free; **context is
the scarce resource**. That inverts the usual design economics.

## Core principle: disposable workers, durable artifacts

The primary session becomes a thin **orchestrator**. All heavy reading and reasoning happens
in **fresh-context subagents** that die after returning a **size-capped structured artifact**
to `.analysis/`. The orchestrator holds artifacts only — never raw exploration output. Rot
cannot accumulate in a context that is thrown away after every job. Amplification comes from
inference-time compute scaling: N independent samples from decorrelated model families + a
verifier/judge beats one sample from any single constrained model.

## Goals

- Opus-shaped output quality on the four weak analysis types: architecture/design, debugging
  root-cause, code comprehension, review depth.
- Flat orchestrator context regardless of how many model calls a task burns.
- Everything ships in this public repo; works offline from a `git pull` on the locked-down
  work machine; no external infra, no new dependencies beyond OpenCode itself.

## Non-goals

- No changes to the existing canonical loop (`/plan → /spec-tests → /verify → /consistency →
  /review`). The council layer sits beside it and feeds it.
- No embedding/retrieval infrastructure. Packet assembly is rule-based.
- No parallelism requirement. Sequential subagent execution is acceptable; the fan-out script
  is an optional accelerator.

## Architecture

Two execution mechanisms, one contract:

1. **In-session subagents (required path).** New agents with `mode: subagent` invoked by the
   primary agent per the command's orchestration steps. Works in any OpenCode install.
2. **Headless fan-out script (optional accelerator).** `tools/council.mjs` — plain Node, zero
   npm dependencies — spawns parallel `opencode run --agent <a> --model <m>` processes, each
   writing its artifact then exiting. Used when wall-clock matters.

Both paths produce identical artifacts, so commands document mechanism 1 and mention 2.

### Artifact protocol

- All analysis artifacts live in `.analysis/` (gitignored by default; a repo may choose to
  commit them). Briefs live in `memory/briefs/` (committed — they are durable knowledge).
- Every artifact has YAML frontmatter: `command`, `date`, `git_sha`, `models`, `inputs`
  (packet summary), `status`.
- Every artifact is **size-capped at 150 lines** past frontmatter. Workers are told the cap;
  the synthesizer discards non-conforming input (see Error handling).
- Templates in `.opencode/templates/`: `DESIGN.template.md`, `DEBUG.template.md`,
  `REVIEW.template.md`, `BRIEF.template.md`, `COUNCIL.template.md`.

### Context packets

Step 1 of every `deep-*` command assembles a **packet**: goal, invariants/forbidden files
from `TASK.json` (if present), relevant file references, and the matching section of the
codebase brief (if present). Workers receive the packet and nothing else. The inverted
pyramid: huge-context cheap models compress raw code into briefs; premium reasoners get small
distilled packets.

Packet + artifact discipline is codified once in a shared skill,
`.opencode/skills/deep-analysis/SKILL.md`, referenced by all five commands.

## Components

### New agents (`.opencode/agent/`, all `mode: subagent`, all read-only)

| Agent | Model (bare ID) | Role |
|---|---|---|
| `proposer-b` | `mistral-large-3-675b-instruct-2512` | Blind design proposer, family B |
| `proposer-c` | `nemotron-3-ultra-550b-a55b` | Blind design proposer, family C |
| `judge` | `gpt-5.1` | Scores proposals against the command's rubric; no authoring |
| `mapper` | `llama-4-scout` | Whole-subsystem reads → distilled brief sections (1M ctx) |
| `refuter` | family ≠ both reviewer families (default `mistral-large-3-675b-instruct-2512`; if `reviewer` is already Mistral, use `gpt-oss-120b`) | Adversarially attempts to kill every review finding |
| `synthesizer` | `gpt-5.1` | Merges worker artifacts; MUST fill the dissent register |

Existing agents reused: `architect` (gpt-5.1) doubles as proposer-A; `debugger`
(nemotron-ultra) doubles as hypothesist-A; `reviewer` / `reviewer-cheap` provide two review
families, with dimension-sharded prompts supplied by the command. Hypothesists B/C are
`proposer-b`/`proposer-c` with a debug-specific prompt from the command (agents are generic
"strong reasoner, family X" shells; the command supplies the task frame).

Each agent file notes a fallback model in a frontmatter comment for proxies missing the
primary (e.g. `proposer-c`: fallback `nemotron-3-super-120b-a12b`). `/setup` verifies all
referenced models against `opencode models` output.

### New commands (`.opencode/command/`)

**`/deep-design <question>`** — packet → architect + proposer-b + proposer-c each produce an
independent proposal (blind; they never see each other's output) → judge scores each against
a fixed rubric (fitness to constraints, simplicity, failure modes, migration cost) → 
synthesizer writes `DESIGN-<slug>.md`: winning approach, grafted ideas from losers, scores,
and the **dissent register** — every point where proposals disagreed, with the synthesizer's
resolution and confidence. Disagreement localizes where the hard judgment lives.

**`/deep-debug <symptom>`** — packet (symptom, repro, invariants, brief refs) → debugger +
proposer-b + proposer-c each return a ranked hypothesis table: hypothesis, evidence for,
evidence against, **falsification test**, cost-to-run → synthesizer merges/dedupes into one
table ranked by (plausibility × discriminating power ÷ cost) in `DEBUG-<slug>.md` →
orchestrator presents the cheapest discriminating experiment → human or executor runs it →
result appended, eliminated hypotheses struck → loop until one survivor → survivor + fix
plan recorded. Structurally kills guess-and-fix: no fix is proposed while ≥2 hypotheses live.

**`/deep-review [diff|files]`** — four dimension shards (correctness, security, performance,
API-misuse), each run as a fresh-context review: shards alternate between `reviewer` and
`reviewer-cheap` families → merged findings → `refuter` attacks each finding (is it real,
reachable, worth fixing?) → only CONFIRMED findings land in `REVIEW-<slug>.md`, each with
file:line, failure scenario, and the refuter's verdict. REFUTED findings are listed one-line
under "killed" for auditability.

**`/deep-read <area>`** — split `<area>` (or whole repo) into subsystems by directory
topology → `mapper` digests each subsystem into a capped brief section (public surface, key
flows, invariants, gotchas, dependency edges) → synthesizer assembles
`memory/briefs/CODEBASE-BRIEF.md` (or `BRIEF-<area>.md`), frontmatter stamped with `git_sha`.
**Incremental refresh:** on rerun, `git diff --stat <brief_sha>..HEAD` selects only changed
subsystems for re-mapping; untouched sections carry forward.

**`/council <question>`** — generic escape hatch: N blind answers (architect, proposer-b,
proposer-c) → synthesizer merges with dissent register → `COUNCIL-<slug>.md`. For any
question that doesn't fit the four shaped commands.

### AGENTS.md rail additions

- **Artifact-only rule:** never paste raw worker output into the main thread; reference the
  artifact path. The orchestrator reads artifacts, not exploration.
- **Routing hint:** analysis-heavy task → reach for `deep-*` before attempting single-model
  analysis inline. One-line table mapping task smell → command.

### Rot management

- **Brief staleness:** every `deep-*` command starts by comparing the brief's `git_sha` to
  HEAD; if drifted, warn and offer incremental `/deep-read` refresh of changed subsystems.
- **Session rot:** extend the existing `compaction.js` plugin (or add `rot-guard.js` if
  compaction's shape doesn't fit — decide after reading the current plugin during
  implementation): estimate session token usage; past a threshold, inject a reminder to push
  further reading into a worker and `/reground`.

## Error handling

- **Non-conforming worker output** (oversized, missing sections, wrong format): synthesizer
  is instructed to schema-check and discard; the command retries that worker once with a
  stricter format reminder, then proceeds with survivors. A council of 2 is still a council.
- **All workers fail:** command reports failure honestly and falls back to documenting a
  single-model answer clearly labeled `status: degraded` in the artifact.
- **Unresolved disagreement:** dissent register entry with `confidence: low`, surfaced to the
  human. Never force fake consensus.
- **Missing model on proxy:** agent frontmatter fallback + `/setup` verification.

## Eval

Three ablation tasks added to `eval/tasks/`, run kit-vs-baseline like the existing harness:

1. `task-deep-debug.md` — planted non-obvious root cause; measure: root cause found (not just
   symptom patched), experiments run before fix.
2. `task-deep-design.md` — design question with documented known trade-offs; measure: rubric
   coverage of known trade-offs vs single-shot Sonnet.
3. `task-deep-review.md` — diff with planted subtle bugs across dimensions; measure:
   planted-bug recall, false-positive rate (refuter's value shows here).

Same kill rule as the rest of the kit: if a stage's ablation delta is tiny, cut the stage.

## File inventory (new/changed)

```
.opencode/agent/{proposer-b,proposer-c,judge,mapper,refuter,synthesizer}.md   new
.opencode/command/{deep-design,deep-debug,deep-review,deep-read,council}.md   new
.opencode/skills/deep-analysis/SKILL.md                                       new
.opencode/templates/{DESIGN,DEBUG,REVIEW,BRIEF,COUNCIL}.template.md           new
.opencode/plugins/compaction.js (extend) or rot-guard.js (new)                changed/new
tools/council.mjs                                                             new (optional path)
eval/tasks/task-deep-{debug,design,review}.md                                 new
AGENTS.md (artifact-only rule + routing table)                                changed
USAGE.md, README.md (document the layer)                                      changed
.gitignore (+ .analysis/)                                                     changed
memory/briefs/ (dir, committed briefs live here)                              new
```

## What this does NOT do

Same posture as the rest of the kit: no sensitive data moves anywhere; every model call runs
through the approved proxy on approved data. The layer restructures *how* calls are made —
many small fresh-context calls with distilled inputs — not *what* data they see.
