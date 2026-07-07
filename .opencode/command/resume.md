---
description: Load .analysis/handoff.md (written by /handoff in a previous session) and continue the task from its recorded state. Run as the FIRST command of a fresh session.
---

1. Read `.analysis/handoff.md`. If it does not exist, say so and stop — there is nothing to
   resume; ask the user what to work on instead.
2. **Staleness check:** compare its `git_sha` to `git rev-parse HEAD`. If they differ, run
   `git log --oneline <git_sha>..HEAD` and list what changed BEFORE trusting the handoff's
   file claims — the handoff describes the repo as it was, not as it is.
3. Restate the task and the recorded next step in ≤3 lines so the user can veto a stale or
   wrong direction cheaply.
4. Execute the next step. Honor the recorded decisions and their reasons — do not re-open
   them unless the staleness check invalidated one. The open-threads list is your backlog.
5. Do not delete the handoff — the slot lives until the next /handoff overwrites it.

$ARGUMENTS
