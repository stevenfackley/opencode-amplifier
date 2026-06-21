---
id: <name>
language: <csharp|typescript|python|...>
version_bounds: "<e.g. C# 9+>"
last_validated: <YYYY-MM-DD>
success_rate: null
applicability:
  - "<pick this pattern when this is true>"
forbidden_contexts:
  - "<do NOT use it when this is true>"
failure_modes:
  - "<how adapting it tends to go wrong>"
topology: "<where it lives in a codebase>"
---

# Pattern: <name>

> Copy this folder to `patterns/<your-name>/`, fill it in, and add a row to `PATTERNS.md`.
> The frontmatter above is what makes retrieval pick by FIT, not embedding distance — fill it
> in honestly, especially `applicability` and `forbidden_contexts`.

**Language / stack:** <C# / TypeScript / Python / …>

## When to use
<The trigger. What does the code look like *right before* you'd reach for this? Name the smell
the weak model would otherwise produce — e.g. "nested try/catch", "boolean flag soup".>

## When NOT to use
<Where this is overkill or wrong. Patterns without boundaries get cargo-culted.>

## Key decisions (the part the model can't derive)
- <Decision 1 and why this choice over the obvious alternative.>
- <Decision 2 …>

## Gotchas
- <The thing that bites you in practice.>

## The example
See the code file in this folder. It is minimal, self-contained, and runnable in isolation.
Adapt it — match the structure and the decisions; don't reinvent a weaker version.
