# Merge-readiness evidence pack — <task title>

> A conversational "done" is too easy to game. A task is complete only when this pack is filled
> with **real output**, not claims. Generate with `/evidence`.

## 1. Build
```
<paste actual build command + output>
```

## 2. Tests
```
<paste full-suite run + summary line, e.g. "142 passed, 0 failed">
```
- New behavior covered by: `<test name>` — seen RED before, GREEN after? <yes/no>
- Test files modified during implementation? **<must be: no>** (tdd-lock enforces)

## 3. Plan → diff mapping (consistency)
| Plan invariant / step | Implemented? | Where (file:line) |
|---|---|---|
| <invariant 1> | yes/no | |
| <step 1> | yes/no | |

- Forbidden files touched? **<must be: no>**
- Unplanned edits: <list + one-line justification each, or "none">

## 4. Known gaps / risks
- <anything not covered, edge cases deferred, follow-ups — or "none">

## 5. Recovery
- Last green commit: `<sha>`
- Rollback: `<command>`
