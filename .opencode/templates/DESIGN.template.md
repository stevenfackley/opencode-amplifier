---
command: deep-design
date: <YYYY-MM-DD>
git_sha: <HEAD sha when run>
models: [<proposer models>, <judge>, <synthesizer>]
inputs: <one-line packet summary>
status: complete | degraded
---
# DESIGN — <question slug>

> Hard cap: 150 lines below the frontmatter. The synthesizer discards non-conforming worker
> input and notes it under "Discarded workers".

## Question
<the design question, verbatim>

## Packet (what every worker saw)
<compact summary: goal, invariants, file refs, brief section used>

## Winning approach
<the chosen design and WHY it beat the others — concrete, decisive>

## Grafted ideas (from losing proposals)
- <idea> (from <model>) — <why it was worth keeping>

## Judge scores (rubric: 1–5 each)
| Proposal | Constraint fitness | Simplicity/YAGNI | Failure modes | Migration cost | Total |
|---|---|---|---|---|---|

## Dissent register (MANDATORY — never empty unless proposals were identical)
| # | Disagreement | Positions (by model) | Resolution | Confidence |
|---|---|---|---|---|

## Discarded workers
<one line per discarded/non-conforming worker output, or "none">
