# Eval task — deep-design: trade-off coverage on a known-answer design question

**Tier:** architecture (council)
**Work type:** greenfield
**Compares:** `/deep-design` vs a single-shot design from one strong reasoner (baseline)

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
