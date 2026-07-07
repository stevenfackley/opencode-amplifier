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
