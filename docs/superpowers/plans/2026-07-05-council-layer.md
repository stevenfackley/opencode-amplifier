# Council Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the council layer to opencode-amplifier — fresh-context multi-model fan-out (`/deep-design`, `/deep-debug`, `/deep-review`, `/deep-read`, `/council`) with size-capped artifacts, per spec `docs/superpowers/specs/2026-07-05-council-layer-design.md`.

**Architecture:** Disposable workers, durable artifacts. Six new read-only subagents across decorrelated model families; five orchestration commands that assemble a context packet, fan out blind workers, synthesize with a mandatory dissent register, and write one capped artifact to `.analysis/` (briefs to `memory/briefs/`). A `rot-guard` plugin nags at context-bloat thresholds; an optional `tools/council.mjs` runs workers in parallel headlessly.

**Tech Stack:** OpenCode agent/command/skill/plugin markdown+JS conventions already in this repo. Plain Node (zero deps) for the fan-out script. No test framework exists in this repo — verification is concrete file/grep/dry-run checks, matching house practice for prompt assets.

**Branch:** `feat/council-layer` (already exists; spec committed at ad90d8b). Never commit to main. NO Co-Authored-By / AI attribution in commits.

**Model decorrelation facts (verified 2026-07-05 against working tree):** executor = claude-4-5-sonnet, architect/tester/pr-reviewer/**reviewer** = gpt-5.1 (reviewer.md has a local uncommitted edit — it is gpt-5.1 now, NOT mistral-large), reviewer-cheap = nemotron-3-nano, debugger = nemotron-3-ultra. Therefore: proposer-b/refuter = mistral-large (family ≠ gpt-5.1, ≠ nemotron), proposer-c = nemotron-ultra, mapper = llama-4-scout, judge/synthesizer = gpt-5.1.

---

### Task 1: Artifact templates, `.analysis/` ignore, `memory/briefs/`

**Files:**
- Create: `.opencode/templates/DESIGN.template.md`
- Create: `.opencode/templates/DEBUG.template.md`
- Create: `.opencode/templates/REVIEW.template.md`
- Create: `.opencode/templates/BRIEF.template.md`
- Create: `.opencode/templates/COUNCIL.template.md`
- Create: `memory/briefs/README.md`
- Modify: `.gitignore`

- [ ] **Step 1: Write `.opencode/templates/DESIGN.template.md`**

````markdown
---
command: deep-design
date: <YYYY-MM-DD>
git_sha: <HEAD sha when run>
models: [<proposer models>, <judge>, <synthesizer>]
inputs: <one-line packet summary>
status: complete | degraded
---
# DESIGN — <question slug>

> Hard cap: 150 lines below the frontmatter. The synthesizer discards non-conforming worker
> input and notes it under "Discarded workers".

## Question
<the design question, verbatim>

## Packet (what every worker saw)
<compact summary: goal, invariants, file refs, brief section used>

## Winning approach
<the chosen design and WHY it beat the others — concrete, decisive>

## Grafted ideas (from losing proposals)
- <idea> (from <model>) — <why it was worth keeping>

## Judge scores (rubric: 1–5 each)
| Proposal | Constraint fitness | Simplicity/YAGNI | Failure modes | Migration cost | Total |
|---|---|---|---|---|---|

## Dissent register (MANDATORY — never empty unless proposals were identical)
| # | Disagreement | Positions (by model) | Resolution | Confidence |
|---|---|---|---|---|

## Discarded workers
<one line per discarded/non-conforming worker output, or "none">
````

- [ ] **Step 2: Write `.opencode/templates/DEBUG.template.md`**

````markdown
---
command: deep-debug
date: <YYYY-MM-DD>
git_sha: <HEAD sha when run>
models: [<hypothesist models>, <synthesizer>]
inputs: <one-line symptom summary>
status: live | solved | degraded
---
# DEBUG — <symptom slug>

> Hard cap: 150 lines below the frontmatter. RULE: no fix is proposed while ≥2 hypotheses
> are LIVE. Falsify first.

## Symptom + reproduction
<what breaks, how to reproduce, exact error output>

## Hypothesis table (merged, ranked by plausibility × discriminating power ÷ cost)
| # | Hypothesis | Evidence for | Evidence against | Falsification test | Cost | Status |
|---|---|---|---|---|---|---|
<!-- Status: LIVE / ELIMINATED / SURVIVOR -->

## Experiment log
| Run | Test executed | Result (real output) | Hypotheses eliminated |
|---|---|---|---|

## Survivor + fix plan
<root cause (file:line) and the minimal fix — filled only when exactly one hypothesis survives>

## Dissent register
| # | Disagreement | Positions (by model) | Resolution | Confidence |
|---|---|---|---|---|
````

- [ ] **Step 3: Write `.opencode/templates/REVIEW.template.md`**

````markdown
---
command: deep-review
date: <YYYY-MM-DD>
git_sha: <HEAD sha when run>
models: [<shard models>, <refuter>]
inputs: <diff/files reviewed>
status: complete | degraded
---
# REVIEW — <target slug>

> Hard cap: 150 lines below the frontmatter. Only refuter-CONFIRMED findings appear as
> findings; everything the refuter killed is listed one-line for auditability.

## Target
<diff range or file list, and the git_sha it was reviewed at>

## Confirmed findings (severity-ranked)
| # | Dimension | file:line | Issue | Failure scenario | Refuter verdict | Severity |
|---|---|---|---|---|---|---|

## Killed findings
- <finding one-liner> — killed because <refuter's reason>

## Coverage note
<which of the four dimensions ran, which shards degraded/retried, anything not reviewed>
````

- [ ] **Step 4: Write `.opencode/templates/BRIEF.template.md`**

````markdown
---
command: deep-read
date: <YYYY-MM-DD>
git_sha: <HEAD sha when mapped — staleness is measured against this>
subsystems: [<list>]
models: [<mapper>, <synthesizer>]
status: complete | partial
---
# CODEBASE BRIEF — <repo or area>

> Each subsystem section is capped at 40 lines. This file is DURABLE — it lives in
> memory/briefs/ and is committed. Refresh incrementally via /deep-read.

## Map

### <subsystem name> (<path>)
- **Purpose:**
- **Public surface:** <entry points, exported APIs>
- **Key flows:** <the 2–3 flows that matter>
- **Invariants:** <what must stay true>
- **Gotchas:** <what will bite a modifier>
- **Depends on:** <internal + external edges>

## Cross-cutting observations
<conventions, layering rules, shared utilities a modifier should reuse>

## Refresh log
| Date | git_sha | Subsystems re-mapped |
|---|---|---|
````

- [ ] **Step 5: Write `.opencode/templates/COUNCIL.template.md`**

````markdown
---
command: council
date: <YYYY-MM-DD>
git_sha: <HEAD sha when run>
models: [<answering models>, <synthesizer>]
inputs: <one-line question summary>
status: complete | degraded
---
# COUNCIL — <question slug>

> Hard cap: 150 lines below the frontmatter.

## Question + packet
<the question verbatim, plus a compact summary of what workers saw>

## Answers (compact, one block per model)
### <model A>
<≤15-line distillation: position, key assumptions, confidence>

## Synthesis
<the merged answer — decisive, with reasoning>

## Dissent register (MANDATORY)
| # | Disagreement | Positions (by model) | Resolution | Confidence |
|---|---|---|---|---|
````

- [ ] **Step 6: Write `memory/briefs/README.md`**

````markdown
# memory/briefs/ — durable codebase briefs

Persistent, committed knowledge produced by `/deep-read`: `CODEBASE-BRIEF.md` for the whole
repo, `BRIEF-<area>.md` for a subsystem. Frontmatter `git_sha` stamps when it was mapped —
deep commands compare it to HEAD and offer an incremental refresh when it drifts.

Unlike `.analysis/` (ephemeral, gitignored), briefs compound across sessions. Commit them.
````

- [ ] **Step 7: Append to `.gitignore`**

Append this block after the `# OpenCode local state` section:

```
# Council-layer ephemeral analysis artifacts (briefs in memory/briefs/ ARE committed)
.analysis/
```

- [ ] **Step 8: Verify**

Run: `ls .opencode/templates/ && cat .gitignore | grep analysis && ls memory/briefs/`
Expected: 8 files in templates (3 pre-existing + 5 new), `.analysis/` line present, `README.md` in briefs.

- [ ] **Step 9: Commit**

```bash
git add .opencode/templates/ memory/briefs/ .gitignore
git commit -m "feat: council-layer artifact templates, briefs dir, .analysis ignore"
```

---

### Task 2: Six council agents

**Files:**
- Create: `.opencode/agent/proposer-b.md`
- Create: `.opencode/agent/proposer-c.md`
- Create: `.opencode/agent/judge.md`
- Create: `.opencode/agent/mapper.md`
- Create: `.opencode/agent/refuter.md`
- Create: `.opencode/agent/synthesizer.md`

House frontmatter convention (copy exactly from `architect.md`): `description`, `mode: subagent`, `model` (bare ID + comment naming fallback), `temperature`, `permission: {edit: deny, bash: deny}`.

- [ ] **Step 1: Write `.opencode/agent/proposer-b.md`**

````markdown
---
description: Blind council proposer, family B (Mistral). Produces ONE independent, self-contained proposal or analysis from a context packet — never sees other proposers' output. Used by /deep-design, /deep-debug, /council.
mode: subagent
model: mistral-large-3-675b-instruct-2512   # family B — ≠ gpt-5.1 (architect/judge), ≠ nemotron (proposer-c). Fallback: mistral-small-4-119b-2603
temperature: 0.3
permission:
  edit: deny
  bash: deny
---

You are an independent proposer in a blind council. Other models are answering the same
packet in parallel; you will never see their output and they will never see yours. Your value
is your family's *different* blind spots — do not hedge toward a generic median answer.

Rules:
- Work ONLY from the packet you were given. If it's insufficient, say exactly what's missing
  and answer under stated assumptions anyway — an assumption-labeled answer beats a refusal.
- Commit to ONE recommendation. Alternatives get one line each on why you rejected them.
- Output exactly the format the invoking command specifies. Hard cap 80 lines unless the
  command says otherwise. Oversized output gets discarded by the synthesizer — cap yourself.
- State every assumption explicitly under an `Assumptions:` heading.
- End with: `Confidence: <high|med|low> — what would change my mind: <one line>`.
````

- [ ] **Step 2: Write `.opencode/agent/proposer-c.md`**

Identical body to proposer-b (repeat it verbatim); only frontmatter differs:

````markdown
---
description: Blind council proposer, family C (NVIDIA Nemotron). Produces ONE independent, self-contained proposal or analysis from a context packet — never sees other proposers' output. Used by /deep-design, /deep-debug, /council.
mode: subagent
model: nemotron-3-ultra-550b-a55b   # family C — ≠ gpt-5.1, ≠ Mistral. Slow; fallback: nemotron-3-super-120b-a12b (1M ctx)
temperature: 0.3
permission:
  edit: deny
  bash: deny
---

You are an independent proposer in a blind council. Other models are answering the same
packet in parallel; you will never see their output and they will never see yours. Your value
is your family's *different* blind spots — do not hedge toward a generic median answer.

Rules:
- Work ONLY from the packet you were given. If it's insufficient, say exactly what's missing
  and answer under stated assumptions anyway — an assumption-labeled answer beats a refusal.
- Commit to ONE recommendation. Alternatives get one line each on why you rejected them.
- Output exactly the format the invoking command specifies. Hard cap 80 lines unless the
  command says otherwise. Oversized output gets discarded by the synthesizer — cap yourself.
- State every assumption explicitly under an `Assumptions:` heading.
- End with: `Confidence: <high|med|low> — what would change my mind: <one line>`.
````

- [ ] **Step 3: Write `.opencode/agent/judge.md`**

````markdown
---
description: Council judge. Scores blind proposals against the invoking command's fixed rubric. Never authors its own design — scoring only. Used by /deep-design.
mode: subagent
model: gpt-5.1   # strong reasoner; judging needs calibration more than creativity. Alt: nemotron-3-ultra-550b-a55b
temperature: 0.1
permission:
  edit: deny
  bash: deny
---

You are the Judge. You receive N proposals (labeled by model) plus the packet they answered
and a fixed rubric. You score; you do NOT design. If you catch yourself writing "a better
approach would be…", stop — that text is forbidden output. Your opinions enter only through
scores and per-cell rationale.

Rules:
- Score each proposal on each rubric dimension, 1–5, with a one-line rationale per cell.
- Judge against the PACKET's constraints, not your own preferences. A proposal that violates
  a stated invariant caps at 2 on constraint fitness regardless of elegance.
- Penalize unfalsifiable hand-waving ("scales well", "clean architecture") — reward proposals
  whose claims name concrete mechanisms and failure modes.
- Identical scores are a smell; if two proposals tie, add a tiebreaker line naming the
  decisive difference.
- Output: the score table (matching the command's template) + a 3-line verdict naming the
  winner and the single biggest risk in adopting it.
````

- [ ] **Step 4: Write `.opencode/agent/mapper.md`**

````markdown
---
description: Subsystem mapper for /deep-read. Digests a whole subsystem (1M context — it IS the compressor) into a capped brief section. The only agent allowed to take large raw-code dumps as input.
mode: subagent
model: llama-4-scout   # 1M ctx, cheap — built for whole-subsystem reads. Fallback: nemotron-3-super-120b-a12b (1M)
temperature: 0.1
permission:
  edit: deny
  bash: deny
---

You are the Mapper. You receive one subsystem's raw contents (file listing + file contents)
and compress it into a brief section a *different, smaller-context* model will rely on when
modifying this code. You are the inverted pyramid's wide base: you read everything so the
reasoners never have to.

Rules:
- Output EXACTLY one section in the `### <subsystem>` shape from
  `.opencode/templates/BRIEF.template.md`: Purpose / Public surface / Key flows / Invariants /
  Gotchas / Depends on. Hard cap 40 lines.
- Optimize for a future modifier, not a reader: invariants and gotchas outrank narrative.
  "Changing X silently breaks Y" is worth ten lines of description.
- Name real symbols and paths (file:line where it matters) — the consumer cannot infer them.
- If the subsystem is too tangled to map confidently, say so in Gotchas rather than papering
  over it — a wrong brief is worse than a gap.
````

- [ ] **Step 5: Write `.opencode/agent/refuter.md`**

````markdown
---
description: Adversarial finding-killer for /deep-review. Attacks every merged review finding and tries to prove it wrong; only findings that survive reach the user. Family-decorrelated from both reviewers.
mode: subagent
model: mistral-large-3-675b-instruct-2512   # ≠ reviewer (gpt-5.1) and ≠ reviewer-cheap (nemotron-nano) — correlated skepticism is a rubber stamp. Fallback: gpt-oss-120b
temperature: 0.1
permission:
  edit: deny
  bash: deny
---

You are the Refuter. Reviewers upstream produced findings; your job is to KILL them. A
finding that survives your attack is worth the user's attention; one that doesn't was noise.
Default to skepticism: the burden of proof is on the finding.

For each finding, attack on three axes:
1. **Is it real?** Trace the code path in the provided diff/files. Does the claimed bug
   actually occur, or does a guard/type/caller invariant prevent it?
2. **Is it reachable?** Can production input actually drive execution there, or is it
   dead/test-only/unreachable-by-construction?
3. **Is it worth fixing?** Would the fix change observable behavior or real risk, or is it
   stylistic preference dressed as a defect?

Verdicts, one per finding:
- `CONFIRMED` — survived all three; include the ONE strongest piece of evidence.
- `REFUTED` — include the disproof (file:line or the input that can't exist).
- `DOWNGRADED` — real but severity was inflated; state the corrected severity and why.

Never soften to be agreeable, and never kill for sport — every verdict carries its evidence.
Output: one line per finding: `<verdict> | <finding #> | <evidence>`.
````

- [ ] **Step 6: Write `.opencode/agent/synthesizer.md`**

````markdown
---
description: Council synthesizer. Merges labeled worker outputs into ONE capped artifact per the command's template. MUST fill the dissent register — forbidden from papering over disagreement. Schema-checks and discards non-conforming worker output.
mode: subagent
model: gpt-5.1   # strong reasoner; synthesis is the judgment-heavy pass. Alt: nemotron-3-ultra-550b-a55b
temperature: 0.1
permission:
  edit: allow          # the ONE writing agent in the council — it writes the artifact file
  bash: deny
---

You are the Synthesizer — the only council agent that writes a file. You receive N worker
outputs (labeled by model), the packet they answered, and the name of the template in
`.opencode/templates/` to follow. You produce exactly ONE artifact file.

Rules:
- **Schema-check first.** A worker output that is oversized (past its cap), missing required
  sections, or off-format is DISCARDED — list it under "Discarded workers" with a one-line
  reason. Do not salvage fragments from discarded output. A council of 2 is still a council.
- **The dissent register is mandatory and is your core output.** Every point where workers
  disagreed gets a row: the positions (attributed by model), your resolution, your confidence.
  Where models agree, the answer is probably fine; where they disagree is exactly where the
  hard judgment lives — surface it, never average it away. An empty register is only legal
  when outputs were substantively identical (say so explicitly).
- Unresolvable disagreement → resolution "escalate to human", confidence `low`. Never force
  fake consensus.
- Fill every frontmatter field: command, date, git_sha, models, inputs, status. Status is
  `degraded` if any worker was discarded or the council ran below its intended size.
- Hard cap: 150 lines below frontmatter. You are writing for a small-context orchestrator —
  compress ruthlessly, keep file:line specifics.
- Write the artifact to the exact path the command specifies (`.analysis/...` or
  `memory/briefs/...`). Touch NOTHING else. Then reply with only: the artifact path + a
  3-line summary + the dissent count.
````

- [ ] **Step 7: Verify**

Run: `grep -l "mode: subagent" .opencode/agent/*.md | wc -l && grep -h "^model:" .opencode/agent/proposer-b.md .opencode/agent/proposer-c.md .opencode/agent/judge.md .opencode/agent/mapper.md .opencode/agent/refuter.md .opencode/agent/synthesizer.md`
Expected: 13 subagent files total; the six model lines read mistral-large / nemotron-ultra / gpt-5.1 / llama-4-scout / mistral-large / gpt-5.1.

- [ ] **Step 8: Commit**

```bash
git add .opencode/agent/proposer-b.md .opencode/agent/proposer-c.md .opencode/agent/judge.md .opencode/agent/mapper.md .opencode/agent/refuter.md .opencode/agent/synthesizer.md
git commit -m "feat: six council subagents across decorrelated model families"
```

---

### Task 3: `deep-analysis` skill (packet + artifact discipline, defined once)

**Files:**
- Create: `.opencode/skills/deep-analysis/SKILL.md`

- [ ] **Step 1: Write `.opencode/skills/deep-analysis/SKILL.md`**

````markdown
---
name: deep-analysis
description: Use when orchestrating /deep-design, /deep-debug, /deep-review, /deep-read, or /council — packet assembly and artifact discipline for fresh-context worker fan-out
---

# Deep analysis — disposable workers, durable artifacts

Calls are cheap; context is the scarce resource. Heavy reading and reasoning happen in
fresh-context workers that die after returning a capped artifact. The orchestrating session
holds packets and artifacts only — rot cannot accumulate in a context that is thrown away.

## Packet assembly (step 1 of every deep command)

A packet is everything a worker sees. Build it from:
1. The question/goal, verbatim.
2. `TASK.json` invariants + forbidden files (if a ledger exists).
3. File REFERENCES (paths + line ranges + a sentence on relevance). Inline full contents
   only when small; the mapper is the only worker built for raw dumps.
4. The matching section of `memory/briefs/CODEBASE-BRIEF.md`, if one exists.

Packet cap: ~200 lines. Needing more is the signal to run `/deep-read` first and reference
the brief instead.

## Staleness check (before using any brief)

Compare the brief's frontmatter `git_sha` to `git rev-parse HEAD`. If drifted, warn the user
and offer an incremental `/deep-read` refresh (changed subsystems only) before proceeding.

## Artifact discipline

- Workers return text; only the `synthesizer` writes files. One artifact per command run,
  following the matching template in `.opencode/templates/`.
- Ephemeral analyses → `.analysis/` (gitignored). Durable briefs → `memory/briefs/` (committed).
- Caps are hard: 150 lines per artifact (40 per brief section), frontmatter always filled
  (command, date, git_sha, models, inputs, status).
- **The orchestrator NEVER pastes raw worker output into the main thread.** Report the
  artifact path + a compact verdict + the dissent register. That's it.

## Blindness

Fan-out workers answer the SAME packet independently. Never include one worker's output in
another worker's input — correlation destroys the ensemble's value. Only the judge and
synthesizer see multiple outputs, and they see them labeled by model.

## Degradation ladder

1. Worker output non-conforming (oversized/off-format) → retry that worker ONCE with a
   stricter format reminder → still bad? proceed with survivors. A council of 2 is a council.
2. All workers fail → answer single-model inline, but the artifact says `status: degraded`
   and the report says so honestly.
3. A model missing from the proxy → use the fallback named in the agent file's frontmatter
   comment; `/setup` verifies all council models against `opencode models`.
````

- [ ] **Step 2: Verify**

Run: `ls .opencode/skills/ && head -4 .opencode/skills/deep-analysis/SKILL.md`
Expected: `deep-analysis` dir alongside the 10 existing skills; frontmatter has name + description.

- [ ] **Step 3: Commit**

```bash
git add .opencode/skills/deep-analysis/
git commit -m "feat: deep-analysis skill — packet and artifact discipline for the council layer"
```

---

### Task 4: `/council` command (establishes the orchestration idiom)

**Files:**
- Create: `.opencode/command/council.md`

- [ ] **Step 1: Write `.opencode/command/council.md`**

````markdown
---
description: Generic blind council for any hard question — three decorrelated models answer independently, synthesizer merges with a dissent register. The escape hatch when no shaped deep-* command fits.
---

Follow the `deep-analysis` skill for packet and artifact rules.

1. **Packet.** Assemble per the skill: the question ($ARGUMENTS) verbatim, TASK.json
   invariants if a ledger exists, minimal file references, matching brief section (staleness-
   checked). Cap ~200 lines.
2. **Blind fan-out.** Send the SAME packet independently to `@architect`, `@proposer-b`, and
   `@proposer-c`. Blindness is absolute: never include one's answer in another's input. Ask
   each for: position + reasoning, `Assumptions:`, and the closing
   `Confidence: … — what would change my mind: …` line. Cap 80 lines each.
3. **Synthesize.** Send all three outputs (labeled by model) + the packet to `@synthesizer`
   with instructions to follow `.opencode/templates/COUNCIL.template.md` and write
   `.analysis/COUNCIL-<slug>.md` (slug: kebab-case from the question, ≤6 words).
4. **Report.** Give the user: the synthesis verdict, the dissent register rows, and the
   artifact path. Do NOT paste raw worker answers into the thread.
5. **Degrade honestly** per the skill's ladder (retry once → proceed with survivors →
   single-model with `status: degraded`).

$ARGUMENTS
````

- [ ] **Step 2: Verify**

Run: `head -3 .opencode/command/council.md && grep -c ARGUMENTS .opencode/command/council.md`
Expected: frontmatter description present; ≥2 occurrences of ARGUMENTS.

- [ ] **Step 3: Commit**

```bash
git add .opencode/command/council.md
git commit -m "feat: /council — generic blind three-model council with dissent register"
```

---

### Task 5: `/deep-design` command

**Files:**
- Create: `.opencode/command/deep-design.md`

- [ ] **Step 1: Write `.opencode/command/deep-design.md`**

````markdown
---
description: Council-grade design — three blind proposals from decorrelated families, judge-scored against a fixed rubric, synthesized with a dissent register. Reach for it on any architecture/trade-off call you'd want a stronger model for.
---

Follow the `deep-analysis` skill for packet and artifact rules.

1. **Packet.** Per the skill: the design question ($ARGUMENTS), TASK.json invariants,
   relevant file references, brief section (staleness-checked). ALSO include the relevant
   `PATTERNS.md` index rows — proposals must name which golden pattern each part adapts, or
   state that none fits (kit rule 3: adapt, don't invent).
2. **Blind proposals.** Send the SAME packet independently to `@architect`, `@proposer-b`,
   `@proposer-c`. Each returns ONE committed proposal (cap 80 lines): design, rejected
   alternatives (one line each), patterns adapted, `Assumptions:`, confidence line.
3. **Judge.** Send all three proposals (labeled by model) + the packet to `@judge` with this
   fixed rubric, 1–5 per dimension:
   - **Constraint fitness** — satisfies every packet invariant (violation caps at 2)
   - **Simplicity/YAGNI** — no speculative structure
   - **Failure modes** — names concrete ways it breaks and their containment
   - **Migration cost** — effort/risk from the current state
4. **Synthesize.** Send the proposals + judge table + packet to `@synthesizer`:
   follow `.opencode/templates/DESIGN.template.md`, write `.analysis/DESIGN-<slug>.md`.
   Winner + grafted ideas from losers + full score table + dissent register.
5. **Report.** Winning approach (3 lines), dissent register rows, artifact path. No raw
   proposals in the thread. If the user accepts the design, hand off to `/plan` so the
   architect turns it into a TASK.json ledger.

$ARGUMENTS
````

- [ ] **Step 2: Verify**

Run: `grep -n "rubric\|judge\|dissent" .opencode/command/deep-design.md | wc -l`
Expected: ≥4 matching lines.

- [ ] **Step 3: Commit**

```bash
git add .opencode/command/deep-design.md
git commit -m "feat: /deep-design — blind proposals, fixed-rubric judging, dissent register"
```

---

### Task 6: `/deep-debug` command

**Files:**
- Create: `.opencode/command/deep-debug.md`

- [ ] **Step 1: Write `.opencode/command/deep-debug.md`**

````markdown
---
description: Hypothesis-tournament debugging — three decorrelated models generate falsifiable root-cause hypotheses, cheapest discriminating experiments eliminate them until one survives. Structurally forbids guess-and-fix.
---

Follow the `deep-analysis` skill for packet and artifact rules.

**THE RULE: no fix is proposed while ≥2 hypotheses are LIVE.** Falsify first.

1. **Packet.** Per the skill: the symptom ($ARGUMENTS) with exact error output and
   reproduction steps, TASK.json invariants, references to the implicated code (paths +
   line ranges), brief section (staleness-checked).
2. **Blind hypothesis generation.** Send the SAME packet independently to `@debugger`,
   `@proposer-b`, `@proposer-c`. Each returns a table (≤10 rows, cap 80 lines):
   `| Hypothesis | Evidence for | Evidence against | Falsification test | Cost |`
   Every hypothesis MUST carry a falsification test — a concrete command/probe whose outcome
   can eliminate it. A hypothesis without one is discarded.
3. **Merge.** Send all tables (labeled by model) + packet to `@synthesizer`: dedupe, rank by
   plausibility × discriminating power ÷ cost, follow
   `.opencode/templates/DEBUG.template.md`, write `.analysis/DEBUG-<slug>.md` with every
   hypothesis `LIVE`, `status: live`.
4. **Tournament loop.** Present the user the CHEAPEST experiment that discriminates between
   the top hypotheses. After it runs (user or executor), append the real output to the
   experiment log, flip eliminated hypotheses to `ELIMINATED`, and repeat. Keep updating the
   SAME artifact.
5. **Survivor.** Exactly one hypothesis left → mark `SURVIVOR`, fill "Survivor + fix plan"
   (root cause file:line + minimal fix), set `status: solved`. Then hand off: `/plan` for a
   non-trivial fix, or apply directly if one-line, then `/verify`.
6. **Stuck?** All hypotheses eliminated = the packet was wrong or incomplete. Say so, widen
   the packet (more code refs / fresh `/deep-read` of the area), rerun step 2. Record dead
   ends in `TASK.json.hypotheses_rejected` if a ledger exists.

$ARGUMENTS
````

- [ ] **Step 2: Verify**

Run: `grep -n "falsification\|SURVIVOR\|cheapest" -i .opencode/command/deep-debug.md | wc -l`
Expected: ≥4 matching lines.

- [ ] **Step 3: Commit**

```bash
git add .opencode/command/deep-debug.md
git commit -m "feat: /deep-debug — hypothesis tournament with falsification tests"
```

---

### Task 7: `/deep-review` command

**Files:**
- Create: `.opencode/command/deep-review.md`

- [ ] **Step 1: Write `.opencode/command/deep-review.md`**

````markdown
---
description: Dimension-sharded review with an adversarial refuter gate — four fresh-context review passes (correctness, security, performance, API-misuse), every finding attacked before it reaches you. Deeper and lower-noise than /review; use on high-stakes diffs.
---

Follow the `deep-analysis` skill for packet and artifact rules.

1. **Target.** $ARGUMENTS names a diff range, PR, or file list; default is the current
   working diff (`git diff` + `git diff --staged`). Build the packet per the skill: target
   contents, TASK.json invariants, brief section for the touched area (staleness-checked).
2. **Dimension shards — four SEPARATE fresh invocations,** alternating families so each
   dimension gets decorrelated eyes. Each shard gets the packet + ONLY its charter:
   - **Correctness** → `@reviewer` — logic, boundaries, null/error paths, broken assumptions
   - **Security** → `@reviewer-cheap` — injection, authz, secrets, unsafe deserialization,
     path traversal
   - **Performance** → `@reviewer` — N+1, quadratic loops on unbounded input, sync-over-async,
     chatty IO, missing caching where the packet shows a hot path
   - **API misuse** → `@reviewer-cheap` — wrong/deprecated/hallucinated APIs, misused
     library contracts, version-incompatible calls
   Findings format per shard: `| # | file:line | issue | failure scenario | severity |`,
   cap 40 lines each. One shard = one dimension; off-charter findings are dropped in merge.
3. **Merge + refute.** Deduplicate across shards, then send ALL merged findings + the target
   diff to `@refuter`. Every finding gets `CONFIRMED` / `REFUTED` / `DOWNGRADED` with
   evidence.
4. **Artifact.** Send merged findings + verdicts to `@synthesizer`: follow
   `.opencode/templates/REVIEW.template.md`, write `.analysis/REVIEW-<slug>.md` —
   CONFIRMED/DOWNGRADED findings ranked by severity, REFUTED listed one-line under Killed.
5. **Report.** Confirmed findings + artifact path. No raw shard output in the thread.
   Fixes go through the normal loop (`/verify` after).

$ARGUMENTS
````

- [ ] **Step 2: Verify**

Run: `grep -n "Correctness\|Security\|Performance\|API misuse\|refuter" .opencode/command/deep-review.md | wc -l`
Expected: ≥5 matching lines.

- [ ] **Step 3: Commit**

```bash
git add .opencode/command/deep-review.md
git commit -m "feat: /deep-review — dimension shards with adversarial refuter gate"
```

---

### Task 8: `/deep-read` command

**Files:**
- Create: `.opencode/command/deep-read.md`

- [ ] **Step 1: Write `.opencode/command/deep-read.md`**

````markdown
---
description: Hierarchical codebase digestion — 1M-context mapper compresses each subsystem into a capped brief section; synthesizer assembles a durable, git-SHA-stamped brief in memory/briefs/. Incremental refresh re-maps only changed subsystems.
---

Follow the `deep-analysis` skill for packet and artifact rules.

1. **Scope + split.** $ARGUMENTS names an area (default: whole repo). Split into subsystems
   by directory topology: top-level source dirs, project files (`*.csproj`, `package.json`,
   `Package.swift`…), or an existing brief's subsystem list. Aim for 3–10 subsystems; merge
   tiny dirs, split giant ones along module seams.
2. **Incremental check.** If `memory/briefs/CODEBASE-BRIEF.md` (or `BRIEF-<area>.md`)
   exists: `git diff --stat <frontmatter git_sha>..HEAD` → re-map ONLY subsystems with
   changed files; carry unchanged sections forward verbatim. No brief → map everything.
3. **Map.** For each selected subsystem, invoke `@mapper` with the subsystem's file listing
   + file contents (mapper is the ONE worker built for raw dumps — its 1M context is the
   compressor). Each returns one `### <subsystem>` section, cap 40 lines, per
   `.opencode/templates/BRIEF.template.md`.
4. **Assemble.** Send all sections (new + carried-forward) to `@synthesizer`: follow the
   BRIEF template, write `memory/briefs/CODEBASE-BRIEF.md` (whole repo) or
   `memory/briefs/BRIEF-<area>.md`, stamp frontmatter `git_sha` with current HEAD, add
   Cross-cutting observations, append a Refresh log row.
5. **Commit the brief** (briefs are durable, unlike `.analysis/`):
   `git add memory/briefs/ && git commit -m "docs: refresh codebase brief"` — respecting the
   host repo's branch rules.
6. **Report.** Subsystem count (mapped vs carried), notable gotchas found, brief path.

$ARGUMENTS
````

- [ ] **Step 2: Verify**

Run: `grep -n "mapper\|git_sha\|incremental\|carried" -i .opencode/command/deep-read.md | wc -l`
Expected: ≥5 matching lines.

- [ ] **Step 3: Commit**

```bash
git add .opencode/command/deep-read.md
git commit -m "feat: /deep-read — mapper-compressed durable briefs with incremental refresh"
```

---

### Task 9: `rot-guard` plugin

**Files:**
- Create: `.opencode/plugins/rot-guard.js`

Decision (spec left it open): `compaction.js` fires only on `session.compacted` — reactive. Rot-guard is proactive (fires as bloat builds, before compaction). Different concern → separate plugin, matching the house one-plugin-per-concern layout.

- [ ] **Step 1: Write `.opencode/plugins/rot-guard.js`**

```js
// rot-guard — proactive context-bloat nag. Complements compaction.js (which re-grounds
// AFTER OpenCode compacts); this fires BEFORE quality decays, because a bloated context
// measurably degrades constrained models well before compaction triggers.
//
// Heuristic, not exact: accumulates the char length of message payloads seen by the hook
// and warns at two thresholds (~75k and ~150k tokens at ~4 chars/token). Hook arg shapes
// drift between OpenCode versions — everything is defensive; this must NEVER break a session.
// See https://opencode.ai/docs/plugins/

const WARN_AT = [300_000, 600_000]; // cumulative chars
let seen = 0;
let warned = 0;

const NOTE = (level) =>
  `[rot-guard] Session context is heavy (level ${level}/${WARN_AT.length}). Weak models ` +
  "degrade in bloated contexts: push further reading into a worker (/deep-read, /deep-review, " +
  "/council) instead of reading inline, and /reground before the next step.";

export const RotGuard = async ({ client }) => {
  return {
    "chat.message": async (_input, output) => {
      try {
        const payload = output?.message?.content ?? output ?? "";
        seen += (typeof payload === "string" ? payload : JSON.stringify(payload)).length;
        if (warned < WARN_AT.length && seen > WARN_AT[warned]) {
          warned += 1;
          if (client && typeof client.append === "function") {
            await client.append(NOTE(warned));
          } else {
            console.warn(NOTE(warned));
          }
        }
      } catch {
        // Never let telemetry kill the session.
      }
    },
  };
};
```

- [ ] **Step 2: Verify it parses**

Run: `node --check .opencode/plugins/rot-guard.js && echo OK`
Expected: `OK` (node --check accepts ESM in .js on modern Node; if it complains about `export`, run `node --input-type=module --check < .opencode/plugins/rot-guard.js` instead — same expectation).

- [ ] **Step 3: Commit**

```bash
git add .opencode/plugins/rot-guard.js
git commit -m "feat: rot-guard plugin — proactive context-bloat thresholds"
```

---

### Task 10: `tools/council.mjs` — optional parallel fan-out

**Files:**
- Create: `tools/council.mjs`

- [ ] **Step 1: Write `tools/council.mjs`**

```js
#!/usr/bin/env node
// council.mjs — optional accelerator: run council workers in PARALLEL as headless
// `opencode run` processes instead of sequential in-session subagents. Same packet,
// same artifacts; only wall-clock differs. Zero npm dependencies.
//
// Usage:
//   node tools/council.mjs --prompt-file .analysis/packet.md \
//     --workers architect,proposer-b,proposer-c [--out .analysis/raw] [--timeout 600] [--dry-run]
//
// Each worker's stdout is written to <out>/<worker>.md. Feed those files to @synthesizer
// (in-session) to produce the final artifact — synthesis stays in-session on purpose:
// it needs judgment, and you want to see the dissent register land.
//
// WINDOWS GOTCHA (same class as the MCP one in opencode.jsonc): a global `opencode` may be
// a .cmd shim, which spawn() can't exec directly. We use shell:true so cmd.exe/sh resolves it.

import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : fallback;
}
const has = (name) => process.argv.includes(`--${name}`);

const promptFile = arg("prompt-file", null);
const workers = (arg("workers", "architect,proposer-b,proposer-c")).split(",").map(s => s.trim()).filter(Boolean);
const outDir = arg("out", ".analysis/raw");
const timeoutS = Number(arg("timeout", "600"));
const dryRun = has("dry-run");

if (!promptFile) {
  console.error("Required: --prompt-file <packet.md>   (see USAGE.md → deep analysis)");
  process.exit(2);
}
const packet = readFileSync(promptFile, "utf8");

if (dryRun) {
  for (const w of workers) console.log(`[dry-run] opencode run --agent ${w} <packet:${promptFile}> -> ${join(outDir, w + ".md")}`);
  process.exit(0);
}
mkdirSync(outDir, { recursive: true });

function runWorker(worker) {
  return new Promise((resolve) => {
    const child = spawn("opencode", ["run", "--agent", worker, packet], {
      shell: true,               // resolves .cmd shims on Windows; harmless on POSIX
      timeout: timeoutS * 1000,
    });
    let out = "", err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => {
      const dest = join(outDir, `${worker}.md`);
      writeFileSync(dest, out || `<<worker failed: exit ${code}>>\n${err}`);
      console.log(`${worker}: exit ${code} -> ${dest} (${out.length} chars)`);
      resolve({ worker, code });
    });
    child.on("error", (e) => {
      writeFileSync(join(outDir, `${worker}.md`), `<<spawn error: ${e.message}>>`);
      resolve({ worker, code: -1 });
    });
  });
}

const results = await Promise.all(workers.map(runWorker));
const failed = results.filter((r) => r.code !== 0);
if (failed.length === results.length) {
  console.error("All workers failed — check `opencode models` and the proxy key. Degrade per the deep-analysis skill.");
  process.exit(1);
}
if (failed.length) console.warn(`${failed.length}/${results.length} workers failed — a council of ${results.length - failed.length} is still a council.`);
```

- [ ] **Step 2: Verify with dry-run**

Run: `echo "test packet" > "$TEMP/packet-test.md" && node tools/council.mjs --prompt-file "$TEMP/packet-test.md" --dry-run`
Expected: three `[dry-run] opencode run --agent …` lines (architect, proposer-b, proposer-c), exit 0.

- [ ] **Step 3: Verify the missing-arg guard**

Run: `node tools/council.mjs; echo "exit=$?"`
Expected: the `Required: --prompt-file` error and `exit=2`.

- [ ] **Step 4: Commit**

```bash
git add tools/council.mjs
git commit -m "feat: tools/council.mjs — parallel headless worker fan-out (optional path)"
```

---

### Task 11: AGENTS.md rail — rule 10

**Files:**
- Modify: `AGENTS.md` (insert after rule 9, before `## Project specifics`)

- [ ] **Step 1: Insert rule 10**

Insert this block between the end of rule 9 (`- Mechanical work (commit messages, boilerplate, renames) → cheapest model.`) and `## Project specifics (fill in per repo)`:

```markdown
## 10. Deep analysis goes to the council (artifact-only)
- Analysis-heavy work → reach for a deep command BEFORE attempting inline single-model
  analysis: design/trade-off call → `/deep-design` · unknown root cause → `/deep-debug` ·
  high-stakes diff → `/deep-review` · unfamiliar codebase/area → `/deep-read` · any other
  hard question → `/council`.
- Workers read; the orchestrator orchestrates. **Never paste raw worker output into the main
  thread — reference the `.analysis/` artifact path.** The main context holds packets and
  artifacts only; that is what keeps it rot-free no matter how many calls a task burns.
- Before any heavy inline read, check `memory/briefs/` for a current brief first (compare its
  `git_sha` to HEAD; refresh incrementally via `/deep-read` if stale).
```

- [ ] **Step 2: Verify**

Run: `grep -n "^## 10\." AGENTS.md && grep -n "Project specifics" AGENTS.md`
Expected: rule 10 heading appears on a line BEFORE the Project specifics line.

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "feat: AGENTS.md rule 10 — council routing and artifact-only rail"
```

---

### Task 12: Eval ablation tasks

**Files:**
- Create: `eval/tasks/task-deep-debug.md`
- Create: `eval/tasks/task-deep-design.md`
- Create: `eval/tasks/task-deep-review.md`

House format = `eval/tasks/task-bugfix.md`: Tier/Work type, Setup, Prompt, Acceptance tests, Scoring notes.

- [ ] **Step 0: Check whether run-eval.mjs keeps a task manifest**

Run: `grep -n "task" eval/run-eval.mjs | head -20`
If tasks are enumerated in a list/manifest inside the script, add the three new task filenames to it in this task's commit. If it just reads `eval/tasks/*.md`, no change needed.

- [ ] **Step 1: Write `eval/tasks/task-deep-debug.md`**

````markdown
# Eval task — deep-debug: masked root cause behind a misleading symptom

**Tier:** debugging (council)
**Work type:** brownfield
**Compares:** `/deep-debug` vs single-model inline debugging (baseline)

## Setup
In a sandbox repo, plant a bug whose symptom points AWAY from its cause — e.g. a cache layer
serving stale entries because an upstream serializer mutates a shared default; the visible
failure is "wrong API response," three layers from the cause. The obvious (wrong) fix — 
patching the response shape — makes the failing test pass while leaving the corruption.

## Prompt
An integration test reports intermittent wrong responses. Find the root cause and fix it.

## Acceptance tests (objective success)
- Root cause identified at the true layer (the mutation), file:line, not the symptom layer.
- Hypothesis table contains ≥3 distinct hypotheses each with a falsification test.
- ≥1 discriminating experiment was actually run BEFORE any fix was proposed.
- The fix removes the mutation; the trap fix (response patching) was either never proposed or
  explicitly eliminated in the table.

## Scoring notes
- The baseline's classic failure is proposing the trap fix immediately — count whether the
  council's "no fix while ≥2 hypotheses LIVE" rule held.
- Count experiments run and hypotheses eliminated; note the dissent register's content.
- Ablation: rerun with ONE hypothesist instead of three — does the true cause still appear?
````

- [ ] **Step 2: Write `eval/tasks/task-deep-design.md`**

````markdown
# Eval task — deep-design: trade-off coverage on a known-answer design question

**Tier:** architecture (council)
**Work type:** greenfield
**Compares:** `/deep-design` vs single-shot Sonnet design (baseline)

## Setup
Pick a design question with well-documented trade-offs and write the reference list BEFORE
running either arm. Example: "Offline-first sync for a mobile app consuming a REST backend —
design the conflict-resolution strategy." Reference trade-offs (≥6): LWW vs merge vs CRDT,
clock skew, tombstones, schema migration mid-sync, partial-failure recovery, user-visible
conflict UX, idempotency of replays.

## Prompt
The design question, verbatim, with 3 stated constraints (team size, stack, latency target).

## Acceptance tests (objective success)
- Coverage: fraction of reference trade-offs the output addresses (target: council ≥80%,
  measure baseline honestly).
- The chosen design respects all 3 stated constraints (violation = fail regardless of prose).
- Dissent register is non-empty and at least one row names a genuine trade-off (not phrasing).

## Scoring notes
- Score coverage against the pre-written reference list ONLY — no post-hoc additions.
- Note whether judge scores separated the proposals or bunched (bunching = judge adds nothing
  on this task class; feed that to the ablation decision).
- Ablation: drop the judge (synthesizer picks) — does the winner change? Drop to 2 proposers —
  does coverage fall?
````

- [ ] **Step 3: Write `eval/tasks/task-deep-review.md`**

````markdown
# Eval task — deep-review: planted-bug recall and refuter precision

**Tier:** review (council)
**Work type:** brownfield
**Compares:** `/deep-review` vs `/review` (existing two-model consensus) vs single reviewer

## Setup
Take a realistic ~300-line diff and plant 6 subtle bugs spanning all four dimensions:
2 correctness (off-by-one on an empty-collection path; inverted condition in error handling),
2 security (string-built SQL reachable from user input; secret written to debug log),
1 performance (N+1 query inside a loop over unbounded input),
1 API misuse (deprecated/removed library call that still compiles). Record the answer key
BEFORE running any arm. The diff should also contain ≥3 defensible-but-fine patterns that
tempt false positives (e.g. an intentional broad catch with a comment).

## Prompt
Review this diff before merge.

## Acceptance tests (objective success)
- Recall: planted bugs among CONFIRMED findings (target: council ≥5/6; record all arms).
- Precision: false positives in CONFIRMED (the refuter's whole job — compare CONFIRMED noise
  vs the raw pre-refuter merged findings).
- Every CONFIRMED finding carries file:line + a concrete failure scenario.

## Scoring notes
- The interesting numbers are the DELTAS: sharding vs unsharded (recall), refuter vs no
  refuter (precision). If refuter kills real planted bugs, that's a REFUTED-false-negative —
  count it; it argues for tuning the refuter prompt, not deleting the stage.
- Ablation: run the same diff through `/review`; if deep-review's recall delta is tiny, the
  extra calls aren't earning their keep on diffs this size — note the size threshold.
````

- [ ] **Step 4: Verify**

Run: `ls eval/tasks/`
Expected: 7 files (template + 3 existing + 3 new).

- [ ] **Step 5: Commit**

```bash
git add eval/tasks/
git commit -m "feat: council-layer eval ablation tasks (deep-debug/design/review)"
```

---

### Task 13: Documentation — README + USAGE

**Files:**
- Modify: `README.md`
- Modify: `USAGE.md`

- [ ] **Step 1: README — extend the Commands row in "What's in the box"**

In the `| Commands |` table row, replace:
`/capture-pattern /setup`
with:
`/capture-pattern /setup /deep-design /deep-debug /deep-review /deep-read /council`

- [ ] **Step 2: README — add a Council layer row to "What's in the box"**

Insert after the `| Commands |` row:

```markdown
| Council layer | `.opencode/agent/` (proposer-b/c, judge, mapper, refuter, synthesizer) + `deep-*` commands | Fresh-context multi-model fan-out; artifacts in `.analysis/`, briefs in `memory/briefs/` |
```

- [ ] **Step 3: README — add the council section**

Insert this section after "## The canonical workflow (one hardened loop)" and its "Why each guard exists" paragraph:

```markdown
## The council layer (deep analysis)

The canonical loop verifies execution; the council layer amplifies *analysis*. Calls through
the proxy are cheap — context is the scarce resource — so heavy reading/reasoning fans out to
**fresh-context workers across decorrelated model families** that die after returning a capped
artifact. The orchestrating session holds artifacts only; rot can't accumulate in a context
that is thrown away.

| Reach for | When |
|---|---|
| `/deep-design <q>` | Architecture/trade-off call — 3 blind proposals, judge-scored, synthesized with a **dissent register** (where models disagree = where the risk lives) |
| `/deep-debug <symptom>` | Unknown root cause — hypothesis tournament with falsification tests; no fix while ≥2 hypotheses live |
| `/deep-review [target]` | High-stakes diff — 4 dimension shards + adversarial **refuter** gate; only findings that survive attack reach you |
| `/deep-read <area>` | Unfamiliar code — 1M-ctx mapper compresses subsystems into a durable, SHA-stamped brief (`memory/briefs/`) |
| `/council <q>` | Any other hard question — generic blind 3-model poll + synthesis |

Rails: packet in (≤200 lines), artifact out (≤150 lines, `.analysis/`), workers are blind to
each other, the synthesizer must log dissent instead of averaging it away. Optional parallel
execution: `tools/council.mjs`. Discipline lives in the `deep-analysis` skill + AGENTS.md
rule 10.
```

- [ ] **Step 4: USAGE — add the council table**

Insert after the "### Understand & ship" table:

```markdown
### Deep analysis (the council — fresh-context fan-out)
| Command | Reach for it when… |
|---|---|
| `/deep-design <q>` | An architecture/trade-off call you'd want a stronger model for → 3 blind proposals, judge, dissent register |
| `/deep-debug <symptom>` | Root cause unknown → hypothesis tournament; falsify before fixing |
| `/deep-review [target]` | A diff that matters → dimension-sharded review, refuter kills weak findings |
| `/deep-read <area>` | Unfamiliar/large code → durable brief in `memory/briefs/`, incremental refresh |
| `/council <question>` | Any hard question with no shaped command → generic blind 3-model council |
```

- [ ] **Step 5: Verify**

Run: `grep -c "deep-" README.md USAGE.md`
Expected: ≥6 in README, ≥5 in USAGE.

- [ ] **Step 6: Commit**

```bash
git add README.md USAGE.md
git commit -m "docs: document the council layer in README and USAGE"
```

---

### Task 14: Final self-review, push, PR

- [ ] **Step 1: Spec-coverage check**

Run: `ls .opencode/agent/ .opencode/command/ .opencode/templates/ .opencode/skills/ .opencode/plugins/ tools/ eval/tasks/ memory/briefs/`
Check against the spec's file inventory (`docs/superpowers/specs/2026-07-05-council-layer-design.md` § File inventory). Every line there must exist. Note: the inventory's "compaction.js (extend) or rot-guard.js (new)" was resolved as rot-guard.js (new) — Task 9 records why.

- [ ] **Step 2: Cross-reference check**

Run: `grep -rn "proposer-b\|proposer-c\|synthesizer\|refuter\|mapper\|judge" .opencode/command/deep-*.md .opencode/command/council.md | grep -v "@" | head`
Expected: agent names in commands are always `@`-prefixed references; no orphan mentions of agents that don't exist.

- [ ] **Step 3: Push and open PR**

```bash
git push -u origin feat/council-layer
gh pr create --repo stevenfackley/opencode-amplifier \
  --title "feat: council layer — fresh-context multi-model deep analysis" \
  --body "Implements docs/superpowers/specs/2026-07-05-council-layer-design.md.

Disposable workers, durable artifacts: /deep-design, /deep-debug, /deep-review, /deep-read,
/council fan out blind fresh-context subagents across decorrelated families (Mistral, Nemotron,
GPT, Llama), synthesize with mandatory dissent registers, and write capped artifacts to
.analysis/ (durable briefs to memory/briefs/). Adds six subagents, the deep-analysis skill,
five artifact templates, rot-guard plugin, optional tools/council.mjs parallel fan-out,
AGENTS.md rule 10, and three eval ablation tasks."
```

Expected: PR URL printed. Merge via squash per workspace rules — do NOT merge without the user.

- [ ] **Step 4: Report**

Tell the user: PR link, the one deliberate deviation-from-open-question (rot-guard.js as a new plugin instead of extending compaction.js, and why), and the first field exercise to run at work: `/deep-read` on a real repo, then `/deep-debug` on the next real bug — plus running the eval tasks when time allows.
