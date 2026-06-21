---
description: Plan-to-artifact consistency check — passing tests are NOT enough; verify the plan was actually fulfilled
---

Green tests do not prove the plan was satisfied (research: ~32% of test-passing artifacts still
violated their stated plan). Check the current change against `@TASK.json`:

1. **Promised files changed?** Every entry in `touched_files` actually modified as intended.
2. **Invariants implemented?** Each `invariants` entry verifiably present in the diff — point to
   file:line. An invariant with no corresponding code is a FAIL.
3. **Forbidden untouched?** No file matching `forbidden_files` was modified (especially test
   files during implementation).
4. **No unplanned edits?** Anything changed that isn't in the plan must be listed and justified
   as a `deviation`; unjustified scope creep is a FAIL.
5. **Acceptance tests present and run?** Each `acceptance_tests` entry exists and was executed.

Output a PASS/FAIL per item with evidence (file:line / command output). If any item FAILs, the
step is NOT done — say so and what's needed. Record confirmed deviations into `@TASK.json`.

$ARGUMENTS
