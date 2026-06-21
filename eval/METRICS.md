# METRICS — proving the kit's value (and earning team adoption)

The kit only becomes a "game changer at work" if you can SHOW it beats a bare model on real
tasks. This is the evidence that wins team adoption and makes the impact visible in a review.

## Capture per task (kit vs baseline)
Run the same real ticket two ways — **B0** (Sonnet alone, no kit) and **P** (full pipeline) — and log:

| Metric | How to read it |
|---|---|
| Time-to-screen (wall clock) | The headline number leadership understands |
| Turns to complete | Effort / babysitting required |
| Validation rules missed | Reproduction fidelity (the cross-team defect class) |
| Contract/drift incidents caught | Bugs prevented before prod |
| Accessibility issues (`/a11y-review`) | 508 risk avoided |
| Review cycles to merge | Downstream cost on teammates |
| Diff churn | Thrash / rework |
| Tokens / cost | The whole point of using weak models well |
| Merge-readiness (human edit-distance) | Did it actually ship, or need rescue? |

## How to capture
- **Automated:** `eval/run-eval.mjs` logs run/test outcomes to `eval/results/`.
- **Live usage:** enable the `metrics` plugin — `export METRICS_ENDPOINT=http://127.0.0.1:7878/opencode`
  and run a tiny local collector (same idea as a local activity dashboard). It records session +
  tool events so you can chart turns/verify-loops/tool-mix and adoption across the team. It sends
  event kinds + tool names + project path only — no code or prompts; point it at localhost only.
- **Manual:** for reproduction tickets, fill the table in a copy of `RESULTS.template.md`.

## Present it
- A one-pager: "N real tickets, P vs B0 — X% faster, Y fewer validation defects, Z fewer review
  cycles, at W% of the token cost." That's the adoption pitch and the perf-review artifact.
- Re-run after each kit change so you can prove (or disprove) that a new skill/agent earned its
  keep — and cut the ones that didn't (the council's warning).

## Cadence
Run a small fixed suite (5–10 representative tickets) weekly or per kit change. Trend the numbers;
don't optimize on a single anecdote.
