---
description: Analyze an Angular feature and produce a mobile (Swift/MAUI) reproduction spec
model: gpt-5.1     # reads unfamiliar Angular & extracts exact rules. For apps > 200k tokens use a 1M-ctx model: nemotron-3-super-120b-a12b or llama-4-scout
---

Follow `porting-angular-to-mobile`. Read the Angular source provided (components, services,
routes, forms) and output a **mobile reproduction spec**:

1. **Screens & nav graph** — from the route config (params, guards).
2. **Per-screen state** — component-local vs shared service/store.
3. **API calls** — endpoints + request/response shapes + auth (this is the same backend; reuse
   the contract via `swift-api-client`).
4. **Validation & business rules** — list EVERY validator/rule to reproduce exactly.
5. **UX states & edge cases** — loading / empty / error / disabled / confirmations.
6. **Angular→mobile mapping notes** + **open questions for the web team**.

Reproduce behavior and rules; redesign presentation for touch. The output should be ready to feed
into `/plan`.

Angular feature (paste paths with @ or describe it):
$ARGUMENTS
