# STATE.md — compacted working memory (rewrite every few turns)

> The 3-tier memory model: `TASK.json` is the **immutable brief + active step**; this file is
> the **compressed history**. On long tasks, re-inject THIS plus the immutable brief — not the
> full transcript. Raw history accumulation is what makes long tasks decay (attention drowns in
> stale tool output). Rewrite this snapshot every ~5 turns or whenever context feels heavy.

## Now
- **Current step:** <id + one line>
- **Goal (restate):** <one line — re-grounding the objective fights step-local drift>

## Built so far (compressed)
- <what exists/works now — bullet facts, not transcript>

## Holds true (invariants confirmed)
- <invariants you've verified still hold>

## Decisions & assumptions (load-bearing)
- <decision → why>

## Dead ends (do NOT retry)
- <rejected hypothesis → why it failed>

## Open / next
- <what's left, blockers, the very next action>
