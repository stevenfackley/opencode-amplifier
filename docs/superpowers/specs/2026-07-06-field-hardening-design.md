# Field hardening layer — design

**Date:** 2026-07-06
**Status:** approved (design review in-session)
**Builds on:** `2026-07-05-council-layer-design.md` (PR #9) and the headless fixes in PR #10.

## Context

The council layer shipped and its headless path is verified, but three field frictions
remain, plus one class of risk PR #10 exposed:

1. **First-run breakage is discovered mid-task.** The 2026-07-06 smoke test took hours to
   root-cause failures (silent subagent fallback, stdin hang, argv mangling) that a script
   could detect in seconds. Every new machine / proxy change / OpenCode upgrade re-runs that
   risk by hand.
2. **Context rot has a nag but no fix.** `rot-guard` warns at 300k/600k cumulative chars;
   the only real remedy — a fresh session — loses all working state, so the warning gets
   ignored.
3. **Packet assembly is manual.** Packets are the unit of the entire council layer, and
   building one burns orchestrator context (the thing the layer exists to protect) or human
   patience. There is also no way to run a review headless end-to-end because nothing turns
   a diff into a packet.
4. **Fallback models are fiction.** Every agent declares a fallback in a *comment*; nothing
   reads comments. When nemotron-ultra times out, the council silently shrinks.

## Goals

- One command that proves the kit is live on a given machine before any real work.
- A controlled path from a rotted session to a fresh one with zero state loss.
- Packets assembled by script from a question + diff/globs, with hard cap enforcement.
- Declared fallbacks actually fire on worker failure.

## Non-goals

- No new analysis commands or agents (council layer is feature-complete pending field use).
- No embedding/RAG infrastructure; no live pipelines requiring work-network approvals.
- No attempt to make `/handoff`//`/resume` machine-verifiable at home — they are prompt-only
  and get validated in the first real work session.

## Component 1: `tools/doctor.mjs` — first-run verifier

Zero-dependency Node ESM, same conventions as `council.mjs` (exit 0 = pass, 1 = failures,
2 = usage error; stdin of spawned `opencode` always closed).

**Static checks (always run):**
- `opencode` resolves on PATH; version printed.
- Every `.opencode/agent/*.md` frontmatter parses (YAML between `---` fences); collects
  `model:`, `mode:`, `fallback:`, `permission:` per agent.
- Mode policy holds: `synthesizer` is `mode: subagent` AND the only agent with
  `permission.edit: allow`; every other agent is `mode: all` (see Component 5).
- Every declared `fallback:` names a model ≠ the agent's primary.
- `.opencode/templates/*.template.md` present (DESIGN, DEBUG, REVIEW, BRIEF, COUNCIL,
  HANDOFF); `.analysis/` is gitignored; `memory/briefs/` exists.
- `opencode.jsonc` provider block contains no placeholder markers (`YOUR-`, `<...>`,
  `changeme` — case-insensitive).

**Live checks (default; `--offline` skips):**
- `opencode models` output contains every pinned model and every declared fallback.
  Missing fallback = WARN, missing primary = FAIL.
- One round-trip per **unique** model: `opencode run -m <model> "Reply with exactly: OK"`,
  stdin closed, 60s timeout each. Timeout/garbage = FAIL for that model.
- One `--agent architect` probe asserting stderr does NOT match
  `/falling back to default agent/i` — proves agent-mode wiring end-to-end.

**Output:** aligned PASS/WARN/FAIL table, one line per check, summary count, exit code.
No `--json` (YAGNI). Live-model checks run sequentially — doctor optimizes for clarity of
failure, not wall-clock.

## Component 2: `/handoff` + `/resume` — controlled session rebirth

**`/handoff` (command):** distill the current session into `.analysis/handoff.md` —
single slot, overwritten each time, gitignored. Uses new `HANDOFF.template.md`:

- frontmatter: `date`, `git_sha`, `branch`, `task` (one line)
- `## Status` — done / in-progress / not-started, each with one-line evidence
- `## Decisions` — each with the *reason* (a decision without its why gets re-litigated)
- `## Open threads` — unresolved questions, suspicions, known-unverified assumptions
- `## Files touched` — path + one-line what/why
- `## Next step` — exactly one, concrete enough to execute without re-derivation

Hard cap 120 lines: the command must prioritize; overflow means it summarized instead of
distilled. Final message to the user: "Handoff written. Kill this session, start fresh,
run `/resume`."

**`/resume` (command):** read `.analysis/handoff.md`; if missing, say so and stop. Compare
recorded `git_sha` to current HEAD — on mismatch, list what changed (`git log --oneline
<sha>..HEAD`) before trusting the handoff's file claims. Restate the next step in one line,
then execute it. The slot is not deleted — it lives until the next `/handoff` overwrites it.

**`rot-guard.js` (edit):** warning text changes from generic advice to the concrete
protocol: "Context past N chars — run `/handoff`, restart, `/resume`."

**AGENTS.md (edit):** rule 10 gains the rot response rail: when rot-guard fires mid-task,
finish the current step, then `/handoff` — don't push a rotted context through analysis.

## Component 3: `tools/packet.mjs` — packet assembly

Zero-dependency Node ESM. Inputs:

- `--question "<text>"` — required; exit 2 without it.
- `--diff [ref]` — optional; `git diff <ref>` output (default `HEAD`, i.e. staged +
  unstaged). Mutually composable with `--files`.
- `--files "<glob>[,<glob>…]"` — optional; each matched file included with a `### <path>`
  header and line numbers.
- `--out <path>` — default `.analysis/packet.md`.
- `--max-lines <n>` — default 200 (the council-layer packet budget).

Output format matches the council packet convention: frontmatter (`date`, `git_sha`,
`sources:` list), `## Question`, `## Constraints` (stub the user fills or leaves), then one
section per source.

**Cap enforcement:** if assembled content exceeds `--max-lines`, FAIL (exit 1) with a
per-source line-count table and the suggestion hierarchy: tighten the glob → point at a
`memory/briefs/` brief instead of raw code → raise `--max-lines` deliberately. Never
silently truncate — a truncated packet is a lying packet, and blind workers can't know.

**What it unlocks:** fully headless review with zero session:
`node tools/packet.mjs --diff origin/main --question "review this"` then
`node tools/council.mjs --workers reviewer,reviewer-cheap --prompt-file
.analysis/packet.md`. Requires Component 5.

## Component 4: fallback retry in `council.mjs`

**Declaration:** new `fallback:` frontmatter key in each agent file that has one (source of
truth stays with the agent; the existing comments become the key). OpenCode's tolerance of
unknown frontmatter keys is **verified as an explicit implementation task**: add the key to
one agent, confirm `opencode agent list` (or a run) neither errors nor changes behavior. If
OpenCode rejects unknown keys, contingency is a `FALLBACKS` map at the top of `council.mjs`
with a comment binding it to the agent files. Doctor validates whichever form ships.

**Behavior (council.mjs):** a worker counts as failed on non-zero exit, fallback-warning
match, or timeout (`code: null`). On first failure, if the worker declares a `fallback:`
and neither `--no-retry` nor `--model` is set (a `--model` run is already one family —
retrying inside it is pointless), re-spawn once with `-m <fallback>`. The retried worker's
artifact gets a first line `<!-- degraded: ran on fallback model <id> -->` so the
synthesizer and the human can weigh it. Console logs the retry. Second failure = worker
dead, existing degradation ladder applies.

council.mjs reads the `fallback:` key by parsing agent frontmatter itself (it already knows
the `.opencode/agent/` path; ~10 lines of fence-splitting, no YAML dependency for a
single scalar key).

## Component 5: agent mode policy

Replaces PR #10's ad-hoc four with one rule:

> **Every read-only agent is `mode: all`. `synthesizer` — the only agent with
> `permission.edit: allow` — stays `mode: subagent`, deliberately out of the primary
> rotation.**

Concretely: `judge`, `refuter`, `reviewer`, `reviewer-cheap`, `tester`, `debugger`,
`designer`, `pr-reviewer` flip to `mode: all` (architect, proposer-b/c, mapper already are).
Each carries the one-line comment explaining why (headless `--agent` only accepts
primaries). Doctor enforces the policy as a static check, so future agents can't regress it.

Trade-off accepted: the TUI's primary-agent rotation gets longer. The alternative —
maintaining a per-agent whitelist of "headless-worthy" workers — is exactly the kind of
drift-prone hand-list this repo keeps getting burned by.

## Error handling conventions (all three scripts)

- Exit 0 success / 1 runtime or check failure / 2 usage error.
- Spawned `opencode` always gets stdin piped-then-closed or `ignore` — never inherited.
- Prompts travel over stdin, never argv (newline truncation + Windows ~8k cmd-line cap).
- Fallback-warning stderr is always treated as failure, never success.

## Verification plan

Home (Copilot stand-in models, same A/B method as the PR #10 smoke):
- doctor: run on this repo (expect PASS with `--offline` caveats noted), then break things
  deliberately — placeholder in opencode.jsonc, `mode: subagent` on a worker, bogus
  `fallback:` — and confirm each FAILs with a pointed message.
- packet.mjs: `--files` and `--diff` assembly; cap overflow produces the line-count table
  and exit 1; output frontmatter parses.
- council.mjs retry: point a worker's fallback at a reachable model, force the primary to
  fail (unreachable pin), confirm exactly one retry + degraded marker; `--no-retry` and
  `--model` suppress it.
- Mode policy: doctor's static check green after Component 5 lands.

Work (first real session):
- `node tools/doctor.mjs` before anything else.
- Live `/handoff` → restart → `/resume` on a real task — the only path that validates
  Component 2.

## File inventory

```
tools/doctor.mjs                                   new
tools/packet.mjs                                   new
tools/council.mjs                                  edit (fallback retry, --no-retry)
.opencode/command/handoff.md                       new
.opencode/command/resume.md                        new
.opencode/templates/HANDOFF.template.md            new
.opencode/agent/{judge,refuter,reviewer,reviewer-cheap,tester,debugger,designer,pr-reviewer}.md
                                                   edit (mode: all)
.opencode/agent/*.md                               edit (fallback: key where a fallback is declared)
.opencode/plugins/rot-guard.js                     edit (warning text → handoff protocol)
AGENTS.md                                          edit (rule 10: rot response rail)
USAGE.md, README.md                                edit (docs)
```
