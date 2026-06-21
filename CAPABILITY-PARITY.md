# Capability parity: local Claude Code → OpenCode (this kit)

Goal: match — and in places exceed — a heavily-configured local Claude Code setup while driving
constrained models through the LM proxy. OpenCode is Claude-Code-compatible by design, so most
of this is *pointing at* existing assets rather than rebuilding them.

| Claude Code capability | OpenCode mechanism | In this kit | Status |
|---|---|---|---|
| **Agent Skills** (`SKILL.md`) | Native: discovers `.opencode/skills/`, `~/.config/opencode/skills/`, **and `.claude/skills/`** | `brainstorming`, `test-driven-development`, `verification-before-completion`; your existing `.claude/skills/` (superpowers etc.) are auto-discovered | **Parity+** |
| **CLAUDE.md** project memory | `AGENTS.md` (project + global) with `~/.claude/CLAUDE.md` fallback | `AGENTS.md` rails | **Parity** |
| **Subagents** (Explore, Plan, reviewers…) | Agents in `.opencode/agent/` with per-agent `model` | `architect`, `executor` (Build), `reviewer`, `reviewer-cheap`, `tester`, `debugger`; built-in `Explore`/`General`/`Scout` | **Parity+** |
| **Slash commands** | `.opencode/command/` with `$ARGUMENTS`, `@file`, `` !`shell` `` | `/plan /verify /debug /pattern /cross-check /review /spec-tests /consistency /evidence /reground /revert-green` | **Parity** |
| **MCP servers** | `opencode.json` `mcp` (local + remote) | docs, git, filesystem-over-corpus, github, playwright, episodic-memory (templated) | **Parity** |
| **Hooks** | Plugins in `.opencode/plugins/` (JS/TS) with events `tool.execute.before/after`, `session.*`, `file.edited`, `permission.*` | `guardrails`, `tdd-lock`, `compaction`, `escalation` | **Parity** |
| **Memory / recall** | `instructions` glob loads `memory/MEMORY.md`; `episodic-memory` MCP for semantic recall | `memory/` + MEMORY.md + episodic-memory MCP | **Parity** |
| **Plan mode** | Built-in Plan agent (restricted) + `architect` | `/plan` → `TASK.json` + checklist | **Parity+** |
| **Instructions/rules globbing** | `instructions: [...]` supports globs + remote URLs | loads `AGENTS.md`, `memory/MEMORY.md`, `.cursor/rules/*.md` | **Parity** |
| **Per-session single model** | **Per-AGENT model** | planner/executor/reviewer on 3 different models; `/cross-check` ensemble | **Exceeds** |
| **Output styles** (Explanatory/Learning) | Prompt-level only | encode the style in `AGENTS.md` or an agent prompt | Approx |
| **Parallel subagents** | Agents + plugin orchestration | `/review` and `/cross-check` fan out | **Parity** |
| **Reasoning effort** | Provider/model options (if proxy exposes thinking) | enable on reasoning-role agents | Proxy-dependent |

## The three places OpenCode + this kit can *beat* local CC
1. **Per-agent models** → genuine planner≠executor≠reviewer model diversity; CC runs one model
   per session.
2. **Cross-model ensembles** (`/cross-check`, `/review` consensus, decorrelated cheap reviewer)
   → catches errors a single model can't.
3. **Contract-governed state** (`TASK.json`, TDD lock, plan↔artifact check, eval harness) →
   discipline enforced by hooks/checks, not just prompts.

## Fastest path to parity on your personal machine
OpenCode auto-discovers `.claude/skills/`. Point it at your existing superpowers library and it
"just works" — no porting. This kit ships *original, generic* skills so the **work** environment
(where your personal `.claude/` won't exist) is self-sufficient and the public repo stays
unambiguously yours.
