---
description: Cross-model review consensus — two different models review the diff; only findings ≥2 agree on are high-confidence
---

Run a consensus review of the most recent change.

1. Send the current diff + `@TASK.json` to `@reviewer` (primary model).
2. Send the same to `@reviewer-cheap` (different, cheaper family).
3. Merge the findings:
   - A finding flagged by **both** reviewers = **high confidence** — must be addressed.
   - A finding from only **one** = **review it**, decide with reasoning (don't auto-dismiss,
     don't auto-accept). Single-reviewer findings are where false positives AND real
     model-specific catches both live.
4. Output a deduplicated, severity-ranked list with: file:line, issue, which reviewer(s) flagged
   it, confidence, and the fix.

Also run the plan-conformance check inline: does the diff satisfy every `TASK.json` invariant,
touch no forbidden file, and stay within `touched_files`? Flag any deviation.

$ARGUMENTS
