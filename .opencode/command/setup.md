---
description: Bootstrap a project (or a teammate's machine) with the amplifier kit — wire config, models, verify
---

Set up opencode-amplifier for use. Walk through and report status at each step:

1. **Place the kit:** ensure `.opencode/` (agent, command, skills, plugins), `AGENTS.md`,
   `PATTERNS.md`, `patterns/`, `memory/` are present — copy into the project, or merge into
   `~/.config/opencode/` for global use across repos.
2. **Wire the provider:** in `opencode.jsonc`, confirm `provider.openrouter`'s
   `OPENROUTER_API_KEY` resolves. Run `opencode models` to list the real model IDs. (If you added
   the optional local tier, confirm `provider.ollama.options.baseURL` reaches a live server too —
   a dead endpoint resolves silently and its agents fail with no useful error.)
3. **Confirm the shipped per-agent pins resolve:** every `model:`/`fallback:` in
   `.opencode/agent/*.md` (and the `model:` in the five pinned `.opencode/command/*.md`) appears
   in `opencode models`. Do NOT rewrite the decorrelated pins unless the user asks — they are
   chosen so the `/review` and council votes come from different families.
4. **Apply your personal overlay** if you have one (LAN host, paid IDs) — see
   `examples/opencode.overlay.example.jsonc`.
5. **Verify:** `@arch…` autocompletes (agents loaded), commands list (`/plan` etc.), a skill loads,
   and `TDD_LOCK_TESTS=1` blocks editing a `*.test.*` file.
6. **Gate:** `node tools/doctor.mjs` — live if `OPENROUTER_API_KEY` is set (round-trips every
   pinned model + proves headless agent routing), otherwise `node tools/doctor.mjs --offline`.
   Setup is not done until it reports 0 FAIL.
7. **Report** what's wired vs. what still needs a real value.

$ARGUMENTS
