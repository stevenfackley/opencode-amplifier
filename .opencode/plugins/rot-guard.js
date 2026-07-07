// rot-guard — proactive context-bloat nag. Complements compaction.js (which re-grounds
// AFTER OpenCode compacts); this fires BEFORE quality decays, because a bloated context
// measurably degrades constrained models well before compaction triggers.
//
// Heuristic, not exact: accumulates the char length of message payloads seen by the hook
// and warns at two thresholds (~75k and ~150k tokens at ~4 chars/token). Hook arg shapes
// drift between OpenCode versions — everything is defensive; this must NEVER break a session.
// See https://opencode.ai/docs/plugins/

const WARN_AT = [300_000, 600_000]; // cumulative chars
let seen = 0;
let warned = 0;

const NOTE = (level) =>
  `[rot-guard] Session context is heavy (level ${level}/${WARN_AT.length}). Weak models ` +
  "degrade in bloated contexts. Protocol: finish the current step, then /handoff -> fresh " +
  "session -> /resume. Meanwhile push further reading into workers (/deep-read, /council) " +
  "instead of reading inline.";

export const RotGuard = async ({ client }) => {
  return {
    "chat.message": async (_input, output) => {
      try {
        const payload = output?.message?.content ?? output ?? "";
        seen += (typeof payload === "string" ? payload : JSON.stringify(payload)).length;
        if (warned < WARN_AT.length && seen > WARN_AT[warned]) {
          warned += 1;
          if (client && typeof client.append === "function") {
            await client.append(NOTE(warned));
          } else {
            console.warn(NOTE(warned));
          }
        }
      } catch {
        // Never let telemetry kill the session.
      }
    },
  };
};
