---
name: test-driven-development
description: Use when implementing any feature or bugfix. Write a failing test first (RED), the minimal code to pass it (GREEN), then refactor. With constrained models the test is an executable spec the model cannot drift from — and it structurally prevents verification gaming.
---

# Test-Driven Development

A weak model that writes code first and tests later will write tests that rubber-stamp its own
bugs. TDD flips that: the test becomes a contract written *before* the implementation exists,
so it can't be reverse-engineered to pass broken code.

## The loop
1. **RED** — write one small test that expresses the next required behavior. Run it. Watch it
   FAIL for the right reason. A test that passes immediately is testing nothing.
2. **GREEN** — write the minimal code to make that test pass. No extra features. Run the suite.
3. **REFACTOR** — clean up with the test as a safety net. Re-run; stay green.
4. Repeat for the next behavior.

## Hard rules (these are what make it work with weak models)
- **Test files are locked during GREEN.** Once a test is written and committed, the
  implementation step may NOT edit it. If a test needs to change, that's a separate, explicit
  decision — never a silent edit to make red go green. (Enforced by the `tdd-lock` plugin.)
- For non-trivial features, the **tester agent** (a different model that never sees your
  implementation) writes the spec tests from the plan — use `/spec-tests`.
- Show the actual RED output and the actual GREEN output. "It passes" without the run is a
  violation of `verification-before-completion`.

## When to relax
- Throwaway spikes/exploration — but the moment you keep the code, back-fill the tests.
- True UI pixel-tweaks where a test costs more than it protects — use judgment, state it.
