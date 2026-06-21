// metrics — OPTIONAL telemetry for proving ROI + adoption. No-op unless METRICS_ENDPOINT is set.
// Mirrors the local-dashboard pattern (POST lightweight events to a localhost collector you run),
// so you can measure turns-per-task, verify loops, tool mix, and adoption across the team.
//
// Privacy: sends event KINDS + tool names + project path only — no file contents or prompts.
// Point it ONLY at a local/internal collector. Hook arg shapes vary by version; written defensively.

const ENDPOINT = process.env.METRICS_ENDPOINT; // e.g. http://127.0.0.1:7878/opencode

async function emit(kind, payload) {
  if (!ENDPOINT) return; // disabled by default
  try {
    await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, ...payload }),
    });
  } catch {
    /* telemetry must never break a session */
  }
}

export const Metrics = async ({ project }) => {
  const proj = (project && (project.path || project.name)) || "unknown";
  return {
    "session.created": async () => emit("session.created", { proj }),
    "session.idle": async () => emit("session.idle", { proj }),
    "session.compacted": async () => emit("session.compacted", { proj }),
    "tool.execute.after": async (input) => {
      const tool = String((input && (input.tool || input.name)) || "");
      await emit("tool", { proj, tool });
    },
  };
};
