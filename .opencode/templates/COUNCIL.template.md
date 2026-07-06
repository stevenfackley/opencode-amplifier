---
command: council
date: <YYYY-MM-DD>
git_sha: <HEAD sha when run>
models: [<answering models>, <synthesizer>]
inputs: <one-line question summary>
status: complete | degraded
---
# COUNCIL — <question slug>

> Hard cap: 150 lines below the frontmatter.

## Question + packet
<the question verbatim, plus a compact summary of what workers saw>

## Answers (compact, one block per model)
### <model A>
<≤15-line distillation: position, key assumptions, confidence>

## Synthesis
<the merged answer — decisive, with reasoning>

## Dissent register (MANDATORY)
| # | Disagreement | Positions (by model) | Resolution | Confidence |
|---|---|---|---|---|
