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
