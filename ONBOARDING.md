# Onboarding — get amplified in 5 minutes

For a teammate adopting the kit. Goal: from zero to a contract-governed, multi-model workflow on
free, open-weights models, fast.

## 1. Prereqs
- OpenCode CLI installed.
- `export OPENROUTER_API_KEY=…` (free key from openrouter.ai/keys). That's the only requirement —
  every shipped pin is an `openrouter/…:free` slug.
- *Optional:* Ollama locally or on a LAN box, to move the chatty roles off the OpenRouter pool —
  see `docs/local-models.md`.

## 2. Get the kit
- Clone this repo, OR merge its `.opencode/`, `AGENTS.md`, `PATTERNS.md`, `patterns/`, `memory/`
  into `~/.config/opencode/` to make it global across all your projects.
- Optionally apply a **personal overlay** (LAN model host, paid-tier IDs) — see
  `examples/opencode.overlay.example.jsonc` for the shape.

## 3. Run `/setup`
It wires the providers, confirms the shipped per-agent pins resolve, and verifies
agents/commands/skills load and the TDD lock works. It ends on `node tools/doctor.mjs` — 0 FAIL
is the gate.

## 4. Learn the loop (read `USAGE.md`, then just do this)
```
/plan <task>        # architect -> TASK.json
/spec-tests         # independent tests from the plan
export TDD_LOCK_TESTS=1
"do step 1"; /verify; /consistency; /review   # repeat per step, commit each green step
/evidence           # merge-readiness pack
```

## 5. Day-to-day shortcuts
- Reproducing a web screen → `/port-from-angular` → `/plan`.
- Calling the backend → `/swift-client` (reuse the contract; ACL the DTOs).
- Building UI → `/design` + `/pattern swiftui-screen-editorial`; then `/a11y-review` (508 applies).
- Reviewing someone else's PR → `/review-pr`.
- Found a good reusable solution → `/capture-pattern` (the corpus compounds over time).

## 6. The rules that matter
- Never claim done without `/verify` evidence. Tests are locked during impl (`TDD_LOCK_TESTS=1`).
- Adapt patterns by FIT (`PATTERNS.md`), don't invent.
- Consume shared libs via the contract + an anti-corruption layer; never fork.

That's it. The kit does the heavy lifting — you steer.
