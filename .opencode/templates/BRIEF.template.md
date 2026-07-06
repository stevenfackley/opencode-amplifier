---
command: deep-read
date: <YYYY-MM-DD>
git_sha: <HEAD sha when mapped — staleness is measured against this>
subsystems: [<list>]
models: [<mapper>, <synthesizer>]
status: complete | partial
---
# CODEBASE BRIEF — <repo or area>

> Each subsystem section is capped at 40 lines. This file is DURABLE — it lives in
> memory/briefs/ and is committed. Refresh incrementally via /deep-read.

## Map

### <subsystem name> (<path>)
- **Purpose:**
- **Public surface:** <entry points, exported APIs>
- **Key flows:** <the 2–3 flows that matter>
- **Invariants:** <what must stay true>
- **Gotchas:** <what will bite a modifier>
- **Depends on:** <internal + external edges>

## Cross-cutting observations
<conventions, layering rules, shared utilities a modifier should reuse>

## Refresh log
| Date | git_sha | Subsystems re-mapped |
|---|---|---|
