---
description: Recover from a dug hole — revert the working tree to the last known-green commit
---

The current state is broken or has drifted. Recover deterministically instead of thrashing.

1. Find the last known-green commit (check `rollback` in `@TASK.json`, else the last commit
   whose message marks a passing step, else ask me).
2. Show me what will be lost: `!`git status --short`` and a one-line diffstat of what's between
   HEAD and that commit.
3. On my confirmation, revert the working tree to that commit (prefer `git restore` /
   `git revert` over destructive `reset --hard` unless I say otherwise).
4. Re-run `/verify` to confirm we're actually green again.
5. Update `@TASK.json`: record the rejected approach under `hypotheses_rejected` so it isn't
   retried, and reset `current_step`.

Do not silently discard work. Show, confirm, then revert.

$ARGUMENTS
