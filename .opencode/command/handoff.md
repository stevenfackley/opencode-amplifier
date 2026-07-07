---
description: Distill this session's working state into .analysis/handoff.md (single slot, overwritten) so the task can continue in a FRESH session. The controlled fix for context rot — pairs with /resume.
---

Write the session's working state to `.analysis/handoff.md`, following
`.opencode/templates/HANDOFF.template.md` exactly. Rules:

1. **Distill, don't summarize.** The reader is the next session: it needs state it can act
   on (what is done, what is proven, what is next), not a narrative of what happened.
2. **Every decision carries its reason.** A bare decision gets re-litigated by the next
   session; the "because" is what makes it stick.
3. **Fill the frontmatter from reality:** today's date, `git rev-parse HEAD`, the current
   branch, a one-line task statement.
4. **Exactly one next step.** If you are tempted to list three, the first one is the next
   step and the other two are open threads.
5. **Hard cap 120 lines.** Going over means you summarized instead of distilled — cut
   narrative, keep state. Overwrite any existing handoff.md without asking: the slot always
   holds the latest state.
6. **Close out:** after writing, tell the user exactly this — "Handoff written to
   `.analysis/handoff.md`. Kill this session, start a fresh one, and run `/resume`."

$ARGUMENTS
