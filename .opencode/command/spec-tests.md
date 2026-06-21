---
description: Have the independent tester write failing spec tests from the plan (TDD, anti-gaming)
agent: tester
subtask: true
---

Read `@TASK.json` (and any public interface/spec the task references). Write spec tests for the
behaviors and edge cases it names — WITHOUT reading the implementation. Run them; show they fail
(RED) for the right reason. List any plan behavior you couldn't turn into a test.

These tests become the locked contract for the executor.

$ARGUMENTS
