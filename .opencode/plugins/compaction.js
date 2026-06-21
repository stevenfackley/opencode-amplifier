// compaction — re-injects the immutable brief after OpenCode compacts the session.
//
// When the context is compacted, the goal/invariants and current step can get summarized into
// mush — and that's exactly the information a weak model must NOT lose. After compaction this
// hook nudges the agent to re-read TASK.json + STATE.md before doing anything else, so the
// "immutable brief" tier is always re-materialized at the actuation point.
//
// Hook arg shapes can drift between OpenCode versions; the `tui.prompt.append` / client calls
// below are written defensively. See https://opencode.ai/docs/plugins/

const REGROUND_NOTE =
  "[compaction] Context was just compacted. Before the next action, re-read TASK.json " +
  "(goal, invariants, current_step) and STATE.md (built-so-far, dead-ends). Do not rely on " +
  "summarized memory for the plan or invariants.";

export const Compaction = async ({ client }) => {
  return {
    "session.compacted": async () => {
      // Best-effort: surface a re-grounding reminder into the next turn.
      try {
        if (client && typeof client.append === "function") {
          await client.append(REGROUND_NOTE);
        } else {
          console.warn(REGROUND_NOTE);
        }
      } catch {
        console.warn(REGROUND_NOTE);
      }
    },
  };
};
