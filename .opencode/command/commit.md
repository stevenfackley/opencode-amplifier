---
description: Write a Conventional Commit message from the staged changes (does not commit)
model: devstral-small-2-24b-instruct-2512   # cheap + coding-tuned — mechanical task, preserves premium quota
---

Staged summary:
!`git diff --cached --stat`

Staged diff:
!`git diff --cached`

Write ONE Conventional Commit message for the staged changes above:
- `type(scope): subject` — type from feat/fix/docs/refactor/chore/test/perf; subject imperative,
  <= 72 chars.
- A body explaining the WHY (and any breaking change as `BREAKING CHANGE:`), wrapped ~72 cols.
- Describe only what's actually staged. If staged changes span unrelated concerns, say so and
  suggest splitting the commit.

Output just the message — do NOT run the commit. Follow `AGENTS.md` commit conventions if defined
(including any attribution-trailer rules).

$ARGUMENTS
