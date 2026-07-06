---
description: Generic blind council for any hard question — three decorrelated models answer independently, synthesizer merges with a dissent register. The escape hatch when no shaped deep-* command fits.
---

Follow the `deep-analysis` skill for packet and artifact rules.

1. **Packet.** Assemble per the skill: the question ($ARGUMENTS) verbatim, TASK.json
   invariants if a ledger exists, minimal file references, matching brief section (staleness-
   checked). Cap ~200 lines.
2. **Blind fan-out.** Send the SAME packet independently to `@architect`, `@proposer-b`, and
   `@proposer-c`. Blindness is absolute: never include one's answer in another's input. Ask
   each for: position + reasoning, `Assumptions:`, and the closing
   `Confidence: … — what would change my mind: …` line. Cap 80 lines each.
3. **Synthesize.** Send all three outputs (labeled by model) + the packet to `@synthesizer`
   with instructions to follow `.opencode/templates/COUNCIL.template.md` and write
   `.analysis/COUNCIL-<slug>.md` (slug: kebab-case from the question, ≤6 words).
4. **Report.** Give the user: the synthesis verdict, the dissent register rows, and the
   artifact path. Do NOT paste raw worker answers into the thread.
5. **Degrade honestly** per the skill's ladder (retry once → proceed with survivors →
   single-model with `status: degraded`).

$ARGUMENTS
