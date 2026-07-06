#!/usr/bin/env node
// council.mjs — optional accelerator: run council workers in PARALLEL as headless
// `opencode run` processes instead of sequential in-session subagents. Same packet,
// same artifacts; only wall-clock differs. Zero npm dependencies.
//
// Usage:
//   node tools/council.mjs --prompt-file .analysis/packet.md \
//     --workers architect,proposer-b,proposer-c [--out .analysis/raw] [--timeout 600] \
//     [--model <provider/model>] [--dry-run]
//
// Each worker's stdout is written to <out>/<worker>.md. Feed those files to @synthesizer
// (in-session) to produce the final artifact — synthesis stays in-session on purpose:
// it needs judgment, and you want to see the dissent register land.
//
// --model overrides every worker's pinned model (opencode `-m`). Only for smoke-testing the
// plumbing on a network where the pinned proxy models are unreachable — it collapses the
// council to ONE family, so never use it for real analysis.
//
// WINDOWS GOTCHA (same class as the MCP one in opencode.jsonc): a global `opencode` may be
// a .cmd shim, which spawn() can't exec directly. We use shell:true so cmd.exe/sh resolves it.
//
// HEADLESS GOTCHAS (all found the hard way, 2026-07-06):
// 1. `opencode run` blocks FOREVER if stdin is an open pipe that never closes. We pipe the
//    packet over stdin and close it immediately (opencode reads a closed stdin as the prompt).
//    If you invoke `opencode run` by hand from a script/CI, close stdin (`< NUL` / `</dev/null`).
// 2. The packet must NOT be passed as a command-line argument: with shell:true it truncates
//    at the first newline (cmd.exe/sh concatenation), and Windows caps command lines at ~8k
//    chars — a real 200-line packet breaks both ways. stdin has neither problem.
// 3. `opencode run --agent X` NEVER hard-fails on a bad agent: unknown names AND
//    subagent-mode agents both print "Falling back to default agent" on stderr and exit 0 —
//    the default agent answers, and without the guard below every worker would silently be
//    the same model (zero decorrelation). Workers must be `mode: all` (or `primary`).

import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : fallback;
}
const has = (name) => process.argv.includes(`--${name}`);

const promptFile = arg("prompt-file", null);
const workers = (arg("workers", "architect,proposer-b,proposer-c")).split(",").map(s => s.trim()).filter(Boolean);
const outDir = arg("out", ".analysis/raw");
const timeoutS = Number(arg("timeout", "600"));
const modelOverride = arg("model", null);
const dryRun = has("dry-run");

if (!promptFile) {
  console.error("Required: --prompt-file <packet.md>   (see USAGE.md → deep analysis)");
  process.exit(2);
}
const packet = readFileSync(promptFile, "utf8");

const FALLBACK_RE = /falling back to default agent/i;

if (dryRun) {
  const m = modelOverride ? ` -m ${modelOverride}` : "";
  for (const w of workers) console.log(`[dry-run] opencode run --agent ${w}${m} < ${promptFile} -> ${join(outDir, w + ".md")}`);
  process.exit(0);
}
mkdirSync(outDir, { recursive: true });

function runWorker(worker) {
  return new Promise((resolve) => {
    const cliArgs = ["run", "--agent", worker];
    if (modelOverride) cliArgs.push("-m", modelOverride);
    const child = spawn("opencode", cliArgs, {
      shell: true,               // resolves .cmd shims on Windows; safe here — argv is fixed flags only, the packet goes over stdin
      stdio: ["pipe", "pipe", "pipe"],
      timeout: timeoutS * 1000,
    });
    // Packet over stdin, then CLOSE it: newline-safe, no cmd-line length cap, and a closed
    // stdin is what stops `opencode run` from blocking forever waiting on the pipe.
    child.stdin.on("error", () => {});  // EPIPE if the child dies before reading — the close handler reports it
    child.stdin.write(packet);
    child.stdin.end();
    let out = "", err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => {
      const dest = join(outDir, `${worker}.md`);
      if (FALLBACK_RE.test(err) || FALLBACK_RE.test(out)) {
        // opencode exits 0 here, but the answer came from the DEFAULT agent, not `worker` —
        // accepting it would silently destroy the council's decorrelation.
        writeFileSync(dest, `<<worker failed: opencode fell back to the default agent — "${worker}" is missing or has mode: subagent (headless --agent needs mode: all)>>\n${err}`);
        console.error(`${worker}: FAILED (fallback to default agent — check the agent exists and has mode: all)`);
        resolve({ worker, code: -2 });
        return;
      }
      writeFileSync(dest, out || `<<worker failed: exit ${code}>>\n${err}`);
      console.log(`${worker}: exit ${code} -> ${dest} (${out.length} chars)`);
      resolve({ worker, code });
    });
    child.on("error", (e) => {
      writeFileSync(join(outDir, `${worker}.md`), `<<spawn error: ${e.message}>>`);
      resolve({ worker, code: -1 });
    });
  });
}

const results = await Promise.all(workers.map(runWorker));
const failed = results.filter((r) => r.code !== 0);
if (failed.length === results.length) {
  console.error("All workers failed — check `opencode models` and the proxy key. Degrade per the deep-analysis skill.");
  process.exit(1);
}
if (failed.length) console.warn(`${failed.length}/${results.length} workers failed — a council of ${results.length - failed.length} is still a council.`);
