---
description: Generate a reviewer-friendly PR description from the branch's actual changes
---

Recent commits on this branch:
!`git log --oneline -15`

Determine the base branch (usually `main`), then read the real diff against it
(`git diff <base>...HEAD` / `git diff --stat <base>...HEAD`). Based on the ACTUAL changes, write a
PR description:

- **What** — the change in 1–2 sentences.
- **Why** — the motivation / problem (link the issue if referenced in commits).
- **How it was tested** — the checks that prove it works.
- **Risk / rollout** — blast radius, migrations, flags, rollback.

Keep it concise and skimmable. Don't invent changes that aren't in the diff. Follow the repo's
conventions if `AGENTS.md` defines them.

$ARGUMENTS
