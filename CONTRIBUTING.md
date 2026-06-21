# Contributing to the kit

The kit compounds when the team adds to it. Keep additions generic, high-signal, and import-safe.

## Golden rule: keep it generic and data-free
Everything here is public + MIT. Never commit employer code, internal names, secrets, or
project-specific logic. Patterns/skills must be reusable across any project — that's also what
keeps the public repo unambiguously yours.

## Add a pattern
1. `/capture-pattern` (or copy `patterns/_TEMPLATE/`).
2. Fill the fitness frontmatter — `applicability`, `forbidden_contexts`, `failure_modes` are the
   high-value fields (they drive retrieval-by-fit, not similarity).
3. Minimal, self-contained, runnable example; comment the *decision points*.
4. Add a row to `PATTERNS.md`. One idea per pattern.

## Add a skill (process discipline)
- `.opencode/skills/<name>/SKILL.md` with `name` + `description`. The description is the trigger —
  make it precise ("use when…"). Skills capture *process*; patterns capture *artifacts*.

## Add an agent
- `.opencode/agent/<name>.md` with `description`, `mode`, `model`, `permission`. Read-only
  (`edit: deny`) for any reviewer/auditor. Use a model role, not a hardcoded vendor assumption.

## Add a command
- `.opencode/command/<name>.md`. Use `$ARGUMENTS`, `@file`, and `` !`shell` `` injection. Point it
  at a skill/agent rather than duplicating guidance.

## Earn its keep
New agents/skills must show measurable lift on the eval suite (`eval/`, `METRICS.md`). If an
ablation barely moves the numbers, cut it — complexity has a cost (the council's warning).

## Workflow
Branch (`feat/…`), PR, squash-merge. Conventional Commits. No AI-attribution trailers. Update
`README.md` + `USAGE.md` registries when you add a skill/agent/command.

## Two layers: public kit vs internal overlay
This repo is the public, generic kit. Real proxy IDs, internal endpoints, and team conventions
live in a SEPARATE private overlay repo (see `examples/opencode.overlay.example.jsonc`) — never
here.
