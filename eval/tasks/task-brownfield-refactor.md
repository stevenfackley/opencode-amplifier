# Eval task — brownfield: refactor to result-railway

**Tier:** brownfield (edit existing code)
**Work type:** brownfield

## Setup
Point this task at an existing module in a sandbox repo that currently uses exceptions or nested
null checks for expected failures (validation/not-found/conflict).

## Prompt
Refactor `<module>` to use the `result-railway` pattern for its expected failure modes, WITHOUT
changing its public behavior or breaking any caller.

## Acceptance tests (objective success)
- All pre-existing tests still pass (pass-to-pass — no regressions).
- Expected failures are now returned as `Result` values, not thrown (assert no exceptions on the
  known failure inputs).
- No public signature change visible to callers (or all callers updated consistently).

## Scoring notes
- This is the plan-drift / forbidden-files trap: did it stay within scope and keep invariants?
- Run `/consistency` — count violations.
