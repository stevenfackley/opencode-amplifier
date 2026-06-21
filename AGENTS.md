# AGENTS.md — standing rules for every agent

These apply to **every** turn. They exist because constrained models drop advanced patterns,
skip verification, game tests, and lose the thread on long tasks unless the rules are enforced
by artifacts and hooks — not just stated once. Re-read the relevant rule at the point you act;
a rule stated globally but ignored locally is wallpaper.

> Design principle: **contract-governed, not prompt-governed.** Prefer a checkable artifact
> (TASK.json, a locked test, a consistency check) over a promise to behave.

## 1. Plan into a ledger, then execute in small steps
- Non-trivial work starts with `/plan` (the `architect`), which emits **`TASK.json`** — the
  single source of truth (goal, invariants, touched/forbidden files, steps, acceptance tests).
- Execute **one step per turn, then stop.** Update `TASK.json` (`status`, `evidence`,
  `current_step`, `deviations`) every turn. The ledger is your memory; trust it over recollection.
- A step's unit of work is a coherent slice, not necessarily one file — but never so large it
  can't be verified in a turn.

## 2. Re-ground on long tasks (fight context decay)
- `TASK.json` = immutable brief + active step. `STATE.md` = compressed history. On long tasks,
  rely on these two, not the full transcript.
- Run `/reground` before a step if context is heavy or after a compaction: re-read `TASK.json`,
  `STATE.md`, and the ACTUAL current contents of the files you'll touch. Files win over memory.

## 3. Adapt, don't invent (architecture)
- Before designing anything non-trivial, consult `PATTERNS.md`. Pick a pattern by **fit**
  (its `applicability` predicates match, `forbidden_contexts` don't), not by similarity.
- Pull it with `/pattern <name>` and adapt it. If none fits, say so and propose capturing one.

## 4. Tests are a locked contract (no verification gaming)
- For non-trivial features, the **`tester`** (a different model, via `/spec-tests`) writes
  failing spec tests from `TASK.json` BEFORE implementation — it never sees your code.
- During implementation, **test files are locked** (set `TDD_LOCK_TESTS=1`; the `tdd-lock`
  plugin blocks edits). You make the code satisfy the tests, never the reverse. Changing a test
  is an explicit, surfaced decision recorded as a `deviation`.

## 5. Verification is mandatory and evidence-based
- Never claim a step/task done without running build + full tests and showing **real output**.
- "Tests pass" ≠ "plan satisfied." Run `/consistency`: every invariant present (file:line), no
  forbidden file touched, no unjustified unplanned edit.
- A finished task ships a merge-readiness pack via `/evidence`.

## 6. Review across models
- After a non-trivial change, run `/review`: `reviewer` (strong, different model than executor)
  + `reviewer-cheap` (cheap, different family). Findings both raise = high confidence.
- For contested decisions, `/cross-check`.

## 7. Recover, don't thrash
- Commit per completed step (so "last green" exists). If stuck after ~2 non-advancing retries
  (the `escalation` plugin will warn), choose: `/debug`, escalate the step to a strong model, or
  `/revert-green` and re-plan. Record dead ends in `TASK.json.hypotheses_rejected`.

## 8. Be honest about state
- Failing tests, skipped steps, uncertainty — say so with the real output. Report only what you
  verified.

## 9. Model tiering (cost discipline)
- Reasoning roles (architect, tester, debugger, primary reviewer) → strong models.
- Executor → Sonnet 4.5. Decorrelated reviewer → a cheap model.
- Mechanical work (commit messages, boilerplate, renames) → cheapest model.

## Project specifics (fill in per repo)
- Build / test / lint commands: `<...>`
- Conventions worth repeating: `<naming, error handling, layering>`
