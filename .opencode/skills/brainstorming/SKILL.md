---
name: brainstorming
description: Use BEFORE any creative or build work — new features, components, behavior changes. Explore intent, requirements, and design with the user before writing a line of code. Prevents a constrained model from confidently building the wrong thing.
---

# Brainstorming

Constrained models jump to code fast and commit to the first idea. Don't. The cheapest bug to
fix is the one you never build. Run this before implementation.

## Process
1. **Restate the goal** in your own words and get confirmation. Surface the *why*, not just the
   *what*.
2. **Ask the 2–3 questions that actually change the design** — not a survey. Examples: data
   shape, scale, failure behavior, who/what consumes this, hard constraints.
3. **Propose 1–2 approaches**, each with a one-line trade-off. Recommend one. Be decisive.
4. **Name what you'd reuse** — existing functions, patterns (`PATTERNS.md`), libraries — before
   proposing anything new.
5. **Identify risks/unknowns** that should be resolved before or early in the build.
6. Only after the approach is agreed: hand off to `/plan` (the architect) for the checklist.

## Rules
- Do not write implementation code during brainstorming.
- One recommended direction beats five options listed without a recommendation.
- If the request is ambiguous, the answer is a question, not a guess.
