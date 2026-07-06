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
