---
command: deep-debug
date: <YYYY-MM-DD>
git_sha: <HEAD sha when run>
models: [<hypothesist models>, <synthesizer>]
inputs: <one-line symptom summary>
status: live | solved | degraded
---
# DEBUG — <symptom slug>

> Hard cap: 150 lines below the frontmatter. RULE: no fix is proposed while ≥2 hypotheses
> are LIVE. Falsify first.

## Symptom + reproduction
<what breaks, how to reproduce, exact error output>

## Hypothesis table (merged, ranked by plausibility × discriminating power ÷ cost)
| # | Hypothesis | Evidence for | Evidence against | Falsification test | Cost | Status |
|---|---|---|---|---|---|---|
<!-- Status: LIVE / ELIMINATED / SURVIVOR -->

## Experiment log
| Run | Test executed | Result (real output) | Hypotheses eliminated |
|---|---|---|---|

## Survivor + fix plan
<root cause (file:line) and the minimal fix — filled only when exactly one hypothesis survives>

## Dissent register
| # | Disagreement | Positions (by model) | Resolution | Confidence |
|---|---|---|---|---|
