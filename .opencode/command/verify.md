---
description: Run the full build + test suite and fix until green (forced verification loop)
---

Identify and run this project's full build + test command (check @AGENTS.md "Project
specifics" for the exact command; otherwise infer it from the project files).

Then:
1. If anything fails, diagnose the root cause and fix it (use @debugger for non-obvious
   failures).
2. Re-run the full command.
3. Repeat until the entire suite passes.

Do not report success without pasting the actual final passing output. "It should pass" is
not acceptable.

$ARGUMENTS
