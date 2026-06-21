---
description: Get two different models to answer the same hard question, then reconcile
---

This is a high-stakes or contested decision. Get **two independent answers from different
models**, then reconcile.

1. Pose the exact question below to `@architect` (runs on one model).
2. Pose the same question to `@reviewer` (runs on a different model).
3. Compare the two answers. Where they **agree**, treat it as high-confidence. Where they
   **disagree**, that is the signal — dig into the disagreement, weigh the reasoning (not the
   tone), and check facts against the actual code/docs.
4. Give me a single reconciled recommendation, and explicitly call out any unresolved
   disagreement and what would settle it.

Question:
$ARGUMENTS
