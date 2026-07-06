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
