---
description: Council-grade design — three blind proposals from decorrelated families, scored against a fixed rubric by a judge that shares the architect's nemotron-ultra family (so scoring is rubric-anchored, not family-decorrelated), synthesized with a dissent register. Reach for it on any architecture/trade-off call you'd want a stronger model for.
---

Follow the `deep-analysis` skill for packet and artifact rules.

1. **Packet.** Per the skill: the design question ($ARGUMENTS), TASK.json invariants,
   relevant file references, brief section (staleness-checked). ALSO include the relevant
   `PATTERNS.md` index rows — proposals must name which golden pattern each part adapts, or
   state that none fits (kit rule 3: adapt, don't invent).
2. **Blind proposals.** Send the SAME packet independently to `@architect`, `@proposer-b`,
   `@proposer-c`. Each returns ONE committed proposal (cap 80 lines): design, rejected
   alternatives (one line each), patterns adapted, `Assumptions:`, confidence line.
3. **Judge.** Send all three proposals (labeled by model) + the packet to `@judge` with this
   fixed rubric, 1–5 per dimension:
   - **Constraint fitness** — satisfies every packet invariant (violation caps at 2)
   - **Simplicity/YAGNI** — no speculative structure
   - **Failure modes** — names concrete ways it breaks and their containment
   - **Migration cost** — effort/risk from the current state
4. **Synthesize.** Send the proposals + judge table + packet to `@synthesizer`:
   follow `.opencode/templates/DESIGN.template.md`, write `.analysis/DESIGN-<slug>.md`.
   Winner + grafted ideas from losers + full score table + dissent register.
5. **Report.** Winning approach (3 lines), dissent register rows, artifact path. No raw
   proposals in the thread. If the user accepts the design, hand off to `/plan` so the
   architect turns it into a TASK.json ledger.

$ARGUMENTS
