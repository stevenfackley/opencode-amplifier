// guardrails — basic safety hooks.
//  1. Block reads of secret files (.env, *.key, credentials, *.pem) so secrets never enter the
//     model context — important on a corp proxy where context may be logged.
//  2. Notify on session idle (place to wire your own dashboard POST, like a local activity
//     visualizer — see commented stub).
//
// Hook arg shapes vary by OpenCode version; written defensively. https://opencode.ai/docs/plugins/

const SECRET_RE = [
  /(^|[\\/])\.env(\.|$)/i,
  /\.key$/i,
  /\.pem$/i,
  /(^|[\\/])(credentials|secrets?)(\.|[\\/]|$)/i,
  /id_(rsa|ed25519)$/i,
];

const READ_TOOLS = new Set(["read", "cat", "view"]);

function pathOf(input, output) {
  const a = (output && output.args) || (input && input.args) || {};
  return a.filePath || a.path || a.file || "";
}

export const Guardrails = async ({ client }) => {
  return {
    "tool.execute.before": async (input, output) => {
      const tool = String((input && (input.tool || input.name)) || "").toLowerCase();
      if (!READ_TOOLS.has(tool)) return;
      const p = pathOf(input, output);
      if (p && SECRET_RE.some((re) => re.test(p))) {
        throw new Error(
          `[guardrails] Blocked read of secret-looking file "${p}". ` +
            `Don't pull secrets into model context. If you truly need a value, reference it via ` +
            `an env var instead.`
        );
      }
    },

    "session.idle": async () => {
      // Hook your own notifier/dashboard here, e.g.:
      // await fetch("http://127.0.0.1:7878/event", { method: "POST",
      //   body: JSON.stringify({ kind: "session.idle", ts: Date.now() }) }).catch(() => {});
    },
  };
};
