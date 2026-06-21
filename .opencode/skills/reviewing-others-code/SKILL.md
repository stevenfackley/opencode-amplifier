---
name: reviewing-others-code
description: Use when reviewing someone else's code or pull request (you are the reviewer). Staff-level review discipline — prioritize by severity, separate blocking from non-blocking, review design not just lines, and give kind, specific, actionable feedback that also mentors. Distinct from auto-reviewing your own generated code.
---

# Reviewing Others' Code

You are reviewing a teammate's work, not rewriting it. Goal: catch what matters, help it ship
safely, and help the author grow — without nitpicking them to death or rubber-stamping.

## Read for context first
- What problem does this PR solve? Read the description + linked issue. Review against the
  author's INTENT, not your preferred implementation.
- Skim the whole diff before commenting on any line — understand the shape before the details.
- Pull and run it if the change is non-trivial. Observed behavior beats read behavior.

## Prioritize — comment in this order, and LABEL severity
1. **Correctness** — bugs, race conditions, edge/empty/error cases, off-by-ones, wrong logic.
2. **Security** — injection, authz/authn, secrets in code, unsafe deserialization, input validation.
3. **Design / architecture** — wrong abstraction, leaky boundaries, decisions that are hard to
   reverse, missing tests for the risky part. This is where staff review adds the most value.
4. **Maintainability** — clarity, naming, duplication, complexity that will bite in 6 months.
5. **Style / nits** — last, and only if a linter doesn't already own it.

Label every comment **[blocking]**, **[consider]**, or **[nit]**. The author must never have to
guess what *must* change versus what's optional.

## How to write each comment
- Specific: file:line, the concrete problem, and a suggested direction — not just "this is wrong."
- Ask when you might lack context: "what happens if `x` is null here?" beats a wrong decree.
- Explain the *why* — that's the mentoring; a reason teaches, a demand doesn't.
- Call out genuinely good choices. Review isn't only fault-finding.

## Calibrate to author and change
- A hotfix and a greenfield feature deserve different bars — don't gold-plate an urgent fix.
- Junior author → more teaching + links; senior author → trust more, focus on the hard parts.
- Team conventions and the linter win over your personal style. Don't dress up taste as correctness.

## Close with a clear verdict
**Approve / Approve with nits / Request changes**, plus a 2–3 line summary: what's strong, what's
blocking, what's optional. Respect the author's time and their ownership of the code.
