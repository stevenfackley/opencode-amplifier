# USAGE — reach-for-this cheat sheet

One-line "use this when…" for everything in the kit. Skills trigger automatically by description;
commands you invoke with `/name`; agents you call with `@name` or via a command.

---

## Commands by workflow

### Build loop (the core cycle)
| Command | Reach for it when… |
|---|---|
| `/plan <task>` | Starting anything non-trivial → emits `TASK.json` ledger + checklist (architect, strong model) |
| `/spec-tests` | You have a plan → independent tester writes FAILING tests from it (anti-gaming) |
| `/verify` | After a step → run full build+tests, fix until green |
| `/consistency` | Tests are green → confirm the PLAN was actually satisfied (not just tests) |
| `/review` | After a non-trivial change → two different models review; agreement = high confidence |
| `/evidence` | Wrapping a task → merge-readiness pack with real output |
| `/reground` | Long task / after compaction → re-read ledger + state + real files before continuing |
| `/revert-green` | Dug a hole → revert to last known-green commit, record the dead end |

### Understand & ship
| Command | Reach for it when… |
|---|---|
| `/explain <file\|symbol>` | Orienting in unfamiliar code (do this BEFORE reviewing/porting) |
| `/pattern <name>` | About to design something → pull a golden example to adapt |
| `/cross-check <question>` | A hard/contested call → two models answer, reconcile disagreement |
| `/debug <symptom>` | A bug → forces reproduce→isolate→fix→verify (debugger agent) |
| `/pr-description` | Opening a PR → generate it from the actual branch diff |
| `/adr <decision>` | A significant architecture decision → write a grounded ADR |
| `/commit` | Staged changes → Conventional Commit message (doesn't commit) |

### Reviewing others (staff)
| Command | Reach for it when… |
|---|---|
| `/review-pr <#\|diff>` | Reviewing a teammate's PR → severity-labeled feedback + verdict (read-only) |

### Create
| Command | Reach for it when… |
|---|---|
| `/name <concept>` | Naming a product/feature → distinctive candidates + availability, no `-ly`/`Smart-` slop |
| `/design <brief>` | Building UI → commits to a bold aesthetic, avoids generic AI look (designer agent) |
| `/a11y-review <screen>` | A user-facing screen → audit it for Section 508 / WCAG (compliance, required) |

### Cross-team / cross-stack
| Command | Reach for it when… |
|---|---|
| `/swift-client <contract>` | Consuming a backend from Swift → typed client + anti-corruption mapping |
| `/port-from-angular <feature>` | Reproducing an Angular app on mobile → extracts a reproduction spec |

### Team & meta
| Command | Reach for it when… |
|---|---|
| `/setup` | Bootstrapping the kit on a project/teammate's machine → wires config, models, verifies |
| `/capture-pattern <solution>` | You solved something reusable → promote it into the corpus (compounds for everyone) |

---

## Skills (auto-trigger by description — no need to invoke)
| Skill | Fires when you're… |
|---|---|
| `brainstorming` | Starting creative/build work — explore intent before coding |
| `test-driven-development` | Implementing a feature/bugfix — RED→GREEN→REFACTOR, tests locked |
| `verification-before-completion` | About to claim "done" — gate on real evidence |
| `reviewing-others-code` | Reviewing a teammate's code — staff-level, severity-labeled |
| `creative-naming` | Naming anything — diverge across techniques, ban generic patterns |
| `distinctive-ui-design` | Building UI — commit to a direction, reject AI slop |
| `consuming-shared-libraries` | Depending on another team's lib/contract — ACL, pin, never fork |
| `dotnet-standard-2.0-compat` | Touching shared .NET code — stay on the ns2.0 compile floor |
| `porting-angular-to-mobile` | Reproducing an Angular feature on mobile — extract the spec |
| `accessibility-508` | Building/reviewing user-facing UI — 508/WCAG (legal mandate for defense) |

## Agents (call with `@name` or via a command)
| Agent | Model role | Purpose |
|---|---|---|
| `architect` | strong, read-only | Plan → TASK.json + checklist |
| `tester` | strong, different family | Spec tests from the plan, never sees impl |
| `reviewer` | ≠ executor model | Primary diff+plan+test-output review |
| `reviewer-cheap` | cheap, different family | Decorrelated second review vote |
| `debugger` | strong | Disciplined reproduce→isolate→fix→verify |
| `designer` | strong, temp 0.7 | Bold, non-generic UI |
| `pr-reviewer` | strong, read-only | Staff review of others' PRs |

## Plugins (hooks, run automatically)
| Plugin | Does |
|---|---|
| `tdd-lock` | Blocks test-file edits while `TDD_LOCK_TESTS=1` (anti-gaming) |
| `compaction` | Re-injects the brief after context compaction |
| `escalation` | Warns to escalate after repeated non-advancing failures |
| `guardrails` | Blocks reading secret files; session-idle hook |
| `metrics` | Optional ROI telemetry → local collector (set `METRICS_ENDPOINT`); off by default |

## Patterns
15 golden examples (C#/.NET, MAUI, Swift, SwiftUI, TS, Python, CSS, Angular). Browse
**`PATTERNS.md`** — pick by *fit* (applicability predicates), not similarity, and pull with
`/pattern <name>`.

---

## A typical session
```
/plan add offline caching to the widgets screen      # architect -> TASK.json
/spec-tests                                           # tester writes failing tests
export TDD_LOCK_TESTS=1                               # lock the contract
"implement step 1"                                    # executor, one step
/verify                                               # green?
/consistency                                          # plan actually satisfied?
/review                                               # two-model review
# ...repeat per step, commit each green step...
/evidence                                             # merge-readiness pack
```

## Quick "I'm stuck / what do I reach for?"
- Don't know the codebase → `/explain`
- Don't know the approach → `/plan` (or `brainstorming` fires on its own)
- Model keeps failing the same step → `escalation` will warn; use `/debug` or escalate the model
- Reproducing a web screen → `/port-from-angular` then `/plan`
- Calling their backend → `/swift-client`
- It "looks generic" → `/design`
- Naming it → `/name`
