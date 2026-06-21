# Eval harness — prove the pipeline actually helps

The council's sharpest warning: a multi-agent pipeline can be *more elaborate* without being
*better*, and a simple critic-in-the-loop sometimes beats it at equal cost. So measure. Don't
optimize vibes.

## What to compare (baselines)
Run each task under several configs and compare:
1. **B0 — single constrained model** (Sonnet 4.5 alone, no kit). The floor.
2. **B1 — single strong model** (GPT-5.1 alone). The reference ceiling for cost.
3. **P — full pipeline** (this kit: architect → tester → executor → /review → /verify).
4. **A — stripped actor-critic** (executor + reviewer only). The "does the rest earn its keep?"
   control.

## Metrics (log per task, per config)
| Metric | Why |
|---|---|
| Acceptance pass (yes/no) | Did it actually meet the spec's acceptance_tests? |
| pass@1 | First-attempt success without human help |
| Turns to complete | Latency / effort |
| Diff churn (lines added+removed) | Smaller = less thrash, usually better |
| Unplanned edits | Plan drift signal |
| Plan-consistency violations | From `/consistency` — the 32% failure mode |
| Reviewer precision/recall | Of reviewer findings, how many were real / missed |
| Verification retries | How many `/verify` loops to green |
| Test-file edits during impl | Verification-gaming signal (should be 0) |
| Token cost | $ — the whole point of using weak models |
| Merge-readiness | Human edit-distance to actually ship it |

## Ablations (turn ONE thing off, measure the delta)
- − pattern corpus
- − cross-model review (use single reviewer)
- − tester / TDD-lock
- − compaction / re-grounding
- − dynamic escalation

If an ablation barely moves the metrics, that component isn't paying for its complexity — cut it.

## Tasks
`eval/tasks/` holds task specs across difficulty tiers (greenfield, brownfield refactor,
bugfix). Add your own *representative* tasks — the eval is only as good as its task set. Each
task ships its own acceptance tests so success is objective.

## Running it
`eval/run-eval.mjs` is a scaffold that drives `opencode run` for each (task × config) and
collects metrics into `eval/results/`. Verify the `OPENCODE_RUN` invocation matches your
version's non-interactive CLI before trusting the numbers, then:

```
node eval/run-eval.mjs --configs B0,A,P --tasks all
```

Record outcomes in a copy of `RESULTS.template.md`.
