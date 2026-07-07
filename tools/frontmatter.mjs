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
