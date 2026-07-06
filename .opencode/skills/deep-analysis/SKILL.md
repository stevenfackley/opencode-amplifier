---
name: deep-analysis
description: Use when orchestrating /deep-design, /deep-debug, /deep-review, /deep-read, or /council — packet assembly and artifact discipline for fresh-context worker fan-out
---

# Deep analysis — disposable workers, durable artifacts

Calls are cheap; context is the scarce resource. Heavy reading and reasoning happen in
fresh-context workers that die after returning a capped artifact. The orchestrating session
holds packets and artifacts only — rot cannot accumulate in a context that is thrown away.

## Packet assembly (step 1 of every deep command)

A packet is everything a worker sees. Build it from:
1. The question/goal, verbatim.
2. `TASK.json` invariants + forbidden files (if a ledger exists).
3. File REFERENCES (paths + line ranges + a sentence on relevance). Inline full contents
   only when small; the mapper is the only worker built for raw dumps.
4. The matching section of `memory/briefs/CODEBASE-BRIEF.md`, if one exists.

Packet cap: ~200 lines. Needing more is the signal to run `/deep-read` first and reference
the brief instead.

## Staleness check (before using any brief)

Compare the brief's frontmatter `git_sha` to `git rev-parse HEAD`. If drifted, warn the user
and offer an incremental `/deep-read` refresh (changed subsystems only) before proceeding.

## Artifact discipline

- Workers return text; only the `synthesizer` writes files. One artifact per command run,
  following the matching template in `.opencode/templates/`.
- Ephemeral analyses → `.analysis/` (gitignored). Durable briefs → `memory/briefs/` (committed).
- Caps are hard: 150 lines per artifact (40 per brief section), frontmatter always filled
  (command, date, git_sha, models, inputs, status).
- **The orchestrator NEVER pastes raw worker output into the main thread.** Report the
  artifact path + a compact verdict + the dissent register. That's it.

## Blindness

Fan-out workers answer the SAME packet independently. Never include one worker's output in
another worker's input — correlation destroys the ensemble's value. Only the judge and
synthesizer see multiple outputs, and they see them labeled by model.

## Degradation ladder

1. Worker output non-conforming (oversized/off-format) → retry that worker ONCE with a
   stricter format reminder → still bad? proceed with survivors. A council of 2 is a council.
2. All workers fail → answer single-model inline, but the artifact says `status: degraded`
   and the report says so honestly.
3. A model missing from the proxy → use the fallback named in the agent file's frontmatter
   comment; `/setup` verifies all council models against `opencode models`.
