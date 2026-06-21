---
name: verification-before-completion
description: Use before claiming ANY task or step is done. Forces real evidence — run the build/tests, show output, and confirm the plan's invariants are actually present. Constrained models declare success without checking; this is the gate that stops it.
---

# Verification Before Completion

The single most common constrained-model failure is the confident false "done." This skill is
the gate every step and task must pass before you may report success.

## You may NOT claim done until all of these are true and shown
1. **It builds.** Run the build. Paste the result.
2. **Tests pass.** Run the full suite (not just the new test). Paste the summary line.
3. **The new behavior is actually tested.** Point to the test that exercises it and was seen
   to fail before / pass after.
4. **Plan invariants hold.** Cross-check the change against `TASK.json`: every promised file
   changed, every invariant implemented, no forbidden file touched. Any unplanned edit is
   named and justified. (See `/consistency`.)
5. **No silent scope change.** If you did more or less than the step asked, say so explicitly.

## Anti-gaming clauses
- "Tests pass" is meaningless if the implementation step edited the tests — confirm test files
  were untouched during implementation (the `tdd-lock` plugin enforces this).
- Passing tests prove *the tests pass*, not that the feature is correct. If the plan names
  edge cases or properties, they must have explicit checks.
- A merge-ready task ships an **evidence pack** (`/evidence`): build output, test summary,
  plan→diff mapping, and any known gaps.

## If verification fails
Do not paper over it. Report the failure with the real output and either fix it (`/debug` for
non-obvious failures) or escalate. A truthful "blocked, here's why" beats a false "done."
