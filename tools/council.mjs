#!/usr/bin/env node
// council.mjs — optional accelerator: run council workers in PARALLEL as headless
// `opencode run` processes instead of sequential in-session subagents. Same packet,
// same artifacts; only wall-clock differs. Zero npm dependencies.
//
// Usage:
//   node tools/council.mjs --prompt-file .analysis/packet.md \
//     --workers architect,proposer-b,proposer-c [--out .analysis/raw] [--timeout 600] [--dry-run]
//
// Each worker's stdout is written to <out>/<worker>.md. Feed those files to @synthesizer
// (in-session) to produce the final artifact — synthesis stays in-session on purpose:
// it needs judgment, and you want to see the dissent register land.
//
// WINDOWS GOTCHA (same class as the MCP one in opencode.jsonc): a global `opencode` may be
// a .cmd shim, which spawn() can't exec directly. We use shell:true so cmd.exe/sh resolves it.

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
const dryRun = has("dry-run");

if (!promptFile) {
  console.error("Required: --prompt-file <packet.md>   (see USAGE.md → deep analysis)");
  process.exit(2);
}
const packet = readFileSync(promptFile, "utf8");

if (dryRun) {
  for (const w of workers) console.log(`[dry-run] opencode run --agent ${w} <packet:${promptFile}> -> ${join(outDir, w + ".md")}`);
  process.exit(0);
}
mkdirSync(outDir, { recursive: true });

function runWorker(worker) {
  return new Promise((resolve) => {
    const child = spawn("opencode", ["run", "--agent", worker, packet], {
      shell: true,               // resolves .cmd shims on Windows; harmless on POSIX
      timeout: timeoutS * 1000,
    });
    let out = "", err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => {
      const dest = join(outDir, `${worker}.md`);
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
