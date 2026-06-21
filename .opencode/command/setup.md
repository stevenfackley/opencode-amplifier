---
description: Bootstrap a project (or a teammate's machine) with the amplifier kit — wire config, models, verify
---

Set up opencode-amplifier for use. Walk through and report status at each step:

1. **Place the kit:** ensure `.opencode/` (agent, command, skills, plugins), `AGENTS.md`,
   `PATTERNS.md`, `patterns/`, `memory/` are present — copy into the project, or merge into
   `~/.config/opencode/` for global use across repos.
2. **Wire the proxy:** in `opencode.jsonc`, confirm `provider.lmproxy.baseURL` + the API-key env
   var. Run `opencode models` to get the real model IDs the proxy advertises.
3. **Set per-agent models** in `.opencode/agent/*.md`: strong for architect/tester/debugger/
   pr-reviewer, executor = Sonnet 4.5, `reviewer-cheap` = a cheap different family.
4. **Apply the team overlay** if one exists (real IDs + team conventions) — see
   `examples/opencode.overlay.example.jsonc`.
5. **Verify:** `@arch…` autocompletes (agents loaded), commands list (`/plan` etc.), a skill loads,
   and `TDD_LOCK_TESTS=1` blocks editing a `*.test.*` file.
6. **Report** what's wired vs. what still needs a real value.

$ARGUMENTS
