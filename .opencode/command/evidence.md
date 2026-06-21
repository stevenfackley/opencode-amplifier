---
description: Produce the merge-readiness evidence pack with REAL output (no claims)
---

Fill in the evidence template with actual, freshly-run output — not assertions. Read the
template first: @.opencode/templates/EVIDENCE.template.md

Steps:
1. Run the build; capture real output.
2. Run the full test suite; capture the summary line.
3. Build the plan→diff mapping from `@TASK.json`: for each invariant and step, mark
   implemented yes/no with file:line. List any forbidden-file touches or unplanned edits.
4. Confirm test files were NOT modified during implementation.
5. Note known gaps and the rollback commit.

Write the completed pack to `EVIDENCE.md`. If any check fails, the task is NOT done — report
the failure with its output instead of finishing.

$ARGUMENTS
