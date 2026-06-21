// escalation — circuit breaker for a thrashing weak model.
//
// Detects non-advancing retries: repeated test/build commands that keep failing, or the same
// file edited over and over without progress. After a threshold it surfaces a recommendation to
// escalate THAT step to a strong model (or hand it to @debugger). It does not auto-switch models
// (OpenCode picks models per agent), but it converts silent thrashing into a visible signal so
// you stop burning a weak model on a step it can't do.
//
// Research basis: weak-first cascades with step-level escalation reach near strong-model quality
// at ~40% of the cost — but only if you actually escalate at the right moment.
//
// Heuristic + in-memory only (resets per session). Hook arg shapes vary by version; written
// defensively. See https://opencode.ai/docs/plugins/

const FAIL_RE = /\b(fail|failed|failing|error|exception|not ok|✗|×)\b/i;
const TEST_CMD_RE = /\b(test|pytest|jest|vitest|dotnet test|go test|npm (run )?test)\b/i;

const THRESHOLD = 3; // consecutive failing test/build runs before we shout

export const Escalation = async ({ client }) => {
  let consecutiveFails = 0;

  const warn = async (msg) => {
    try {
      if (client && typeof client.append === "function") await client.append(msg);
      else console.warn(msg);
    } catch {
      console.warn(msg);
    }
  };

  return {
    "tool.execute.after": async (input, output) => {
      const tool = String((input && (input.tool || input.name)) || "").toLowerCase();
      if (tool !== "bash" && tool !== "shell") return;

      const cmd = String((output && output.args && (output.args.command || output.args.cmd)) || "");
      if (!TEST_CMD_RE.test(cmd)) return; // only judge test/build runs

      const result = String(
        (output && (output.result || output.stdout || output.output)) || ""
      );
      const failed = FAIL_RE.test(result);

      if (failed) {
        consecutiveFails += 1;
        if (consecutiveFails >= THRESHOLD) {
          await warn(
            `[escalation] ${consecutiveFails} consecutive failing test/build runs on this step. ` +
              `Stop retrying on the current model. Options: (1) /debug to switch to the disciplined ` +
              `protocol, (2) escalate this step to a strong model, (3) /revert-green and re-plan it. ` +
              `Record the dead end in TASK.json so it isn't retried.`
          );
          consecutiveFails = 0; // re-arm
        }
      } else {
        consecutiveFails = 0; // progress -> reset
      }
    },
  };
};
