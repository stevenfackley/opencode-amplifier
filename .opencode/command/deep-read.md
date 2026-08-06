---
description: Hierarchical codebase digestion — 1M-context mapper compresses each subsystem into a capped brief section; synthesizer assembles a durable, git-SHA-stamped brief in memory/briefs/. Incremental refresh re-maps only changed subsystems.
---

Follow the `deep-analysis` skill for packet and artifact rules.

1. **Scope + split.** $ARGUMENTS names an area (default: whole repo). Split into subsystems
   by directory topology: top-level source dirs, project files (`*.csproj`, `package.json`,
   `Package.swift`…), or an existing brief's subsystem list. Aim for 3–10 subsystems; merge
   tiny dirs, split giant ones along module seams.
2. **Incremental check.** If `memory/briefs/CODEBASE-BRIEF.md` (or `BRIEF-<area>.md`)
   exists: `git diff --stat <frontmatter git_sha>..HEAD` → re-map ONLY subsystems with
   changed files; carry unchanged sections forward verbatim. No brief → map everything.
3. **Map.** For each selected subsystem, invoke `@mapper` with the subsystem's file listing
   + file contents (mapper is the ONE worker built for raw dumps — its 1M context is the
   compressor). Retries run on mapper's 262k fallback, so a packet that only fits 1M will
   overflow on retry — chunk subsystems to ≤200k. Each returns one `### <subsystem>` section,
   cap 40 lines, per `.opencode/templates/BRIEF.template.md`.
4. **Assemble.** Send all sections (new + carried-forward) to `@synthesizer`: follow the
   BRIEF template, write `memory/briefs/CODEBASE-BRIEF.md` (whole repo) or
   `memory/briefs/BRIEF-<area>.md`, stamp frontmatter `git_sha` with current HEAD, add
   Cross-cutting observations, append a Refresh log row.
5. **Commit the brief** (briefs are durable, unlike `.analysis/`):
   `git add memory/briefs/ && git commit -m "docs: refresh codebase brief"` — respecting the
   host repo's branch rules.
6. **Report.** Subsystem count (mapped vs carried), notable gotchas found, brief path.

$ARGUMENTS
