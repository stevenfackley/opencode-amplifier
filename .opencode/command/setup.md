---
description: Bootstrap a project (or a teammate's machine) with the amplifier kit — wire config, models, verify
---

Set up opencode-amplifier for use. Walk through and report status at each step:

1. **Place the kit:** ensure `.opencode/` (agent, command, skills, plugins), `AGENTS.md`,
   `PATTERNS.md`, `patterns/`, `memory/` are present — copy into the project, or merge into
   `~/.config/opencode/` for global use across repos.
2. **Wire the providers:** in `opencode.jsonc`, confirm `provider.ollama.options.baseURL` and
   `provider.openrouter`'s `OPENROUTER_API_KEY`. Run `opencode models` to list the real model IDs.
3. **Set per-agent models** in `.opencode/agent/*.md`: strong reasoner for architect/tester/
   debugger/pr-reviewer, a coding-tuned model for the executor, `reviewer-cheap` = a cheap
   different family.
4. **Apply your personal overlay** if you have one (LAN host, paid IDs) — see
   `examples/opencode.overlay.example.jsonc`.
5. **Verify:** `@arch…` autocompletes (agents loaded), commands list (`/plan` etc.), a skill loads,
   and `TDD_LOCK_TESTS=1` blocks editing a `*.test.*` file.
6. **Report** what's wired vs. what still needs a real value.

$ARGUMENTS
