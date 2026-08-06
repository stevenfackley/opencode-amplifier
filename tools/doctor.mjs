#!/usr/bin/env node
// doctor.mjs — first-run kit verifier. Run from the repo root BEFORE any real work on a new
// machine, after a provider change, or after an OpenCode upgrade:
//
//   node tools/doctor.mjs [--offline]
//
// Static checks always run (file/config sanity, agent mode policy). Live checks call the
// configured provider — one tiny round-trip per unique pinned model — and are skipped with
// --offline (use where the provider is unreachable or you have no API key).
//
// Exit codes: 0 = all PASS/WARN, 1 = at least one FAIL, 2 = usage error.
// Conventions (shared with council.mjs): spawned `opencode` never inherits stdin (an open
// pipe hangs it forever), prompts travel over stdin not argv, and the "Falling back to
// default agent" stderr warning is always a failure signal.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { readAgents } from "./frontmatter.mjs";

const offline = process.argv.includes("--offline");
const unknown = process.argv.slice(2).filter((a) => a !== "--offline");
if (unknown.length) {
  console.error(`Unknown argument(s): ${unknown.join(" ")}. Usage: node tools/doctor.mjs [--offline]`);
  process.exit(2);
}

const results = [];
const record = (status, name, detail = "") => results.push({ status, name, detail });

const FALLBACK_RE = /falling back to default agent/i;

function oc(args, { input = "", timeout = 60_000 } = {}) {
  return spawnSync("opencode", args, {
    shell: true,     // resolves .cmd/.ps1 shims on Windows
    input,           // written to stdin then CLOSED — never leave stdin an open pipe
    encoding: "utf8",
    timeout,
  });
}

// ---------- static checks ----------

const version = oc(["--version"], { timeout: 30_000 });
if (version.status === 0) record("PASS", "opencode on PATH", (version.stdout || "").trim());
else record("FAIL", "opencode on PATH", "not found or errored");

let agents = [];
try {
  agents = readAgents();
  record("PASS", "agent frontmatter parses", `${agents.length} agents`);
} catch (e) {
  record("FAIL", "agent frontmatter parses", e.message);
}

for (const a of agents) {
  if (!a.mode || !a.model) record("FAIL", `agent ${a.name}: mode+model present`, `mode=${a.mode} model=${a.model}`);
}

const synth = agents.find((a) => a.name === "synthesizer");
if (synth && synth.mode === "subagent" && synth.editAllow) record("PASS", "synthesizer: subagent + edit:allow");
else record("FAIL", "synthesizer: subagent + edit:allow", `mode=${synth?.mode} editAllow=${synth?.editAllow}`);

for (const a of agents) {
  if (a.name === "synthesizer") continue;
  // editAllow tracks EXPLICIT `edit: allow` — the unattended-writer check. Agents without a
  // permission block (designer) fall back to OpenCode's interactive default, which is fine.
  if (a.editAllow) record("FAIL", `agent ${a.name}: edit must not be allow`, "only synthesizer writes unattended");
  if (a.mode !== "all") record("FAIL", `agent ${a.name}: mode must be all`, `is "${a.mode}" — headless --agent silently falls back on subagents`);
}

for (const a of agents) {
  if (a.fallback && a.fallback === a.model) record("FAIL", `agent ${a.name}: fallback must differ from primary`, a.fallback);
}

for (const t of ["DESIGN", "DEBUG", "REVIEW", "BRIEF", "COUNCIL", "HANDOFF"]) {
  record(existsSync(`.opencode/templates/${t}.template.md`) ? "PASS" : "FAIL", `template ${t}`);
}

const ignored = spawnSync("git", ["check-ignore", "-q", ".analysis/probe.md"], { encoding: "utf8" });
record(ignored.status === 0 ? "PASS" : "FAIL", ".analysis/ gitignored", ignored.status === 0 ? "" : "ephemeral artifacts would land in git");

record(existsSync("memory/briefs") ? "PASS" : "FAIL", "memory/briefs/ exists");

try {
  const jsonc = readFileSync("opencode.jsonc", "utf8");
  // Catches overlay placeholders (examples/opencode.overlay.example.jsonc) pasted in but never filled.
  if (/PROXY_HOST|YOUR-REAL|changeme/i.test(jsonc)) record("WARN", "no unfilled overlay placeholders", "placeholder marker still in opencode.jsonc — fill it before real use");
  else record("PASS", "no unfilled overlay placeholders");
} catch (e) {
  record("FAIL", "opencode.jsonc readable", e.message);
}

record(process.env.OPENROUTER_API_KEY ? "PASS" : "WARN", "OPENROUTER_API_KEY set", "openrouter/* pins will 401 on live checks");

// ---------- live checks ----------

if (offline) {
  record("WARN", "live checks", "skipped (--offline)");
} else {
  const list = oc(["models"], { timeout: 60_000 });
  const catalog = list.stdout || "";
  if (list.status !== 0) record("FAIL", "opencode models", (list.stderr || "").trim().slice(0, 200));
  const primaries = [...new Set(agents.map((a) => a.model).filter(Boolean))];
  const fallbackModels = [...new Set(agents.map((a) => a.fallback).filter(Boolean))];
  for (const m of primaries) record(catalog.includes(m) ? "PASS" : "FAIL", `model in catalog: ${m}`);
  for (const m of fallbackModels) {
    if (!primaries.includes(m)) record(catalog.includes(m) ? "PASS" : "WARN", `fallback in catalog: ${m}`, catalog.includes(m) ? "" : "declared fallback unavailable — retries will fail");
  }

  for (const m of primaries) {
    const r = oc(["run", "-m", m], { input: "Reply with exactly: OK", timeout: 90_000 });
    if (r.status === 0 && /OK/.test(r.stdout || "")) record("PASS", `round-trip: ${m}`);
    else record("FAIL", `round-trip: ${m}`, r.status === null ? "timeout" : (r.stderr || r.stdout || "").trim().slice(0, 200));
  }

  const probe = oc(["run", "--agent", "architect"], { input: "Reply with exactly: OK", timeout: 120_000 });
  if (FALLBACK_RE.test(probe.stderr || "") || FALLBACK_RE.test(probe.stdout || ""))
    record("FAIL", "--agent routing (architect)", "fell back to default agent — mode wiring broken");
  else record("PASS", "--agent routing (architect)", "no fallback warning");
}

// ---------- report ----------

const width = Math.max(...results.map((r) => r.name.length));
for (const r of results) console.log(`${r.status.padEnd(4)} ${r.name.padEnd(width)}  ${r.detail}`);
const fails = results.filter((r) => r.status === "FAIL").length;
const warns = results.filter((r) => r.status === "WARN").length;
console.log(`\n${results.length} checks: ${results.length - fails - warns} pass, ${warns} warn, ${fails} fail`);
process.exit(fails ? 1 : 0);
