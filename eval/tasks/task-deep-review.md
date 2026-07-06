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
