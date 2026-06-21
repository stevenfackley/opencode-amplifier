---
description: Review a teammate's pull request (staff-level, read-only) — severity-labeled feedback + verdict
agent: pr-reviewer
subtask: true
---

Review the pull request below per the `reviewing-others-code` discipline. Fetch it with
`gh pr view` + `gh pr diff` if given a PR number; otherwise review the diff/branch provided.
Read against the author's intent. Output severity-labeled findings ([blocking]/[consider]/[nit])
with file:line and concrete fixes, note the strengths, and end with a clear verdict. Do not edit
the code.

PR (number, URL, or diff):
$ARGUMENTS
