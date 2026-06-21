---
description: Plan a non-trivial task into a verifiable checklist (architect agent, strong model)
agent: architect
subtask: true
---

Read @AGENTS.md, @PATTERNS.md, and the template @.opencode/templates/TASK.template.json first.

Produce `TASK.json` (the canonical ledger) plus a short Approach brief for the task below.
Choose patterns by FIT (applicability predicates), not similarity. Each step must be small
enough for a less-capable executor to complete and verify in a single turn, and must name the
file(s) it changes, the pattern it adapts, and its own `verify` check. Set `forbidden_files` to
protect test files during implementation. Fill `acceptance_tests` and `rollback`.

Task:
$ARGUMENTS
