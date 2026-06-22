#!/usr/bin/env node
// Eval runner scaffold — drives `opencode run` for each (task × config) and collects metrics.
//
// THIS IS A SCAFFOLD. Verify two things against your OpenCode version before trusting numbers:
//   1. The non-interactive invocation (OPENCODE_RUN below). Newer OpenCode: `opencode run "<p>"`
//      with `--model` / `--agent` flags. Confirm with `opencode run --help`.
//   2. How to select a config's model/agents (flags vs a per-config opencode.json).
//
// Metrics that need a real diff/test harness (churn, pass@1) are stubbed where they depend on
// your project's test command — fill `TEST_CMD` per repo. Token cost comes from OpenCode's run
// summary if your version prints it; otherwise wire it to the proxy's usage endpoint.

import { execFile } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";

const TASKS_DIR = join(import.meta.dirname, "tasks");
const RESULTS_DIR = join(import.meta.dirname, "results");

// --- configs: how each baseline maps to a model/agent set (EDIT to your real proxy IDs) ------
const CONFIGS = {
  B0: { label: "single constrained", args: ["--model", "claude-4-5-sonnet-latest"] },
  B1: { label: "single strong",      args: ["--model", "gpt-5.1"] },
  A:  { label: "actor-critic",       args: ["--agent", "build"] }, // executor+reviewer only
  P:  { label: "full pipeline",      args: ["--agent", "build"] }, // relies on this kit's config
};

const OPENCODE_RUN = (prompt, cfgArgs) => ["run", ...cfgArgs, prompt]; // <-- verify per version
const TEST_CMD = process.env.EVAL_TEST_CMD || "echo 'set EVAL_TEST_CMD to your test command'";

function sh(cmd, args) {
  return new Promise((res) => {
    const t0 = Date.now();
    execFile(cmd, args, { maxBuffer: 64 * 1024 * 1024 }, (err, stdout, stderr) => {
      res({ code: err ? (err.code ?? 1) : 0, stdout: stdout || "", stderr: stderr || "", ms: Date.now() - t0 });
    });
  });
}

function parseArgs() {
  const a = process.argv.slice(2);
  const get = (flag, def) => {
    const i = a.indexOf(flag);
    return i >= 0 ? a[i + 1] : def;
  };
  return {
    configs: get("--configs", "B0,A,P").split(","),
    tasks: get("--tasks", "all"),
  };
}

async function main() {
  const { configs, tasks } = parseArgs();
  mkdirSync(RESULTS_DIR, { recursive: true });
  const taskFiles = readdirSync(TASKS_DIR).filter((f) => f.endsWith(".md"));
  const selected = tasks === "all" ? taskFiles : taskFiles.filter((f) => tasks.split(",").includes(basename(f, ".md")));

  const rows = [];
  for (const tf of selected) {
    const prompt = readFileSync(join(TASKS_DIR, tf), "utf8");
    for (const c of configs) {
      const cfg = CONFIGS[c];
      if (!cfg) { console.warn(`unknown config ${c}`); continue; }
      console.log(`\n=== ${tf} × ${c} (${cfg.label}) ===`);
      const run = await sh("opencode", OPENCODE_RUN(prompt, cfg.args));
      const test = await sh(process.platform === "win32" ? "pwsh" : "bash",
        process.platform === "win32" ? ["-c", TEST_CMD] : ["-lc", TEST_CMD]);
      rows.push({
        task: basename(tf, ".md"),
        config: c,
        run_ms: run.ms,
        run_exit: run.code,
        tests_pass: test.code === 0,
        test_ms: test.ms,
      });
      console.log(`  run_exit=${run.code} tests_pass=${test.code === 0} run_ms=${run.ms}`);
    }
  }

  const out = join(RESULTS_DIR, `eval-${selected.length}tasks.json`);
  writeFileSync(out, JSON.stringify(rows, null, 2));
  console.log(`\nWrote ${out}. Fill the qualitative metrics (churn, reviewer precision, plan ` +
    `violations, merge-readiness) in a copy of RESULTS.template.md.`);
}

main();
