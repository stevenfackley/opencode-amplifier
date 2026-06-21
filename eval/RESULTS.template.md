# Eval results — <date>

Proxy model IDs used: strong=`<...>` executor=`<...>` cheap=`<...>`

## Summary (per task × config)
| Task | Config | Accept pass | pass@1 | Turns | Churn | Unplanned edits | Plan viol. | Verify retries | Test edits | Tokens | Merge-ready |
|---|---|---|---|---|---|---|---|---|---|---|---|
| greenfield | B0 | | | | | | | | | | |
| greenfield | P  | | | | | | | | | | |
| brownfield | B0 | | | | | | | | | | |
| brownfield | P  | | | | | | | | | | |
| bugfix | B0 | | | | | | | | | | |
| bugfix | P  | | | | | | | | | | |

## Ablation deltas (P minus P−component)
| Component removed | Δ accept pass | Δ churn | Δ tokens | Keep? |
|---|---|---|---|---|
| − pattern corpus | | | | |
| − cross-model review | | | | |
| − tester / TDD-lock | | | | |
| − compaction | | | | |
| − escalation | | | | |

## Verdict
- Does P beat B0 (constrained baseline) on accept pass / merge-readiness? <yes/no>
- Does P approach B1 (strong baseline) at lower token cost? <yes/no>
- Which components failed to earn their keep (small ablation delta)? <list — cut them>
