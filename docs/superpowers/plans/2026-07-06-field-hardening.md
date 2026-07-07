# Field Hardening Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the four field-hardening components specced in `docs/superpowers/specs/2026-07-06-field-hardening-design.md`: doctor.mjs first-run verifier, /handoff + /resume session rebirth, packet.mjs packet assembly, and real fallback retry in council.mjs — plus the "all read-only agents are `mode: all`" policy.

**Architecture:** Three zero-dependency Node ESM scripts under `tools/` sharing one tiny frontmatter reader (`tools/frontmatter.mjs`); two prompt-only commands + one template for handoff; small text edits to rot-guard, AGENTS.md, and docs. No test framework exists in this repo — every task carries exact verify commands with expected output (home verification uses Copilot stand-in model `github-copilot/gpt-5-mini`, same method as the PR #10 smoke).

**Tech Stack:** Node ≥20 ESM (no npm deps), OpenCode CLI 1.17+, git. Windows-first (PowerShell verify commands; `cmd /c "... < NUL"` where a raw `opencode run` needs closed stdin).

**Branch:** `feat/field-hardening` (already created; spec committed as 69d5a11).

**Hard-won constraints every task must respect** (from PR #10):
- Spawned `opencode` NEVER inherits stdin — pipe-then-close or `ignore` (open pipe = infinite hang).
- Prompts travel over **stdin**, never argv (newline truncation under `shell:true` + ~8k Windows cmd-line cap).
- stderr matching `/falling back to default agent/i` is ALWAYS a failure signal, regardless of exit code.
- Exit codes: 0 success · 1 runtime/check failure · 2 usage error.
- Do NOT stage `.opencode/agent/reviewer.md`'s pre-existing uncommitted model-line change if present in `git status` — commit only the lines each task touches (use `git add` with explicit paths; reviewer.md IS edited by Tasks 2–3, which is fine — its model line just comes along, and that's acceptable since the user's local edit is the model value itself; if `git diff .opencode/agent/reviewer.md` shows a model change you did not make, keep it).

---

### Task 1: `tools/frontmatter.mjs` — shared agent-frontmatter reader

**Files:**
- Create: `tools/frontmatter.mjs`

- [ ] **Step 1: Write the file**

```js
// frontmatter.mjs — minimal agent-frontmatter reader shared by doctor.mjs and council.mjs.
// NOT a YAML parser: reads only the flat scalar keys the kit relies on (mode, model,
// fallback, description, temperature) plus permission.edit. Values may carry trailing
// `# comments` — stripped. Returns null for files without a frontmatter fence.

import { readFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";

function stripComment(v) {
  return v.replace(/\s+#.*$/, "").trim();
}

export function parseAgentFile(path) {
  const text = readFileSync(path, "utf8");
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fm = { name: basename(path, ".md"), editAllow: false };
  let inPermission = false;
  for (const raw of m[1].split(/\r?\n/)) {
    const top = raw.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (top) {
      inPermission = top[1] === "permission";
      if (!inPermission) fm[top[1]] = stripComment(top[2]);
      continue;
    }
    if (inPermission) {
      const sub = raw.match(/^\s+edit:\s*(.*)$/);
      if (sub) fm.editAllow = stripComment(sub[1]) === "allow";
    }
  }
  return fm;
}

export function readAgents(dir = ".opencode/agent") {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parseAgentFile(join(dir, f)))
    .filter(Boolean);
}
```

- [ ] **Step 2: Verify parse output on the two edge agents**

Run (from repo root):
```powershell
node -e "import('./tools/frontmatter.mjs').then(m => { const s = m.parseAgentFile('.opencode/agent/synthesizer.md'); const d = m.parseAgentFile('.opencode/agent/debugger.md'); console.log(s.name, s.mode, s.model, s.editAllow); console.log(d.name, d.mode, d.model, d.editAllow); console.log('count', m.readAgents().length); })"
```
Expected:
```
synthesizer subagent gpt-5.1 true
debugger subagent nemotron-3-ultra-550b-a55b false
count 13
```
(synthesizer proves permission.edit detection + comment stripping; debugger proves no-permission-block default false.)

- [ ] **Step 3: Commit**

```powershell
git add tools/frontmatter.mjs
git commit -m "feat: shared minimal agent-frontmatter reader for tools"
```

---

### Task 2: `fallback:` frontmatter key on all agents that declare one

The fallbacks currently live in comments (`Fallback:` / `Alt:` / "drop to"). Promote them to a real key. **Tolerance gate first:** OpenCode must ignore the unknown key.

**Files:**
- Modify: `.opencode/agent/{architect,proposer-b,proposer-c,mapper,judge,refuter,reviewer,reviewer-cheap,tester,debugger,synthesizer,pr-reviewer}.md` (12 files; `designer` declares no alternate — skip it)

- [ ] **Step 1: Tolerance gate — add the key to proposer-b ONLY**

In `.opencode/agent/proposer-b.md`, insert directly under the `model:` line:
```yaml
fallback: mistral-small-4-119b-2603   # used by tools/council.mjs --retry path; doctor.mjs validates it
```

- [ ] **Step 2: Probe that OpenCode still loads and routes the agent**

```powershell
cmd /c "opencode run --agent proposer-b -m github-copilot/gpt-5-mini Reply with exactly: OK < NUL"
```
Expected: output containing `OK`, exit 0, **no** frontmatter/schema error, **no** `Falling back to default agent` on stderr.

**CONTINGENCY (only if the probe errors on the unknown key):** delete the `fallback:` line, and instead declare fallbacks as a `FALLBACKS` map at the top of `tools/council.mjs` in Task 8 (`const FALLBACKS = { "proposer-b": "mistral-small-4-119b-2603", ... }` with all 12 entries below, plus a comment binding it to the agent files). Then in Task 9, doctor reads the map via a regex on council.mjs instead of `a.fallback`. Record which form shipped in the final PR body.

- [ ] **Step 3: Add the key to the remaining 11 agents** (same placement — directly under `model:`; same trailing comment as Step 1)

| Agent file | `fallback:` value |
|---|---|
| architect.md | `nemotron-3-ultra-550b-a55b` |
| proposer-c.md | `nemotron-3-super-120b-a12b` |
| mapper.md | `nemotron-3-super-120b-a12b` |
| judge.md | `nemotron-3-ultra-550b-a55b` |
| refuter.md | `gpt-oss-120b` |
| reviewer.md | `mistral-small-4-119b-2603` |
| reviewer-cheap.md | `devstral-small-2-24b-instruct-2512` |
| tester.md | `devstral-small-2-24b-instruct-2512` |
| debugger.md | `gpt-5.1` |
| synthesizer.md | `nemotron-3-ultra-550b-a55b` |
| pr-reviewer.md | `mistral-large-3-675b-instruct-2512` |

(Values come from each agent's existing `Fallback:`/`Alt:` comment — leave those comments in place; they explain the *why*, the key is the machine-readable *what*.)

- [ ] **Step 4: Verify all 12 keys parse and none equals its primary**

```powershell
node -e "import('./tools/frontmatter.mjs').then(m => { const a = m.readAgents(); const withFb = a.filter(x => x.fallback); console.log('with fallback:', withFb.length); console.log('bad (fb==primary):', withFb.filter(x => x.fallback === x.model).map(x => x.name)); })"
```
Expected:
```
with fallback: 12
bad (fb==primary): []
```

- [ ] **Step 5: Commit**

```powershell
git add .opencode/agent/
git commit -m "feat: machine-readable fallback: key on all agents that declare an alternate model"
```

---

### Task 3: mode policy — every read-only agent is `mode: all`

**Files:**
- Modify: `.opencode/agent/{judge,refuter,reviewer,reviewer-cheap,tester,debugger}.md` (6 files; architect/proposer-b/proposer-c/mapper already flipped in PR #10, designer/pr-reviewer already `all`, synthesizer deliberately stays `subagent`)

- [ ] **Step 1: In each of the 6 files, replace the mode line**

Old:
```yaml
mode: subagent
```
New:
```yaml
mode: all   # `all`, not `subagent`: headless `opencode run --agent` only accepts primaries — a subagent SILENTLY falls back to the default agent. `all` keeps it usable as an in-session subagent too.
```

- [ ] **Step 2: Verify the policy holds kit-wide**

```powershell
node -e "import('./tools/frontmatter.mjs').then(m => { const a = m.readAgents(); console.log('not-all:', a.filter(x => x.mode !== 'all').map(x => x.name)); console.log('edit-allow:', a.filter(x => x.editAllow).map(x => x.name)); })"
```
Expected:
```
not-all: [ 'synthesizer' ]
edit-allow: [ 'synthesizer' ]
```

- [ ] **Step 3: Live probe one flipped agent routes headless**

```powershell
cmd /c "opencode run --agent judge -m github-copilot/gpt-5-mini Reply with exactly: OK < NUL"
```
Expected: `OK`, exit 0, no `Falling back to default agent` on stderr.

- [ ] **Step 4: Commit**

```powershell
git add .opencode/agent/
git commit -m "feat: mode policy — every read-only agent is mode: all, synthesizer stays subagent-only"
```

---

### Task 4: `HANDOFF.template.md`

**Files:**
- Create: `.opencode/templates/HANDOFF.template.md`

- [ ] **Step 1: Write the template**

```markdown
---
date: <YYYY-MM-DD>
git_sha: <HEAD sha at handoff>
branch: <branch name>
task: <one line — what this session was doing>
---
# HANDOFF

> Single slot: `.analysis/handoff.md`, overwritten by every /handoff. Hard cap: 120 lines.
> Distill, don't summarize — the next session acts on this without re-deriving anything.

## Status
- Done: <step> — <one-line evidence: test run, commit sha, verified output>
- In progress: <step> — <exactly where it stopped>
- Not started: <step>

## Decisions (each with its reason — a decision without its why gets re-litigated)
- <decision> — because <reason>

## Open threads
- <unresolved question / suspicion / assumption not yet verified>

## Files touched
- <path> — <what changed and why, one line>

## Next step (exactly one, concrete)
<the single next action, specific enough to execute without re-reading history>
```

- [ ] **Step 2: Commit**

```powershell
git add .opencode/templates/HANDOFF.template.md
git commit -m "feat: HANDOFF artifact template (single-slot session rebirth)"
```

---

### Task 5: `/handoff` and `/resume` commands

**Files:**
- Create: `.opencode/command/handoff.md`
- Create: `.opencode/command/resume.md`

- [ ] **Step 1: Write `.opencode/command/handoff.md`**

```markdown
---
description: Distill this session's working state into .analysis/handoff.md (single slot, overwritten) so the task can continue in a FRESH session. The controlled fix for context rot — pairs with /resume.
---

Write the session's working state to `.analysis/handoff.md`, following
`.opencode/templates/HANDOFF.template.md` exactly. Rules:

1. **Distill, don't summarize.** The reader is the next session: it needs state it can act
   on (what is done, what is proven, what is next), not a narrative of what happened.
2. **Every decision carries its reason.** A bare decision gets re-litigated by the next
   session; the "because" is what makes it stick.
3. **Fill the frontmatter from reality:** today's date, `git rev-parse HEAD`, the current
   branch, a one-line task statement.
4. **Exactly one next step.** If you are tempted to list three, the first one is the next
   step and the other two are open threads.
5. **Hard cap 120 lines.** Going over means you summarized instead of distilled — cut
   narrative, keep state. Overwrite any existing handoff.md without asking: the slot always
   holds the latest state.
6. **Close out:** after writing, tell the user exactly this — "Handoff written to
   `.analysis/handoff.md`. Kill this session, start a fresh one, and run `/resume`."

$ARGUMENTS
```

- [ ] **Step 2: Write `.opencode/command/resume.md`**

```markdown
---
description: Load .analysis/handoff.md (written by /handoff in a previous session) and continue the task from its recorded state. Run as the FIRST command of a fresh session.
---

1. Read `.analysis/handoff.md`. If it does not exist, say so and stop — there is nothing to
   resume; ask the user what to work on instead.
2. **Staleness check:** compare its `git_sha` to `git rev-parse HEAD`. If they differ, run
   `git log --oneline <git_sha>..HEAD` and list what changed BEFORE trusting the handoff's
   file claims — the handoff describes the repo as it was, not as it is.
3. Restate the task and the recorded next step in ≤3 lines so the user can veto a stale or
   wrong direction cheaply.
4. Execute the next step. Honor the recorded decisions and their reasons — do not re-open
   them unless the staleness check invalidated one. The open-threads list is your backlog.
5. Do not delete the handoff — the slot lives until the next /handoff overwrites it.

$ARGUMENTS
```

- [ ] **Step 3: Verify OpenCode discovers both commands**

```powershell
cmd /c "opencode run -m github-copilot/gpt-5-mini List your available slash commands, names only. < NUL"
```
Expected: the listing includes `handoff` and `resume` (alongside the existing 28). If the model paraphrases instead of listing, checking file presence is sufficient: both files exist with valid `---` fences and a `description:` line.

- [ ] **Step 4: Commit**

```powershell
git add .opencode/command/handoff.md .opencode/command/resume.md
git commit -m "feat: /handoff + /resume — controlled session rebirth for context rot"
```

---

### Task 6: rot-guard message + AGENTS.md rot rail

**Files:**
- Modify: `.opencode/plugins/rot-guard.js:14-17`
- Modify: `AGENTS.md` (rule 10 block, after the briefs bullet at line 70-71)

- [ ] **Step 1: Replace the NOTE constant in rot-guard.js**

Old:
```js
const NOTE = (level) =>
  `[rot-guard] Session context is heavy (level ${level}/${WARN_AT.length}). Weak models ` +
  "degrade in bloated contexts: push further reading into a worker (/deep-read, /deep-review, " +
  "/council) instead of reading inline, and /reground before the next step.";
```
New:
```js
const NOTE = (level) =>
  `[rot-guard] Session context is heavy (level ${level}/${WARN_AT.length}). Weak models ` +
  "degrade in bloated contexts. Protocol: finish the current step, then /handoff -> fresh " +
  "session -> /resume. Meanwhile push further reading into workers (/deep-read, /council) " +
  "instead of reading inline.";
```

- [ ] **Step 2: Syntax-check the plugin**

```powershell
node --check .opencode/plugins/rot-guard.js
```
Expected: silent, exit 0.

- [ ] **Step 3: Append the rot rail bullet to AGENTS.md rule 10**

After the existing bullet ending `…refresh incrementally via `/deep-read` if stale).` add:
```markdown
- When rot-guard warns mid-task: finish the current step, then `/handoff` → fresh session →
  `/resume`. Never push a rotted context through an analysis pass — a fresh session reading
  the handoff beats a bloated session remembering everything.
```

- [ ] **Step 4: Commit**

```powershell
git add .opencode/plugins/rot-guard.js AGENTS.md
git commit -m "feat: rot-guard prescribes the handoff protocol; AGENTS.md rot rail"
```

---

### Task 7: `tools/packet.mjs`

**Files:**
- Create: `tools/packet.mjs`

- [ ] **Step 1: Write the file**

```js
#!/usr/bin/env node
// packet.mjs — assemble a council context packet from a question plus a diff and/or files.
//
//   node tools/packet.mjs --question "why does X leak?" \
//     [--diff [ref]] [--files "src/*.cs,docs/adr-7.md"] \
//     [--out .analysis/packet.md] [--max-lines 200]
//
// Sources:
//   --diff [ref]   output of `git diff <ref>` (default HEAD = staged + unstaged changes).
//                  Bare `--diff` with no ref is fine.
//   --files globs  comma-separated pathspecs expanded via `git ls-files` — TRACKED files
//                  only, deliberately: packets should reference committed reality.
//
// CAP RULE: if the assembled body exceeds --max-lines the script FAILS (exit 1) with a
// per-source line-count table. It never truncates: blind workers cannot detect a chopped
// packet, so a too-big packet must fail loudly at assembly time. Fix order: tighten the
// globs -> reference a memory/briefs/ brief instead of raw code -> raise --max-lines on
// purpose.
//
// Pairs with tools/council.mjs for fully headless analysis:
//   node tools/packet.mjs --diff origin/main --question "review this diff"
//   node tools/council.mjs --workers reviewer,reviewer-cheap --prompt-file .analysis/packet.md

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : fallback;
}
const has = (name) => process.argv.includes(`--${name}`);

const question = arg("question", null);
const outPath = arg("out", ".analysis/packet.md");
const maxLines = Number(arg("max-lines", "200"));
const wantDiff = has("diff");
const diffRef = arg("diff", "HEAD");
const fileGlobs = (arg("files", "")).split(",").map((s) => s.trim()).filter(Boolean);

if (!question) {
  console.error('Required: --question "<text>"   (plus --diff and/or --files)');
  process.exit(2);
}
if (!wantDiff && fileGlobs.length === 0) {
  console.error("Nothing to pack: pass --diff and/or --files.");
  process.exit(2);
}

const git = (args) => execFileSync("git", args, { encoding: "utf8" });

const sources = []; // { label, body, lines }

if (wantDiff) {
  const diff = git(["diff", diffRef]).trimEnd();
  if (!diff) {
    console.error(`--diff ${diffRef}: empty diff — nothing to pack.`);
    process.exit(1);
  }
  sources.push({ label: `diff ${diffRef}`, body: "## Diff (`" + diffRef + "`)\n```diff\n" + diff + "\n```" });
}

for (const glob of fileGlobs) {
  const matched = git(["ls-files", "--", glob]).split(/\r?\n/).filter(Boolean);
  if (!matched.length) {
    console.error(`--files ${glob}: no tracked files match.`);
    process.exit(1);
  }
  for (const path of matched) {
    const numbered = readFileSync(path, "utf8")
      .trimEnd()
      .split(/\r?\n/)
      .map((l, i) => `${String(i + 1).padStart(4)}| ${l}`)
      .join("\n");
    sources.push({ label: `file ${path}`, body: `## File: ${path}\n\`\`\`\n${numbered}\n\`\`\`` });
  }
}

for (const s of sources) s.lines = s.body.split("\n").length;

const header = [
  "# Packet",
  "",
  "## Question",
  question,
  "",
  "## Constraints",
  "<!-- add invariants / TASK.json excerpts here, or delete this section -->",
  "",
].join("\n");

const bodyLines = header.split("\n").length + sources.reduce((n, s) => n + s.lines + 1, 0);
if (bodyLines > maxLines) {
  console.error(`Packet body is ${bodyLines} lines — cap is ${maxLines}. Per source:`);
  for (const s of sources) console.error(`  ${String(s.lines).padStart(5)}  ${s.label}`);
  console.error("Fix: tighten --files globs, point at a memory/briefs/ brief instead of raw code, or raise --max-lines deliberately.");
  process.exit(1);
}

const sha = git(["rev-parse", "HEAD"]).trim();
const date = new Date().toISOString().slice(0, 10);
const frontmatter = [
  "---",
  `date: ${date}`,
  `git_sha: ${sha}`,
  "sources:",
  ...sources.map((s) => `  - ${s.label} (${s.lines} lines)`),
  "---",
].join("\n");

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, frontmatter + "\n" + header + sources.map((s) => s.body).join("\n\n") + "\n");
console.log(`${outPath}: ${bodyLines} body lines from ${sources.length} source(s) @ ${sha.slice(0, 7)}`);
```

- [ ] **Step 2: Syntax + usage-error paths**

```powershell
node --check tools/packet.mjs
node tools/packet.mjs; echo "no-question exit=$LASTEXITCODE"
node tools/packet.mjs --question "q"; echo "no-source exit=$LASTEXITCODE"
```
Expected: syntax silent; then `no-question exit=2`; then `no-source exit=2`.

- [ ] **Step 3: Files mode round-trip**

```powershell
node tools/packet.mjs --question "what does this reader guarantee?" --files "tools/frontmatter.mjs" --out .analysis/packet-test.md
Get-Content .analysis/packet-test.md -TotalCount 12
```
Expected: success line (`.analysis/packet-test.md: N body lines from 1 source(s) @ <sha7>`); the head shows `---`, `date:`, `git_sha:`, `sources:` with `- file tools/frontmatter.mjs (…)`, `---`, `# Packet`.

- [ ] **Step 4: Cap-overflow fails with the table (no truncation)**

The spec commit's diff is ~200 lines — over the default cap when combined with the header:
```powershell
node tools/packet.mjs --question "overflow probe" --diff HEAD~1 --out .analysis/packet-overflow.md; echo "exit=$LASTEXITCODE"
Test-Path .analysis/packet-overflow.md
```
Expected: stderr `Packet body is N lines — cap is 200. Per source:` + a line-count row + the fix hierarchy; `exit=1`; `Test-Path` prints `False` (nothing written). If your current `HEAD~1` diff happens to be under 200 lines, use `--max-lines 20` to force the overflow instead.

- [ ] **Step 5: Commit**

```powershell
git add tools/packet.mjs
git commit -m "feat: tools/packet.mjs — packet assembly with hard cap enforcement"
```

---

### Task 8: fallback retry in `tools/council.mjs`

**Files:**
- Modify: `tools/council.mjs`

- [ ] **Step 1: Update the usage comment block**

Old (two lines inside the header comment):
```js
//   node tools/council.mjs --prompt-file .analysis/packet.md \
//     --workers architect,proposer-b,proposer-c [--out .analysis/raw] [--timeout 600] \
//     [--model <provider/model>] [--dry-run]
```
New:
```js
//   node tools/council.mjs --prompt-file .analysis/packet.md \
//     --workers architect,proposer-b,proposer-c [--out .analysis/raw] [--timeout 600] \
//     [--model <provider/model>] [--no-retry] [--dry-run]
//
// A worker that fails (non-zero exit or timeout) is retried ONCE on the `fallback:` model
// declared in its .opencode/agent/<worker>.md frontmatter; the retried artifact carries a
// `<!-- degraded: ... -->` first line so the synthesizer and the human can weigh it.
// --no-retry disables this; --model implies it (one family already — retrying is pointless).
```

- [ ] **Step 2: Add the import and flags**

Old:
```js
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
```
New:
```js
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseAgentFile } from "./frontmatter.mjs";
```

Old:
```js
const modelOverride = arg("model", null);
const dryRun = has("dry-run");
```
New:
```js
const modelOverride = arg("model", null);
const noRetry = has("no-retry");
const dryRun = has("dry-run");
```

- [ ] **Step 3: Build the fallback map after the workers list is parsed** (insert directly after the `const packet = readFileSync(promptFile, "utf8");` line)

```js
// Declared fallbacks live in each agent's frontmatter (fallback: key). Missing agent file
// or missing key just means no retry for that worker — the run itself surfaces bad names.
const fallbacks = {};
for (const w of workers) {
  try {
    const fm = parseAgentFile(`.opencode/agent/${w}.md`);
    if (fm?.fallback) fallbacks[w] = fm.fallback;
  } catch { /* no agent file — nothing to retry on */ }
}
```

- [ ] **Step 4: Replace `runWorker` with `runOnce` + orchestrating `runWorker`**

Old (the whole current `runWorker` function):
```js
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
```

New:
```js
function runOnce(worker, model) {
  return new Promise((resolve) => {
    const cliArgs = ["run", "--agent", worker];
    if (model) cliArgs.push("-m", model);
    const child = spawn("opencode", cliArgs, {
      shell: true,               // resolves .cmd shims on Windows; safe here — argv is fixed flags only, the packet goes over stdin
      stdio: ["pipe", "pipe", "pipe"],
      timeout: timeoutS * 1000,
    });
    // Packet over stdin, then CLOSE it: newline-safe, no cmd-line length cap, and a closed
    // stdin is what stops `opencode run` from blocking forever waiting on the pipe.
    child.stdin.on("error", () => {});  // EPIPE if the child dies before reading — close handler reports it
    child.stdin.write(packet);
    child.stdin.end();
    let out = "", err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => resolve({ code, out, err }));
    child.on("error", (e) => resolve({ code: -1, out: "", err: `<<spawn error: ${e.message}>>` }));
  });
}

const modeFailure = (r) => FALLBACK_RE.test(r.err) || FALLBACK_RE.test(r.out);

async function runWorker(worker) {
  const dest = join(outDir, `${worker}.md`);
  let attempt = await runOnce(worker, modelOverride);
  let degraded = null;
  const fb = fallbacks[worker];
  // Retry ONLY model-level failures (non-zero exit, timeout=null). A mode failure means the
  // agent itself is misconfigured — a different model cannot fix that, so don't burn a call.
  if (attempt.code !== 0 && !modeFailure(attempt) && fb && !noRetry && !modelOverride) {
    console.warn(`${worker}: primary failed (exit ${attempt.code}) — retrying once on fallback ${fb}`);
    const second = await runOnce(worker, fb);
    if (second.code === 0 && !modeFailure(second)) {
      attempt = second;
      degraded = fb;
    }
  }
  if (modeFailure(attempt)) {
    // opencode exits 0 here, but the answer came from the DEFAULT agent, not `worker` —
    // accepting it would silently destroy the council's decorrelation.
    writeFileSync(dest, `<<worker failed: opencode fell back to the default agent — "${worker}" is missing or has mode: subagent (headless --agent needs mode: all)>>\n${attempt.err}`);
    console.error(`${worker}: FAILED (fallback to default agent — check the agent exists and has mode: all)`);
    return { worker, code: -2 };
  }
  if (attempt.code !== 0) {
    writeFileSync(dest, attempt.out || `<<worker failed: exit ${attempt.code}>>\n${attempt.err}`);
    console.log(`${worker}: exit ${attempt.code} -> ${dest} (${attempt.out.length} chars)`);
    return { worker, code: attempt.code };
  }
  writeFileSync(dest, degraded ? `<!-- degraded: ran on fallback model ${degraded} -->\n${attempt.out}` : attempt.out);
  console.log(`${worker}: exit 0 -> ${dest} (${attempt.out.length} chars)${degraded ? ` [degraded: ${degraded}]` : ""}`);
  return { worker, code: 0 };
}
```

- [ ] **Step 5: Syntax + dry-run still work**

```powershell
node --check tools/council.mjs
"probe" | Out-File -Encoding utf8 .analysis/dry-probe.md; node tools/council.mjs --prompt-file .analysis/dry-probe.md --dry-run; echo "exit=$LASTEXITCODE"
```
Expected: syntax silent; three `[dry-run] opencode run --agent … < .analysis/dry-probe.md -> …` lines; `exit=0`.

- [ ] **Step 6: Live retry A/B — temp-point proposer-b's fallback at a reachable model**

Temporarily (NOT committed) change `.opencode/agent/proposer-b.md`'s fallback line to:
```yaml
fallback: github-copilot/gpt-5-mini   # used by tools/council.mjs --retry path; doctor.mjs validates it
```
Then (primary `mistral-large-…` is unreachable at home, so the primary attempt fails and the retry fires):
```powershell
"Reply with exactly: OK" | Out-File -Encoding utf8 .analysis/retry-probe.md
node tools/council.mjs --prompt-file .analysis/retry-probe.md --workers proposer-b --out .analysis/retry-test --timeout 120; echo "exit=$LASTEXITCODE"
Get-Content .analysis/retry-test/proposer-b.md -TotalCount 2
```
Expected: console shows `proposer-b: primary failed (exit …) — retrying once on fallback github-copilot/gpt-5-mini` then `proposer-b: exit 0 … [degraded: github-copilot/gpt-5-mini]`; `exit=0`; artifact's first line is `<!-- degraded: ran on fallback model github-copilot/gpt-5-mini -->`.

- [ ] **Step 7: `--no-retry` suppresses the retry**

```powershell
node tools/council.mjs --prompt-file .analysis/retry-probe.md --workers proposer-b --out .analysis/retry-test --timeout 120 --no-retry; echo "exit=$LASTEXITCODE"
```
Expected: no `retrying` line; `proposer-b: exit <nonzero>` and, since ALL workers failed, `All workers failed — check opencode models and the proxy key…` with `exit=1`.

- [ ] **Step 8: Revert the temp fallback edit**

```powershell
git checkout -- .opencode/agent/proposer-b.md
git diff --stat
```
Expected: `git diff --stat` shows ONLY `tools/council.mjs` modified (plus the user's pre-existing reviewer.md edit if it was present before this plan started).

- [ ] **Step 9: Commit**

```powershell
git add tools/council.mjs
git commit -m "feat: council.mjs retries dead workers once on their declared fallback model"
```

---

### Task 9: `tools/doctor.mjs`

**Files:**
- Create: `tools/doctor.mjs`

- [ ] **Step 1: Write the file**

```js
#!/usr/bin/env node
// doctor.mjs — first-run kit verifier. Run from the repo root BEFORE any real work on a new
// machine, after a proxy change, or after an OpenCode upgrade:
//
//   node tools/doctor.mjs [--offline]
//
// Static checks always run (file/config sanity, agent mode policy). Live checks call the
// configured provider — one tiny round-trip per unique pinned model — and are skipped with
// --offline (use at home where the work proxy is unreachable).
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
  if (/PROXY_HOST|YOUR-|changeme/i.test(jsonc)) record("WARN", "opencode.jsonc provider configured", "placeholder marker found — fine at home, fix before real use");
  else record("PASS", "opencode.jsonc provider configured");
} catch (e) {
  record("FAIL", "opencode.jsonc readable", e.message);
}

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
```

- [ ] **Step 2: Green offline run**

```powershell
node --check tools/doctor.mjs
node tools/doctor.mjs --offline; echo "exit=$LASTEXITCODE"
```
Expected: the table with every static check `PASS` except two `WARN`s (`opencode.jsonc provider configured` — the public kit deliberately ships `PROXY_HOST`; and `live checks skipped`). Per-agent policy checks only emit rows on failure, so a green run is 13 rows: `13 checks: 11 pass, 2 warn, 0 fail`; `exit=0`.

- [ ] **Step 3: Usage-error path**

```powershell
node tools/doctor.mjs --bogus; echo "exit=$LASTEXITCODE"
```
Expected: `Unknown argument(s): --bogus…`; `exit=2`.

- [ ] **Step 4: Breakage drill 1 — mode regression is caught**

Temporarily edit `.opencode/agent/judge.md`: change `mode: all …` back to `mode: subagent`. Then:
```powershell
node tools/doctor.mjs --offline; echo "exit=$LASTEXITCODE"
git checkout -- .opencode/agent/judge.md
```
Expected: `FAIL agent judge: mode must be all  is "subagent" — headless --agent silently falls back on subagents`; `exit=1`. Restore succeeds.

- [ ] **Step 5: Breakage drill 2 — fallback==primary is caught**

Temporarily edit `.opencode/agent/debugger.md`: change its `fallback: gpt-5.1` to `fallback: nemotron-3-ultra-550b-a55b` (same as its primary). Then:
```powershell
node tools/doctor.mjs --offline; echo "exit=$LASTEXITCODE"
git checkout -- .opencode/agent/debugger.md
```
Expected: `FAIL agent debugger: fallback must differ from primary`; `exit=1`. Restore succeeds.

- [ ] **Step 6: Commit**

```powershell
git add tools/doctor.mjs
git commit -m "feat: tools/doctor.mjs — first-run kit verifier (static + live checks)"
```

---

### Task 10: docs — USAGE.md + README.md

**Files:**
- Modify: `USAGE.md` (deep-analysis section)
- Modify: `README.md` (council-layer Rails paragraph + Setup list)

- [ ] **Step 1: USAGE.md — add session-hygiene rows and tool lines**

After the `/council <question>` table row (end of the "Deep analysis" table), the existing "**Headless fan-out**" block follows. Insert a new table between them:

```markdown
### Session hygiene (context rot)
| Command | Reach for it when… |
|---|---|
| `/handoff` | rot-guard warned / context is heavy → distill working state to `.analysis/handoff.md`, then restart |
| `/resume` | First command of the fresh session → staleness-checks the handoff and continues the task |
```

Then extend the existing "Headless fan-out" bullet list with two bullets (after the `--model` bullet):

```markdown
- Workers that die (non-zero exit / timeout) retry ONCE on the `fallback:` model declared in their agent frontmatter; retried artifacts open with a `<!-- degraded: … -->` marker. `--no-retry` disables; `--model` implies it.
- First run on a new machine: `node tools/doctor.mjs` (static + live checks; `--offline` where the proxy is unreachable). Build packets by script: `node tools/packet.mjs --question "…" --diff origin/main --files "src/*.cs"` — fails loudly past the ~200-line cap instead of truncating.
```

- [ ] **Step 2: README.md — Rails paragraph + Setup step 0**

In the council-layer section, extend the Rails paragraph. Old:
```markdown
Rails: packet in (≤200 lines), artifact out (≤150 lines, `.analysis/`), workers are blind to
each other, the synthesizer must log dissent instead of averaging it away. Optional parallel
execution: `tools/council.mjs`. Discipline lives in the `deep-analysis` skill + AGENTS.md
rule 10.
```
New:
```markdown
Rails: packet in (≤200 lines, assembled by hand or `tools/packet.mjs`), artifact out (≤150
lines, `.analysis/`), workers are blind to each other, the synthesizer must log dissent
instead of averaging it away. Optional parallel execution: `tools/council.mjs` (dead workers
retry once on their declared `fallback:` model). When rot-guard warns, `/handoff` → fresh
session → `/resume` continues from a distilled state artifact instead of a bloated context.
Discipline lives in the `deep-analysis` skill + AGENTS.md rule 10.
```

In the Setup section, insert a new first step before the current step 1 (renumber is unnecessary if the list is manually numbered — make this step `0.`):
```markdown
0. **Doctor:** `node tools/doctor.mjs --offline` for static sanity now; run it again WITHOUT
   `--offline` once the proxy is configured — it round-trips every pinned model and proves
   headless agent routing before you bet a workday on it.
```

- [ ] **Step 3: Verify rendering-level sanity**

```powershell
Select-String -Path USAGE.md -Pattern '/handoff|/resume|doctor.mjs|no-retry' | Measure-Object | % Count
Select-String -Path README.md -Pattern 'doctor.mjs|/handoff' | Measure-Object | % Count
```
Expected: USAGE count ≥ 4; README count ≥ 2.

- [ ] **Step 4: Commit**

```powershell
git add USAGE.md README.md
git commit -m "docs: session hygiene commands, doctor/packet tools, fallback retry"
```

---

### Task 11: final sweep + PR

- [ ] **Step 1: Full local verification battery**

```powershell
node --check tools/frontmatter.mjs; node --check tools/packet.mjs; node --check tools/council.mjs; node --check tools/doctor.mjs
node tools/doctor.mjs --offline; echo "doctor exit=$LASTEXITCODE"
git status --short
```
Expected: four silent syntax checks; doctor `exit=0` with 0 fail; `git status` clean except (possibly) the user's pre-existing `.opencode/agent/reviewer.md` local edit — LEAVE IT UNSTAGED.

- [ ] **Step 2: Push and open the PR**

```powershell
git push -u origin feat/field-hardening
```
Open the PR with the GitHub MCP `create_pull_request` tool (the `gh` CLI is hook-blocked for mutations): base `main`, head `feat/field-hardening`, title `feat: field hardening — doctor, handoff/resume, packet assembly, fallback retry`. Body: summarize the four components + mode policy, link the spec, list the verification evidence (doctor offline green, retry A/B transcript lines, packet cap-overflow table). **Do not merge** — the user merges.

- [ ] **Step 3: Report**

Tell the user: PR number/URL, the one-line status of each component's home verification, and the two things only the work machine can validate (live doctor run against the proxy; a real `/handoff` → `/resume` cycle).
