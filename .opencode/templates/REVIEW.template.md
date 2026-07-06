---
command: deep-review
date: <YYYY-MM-DD>
git_sha: <HEAD sha when run>
models: [<shard models>, <refuter>]
inputs: <diff/files reviewed>
status: complete | degraded
---
# REVIEW — <target slug>

> Hard cap: 150 lines below the frontmatter. Only refuter-CONFIRMED findings appear as
> findings; everything the refuter killed is listed one-line for auditability.

## Target
<diff range or file list, and the git_sha it was reviewed at>

## Confirmed findings (severity-ranked)
| # | Dimension | file:line | Issue | Failure scenario | Refuter verdict | Severity |
|---|---|---|---|---|---|---|

## Killed findings
- <finding one-liner> — killed because <refuter's reason>

## Coverage note
<which of the four dimensions ran, which shards degraded/retried, anything not reviewed>
