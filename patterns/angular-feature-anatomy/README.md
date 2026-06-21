---
id: angular-feature-anatomy
language: typescript
version_bounds: "modern standalone Angular (v17+: signals, @if/@for, inject())"
last_validated: 2026-06-21
success_rate: null
applicability:
  - "reproducing an Angular feature on mobile and you need to locate state/API/validation fast"
  - "you don't write Angular daily but must read it to extract a reproduction spec"
forbidden_contexts:
  - "actually building or maintaining an Angular app (this is a READING aid, not a build guide)"
failure_modes:
  - "weak models transliterate the web DOM/layout straight to mobile"
  - "missing reactive-form validators -> mobile form rules drift from web"
  - "missing loading/empty/error states that the @if/@for/@empty blocks encode"
topology: "reference: an Angular feature you must reproduce on mobile"
---

# Pattern: angular-feature-anatomy

**Language / stack:** modern standalone Angular (v17+) — a READING aid for mobile reproduction

## When to use
You're reproducing an Angular feature on mobile and need to quickly find the four things that
matter: routing, API contract, state, and validation. This annotated example shows where each
lives in idiomatic modern Angular so you can extract them even if you don't write Angular.

## When NOT to use
- You're actually building/maintaining Angular — this is a reproduction aid, not a how-to.

## How to read it for reproduction (the part the model can't derive)
- **Service** (`@Injectable({providedIn:'root'})`) = the API contract + shared state. The
  endpoints and DTO shapes here are the SAME backend your mobile app calls — reuse them via
  `swift-api-client`, don't re-derive.
- **Component signals** = the screen's view-model state → map to `@Observable`/`[ObservableProperty]`.
- **Reactive form `Validators`** = business rules you must reproduce EXACTLY on mobile.
- **`@if`/`@for`/`@empty` blocks** = the loading/error/empty UX states → reproduce all of them.
- Everything in the `template` about *layout* is web-specific — redesign it for touch; keep the
  *flow and rules*.

## Gotchas
- RxJS `.subscribe()` / pipes can carry `debounceTime`/`switchMap`/`retry` semantics — capture the
  timing behavior, not just the value.
- Guards/interceptors live outside the component — check the route config and `app.config.ts`.

## The example
See `widgets.feature.ts` — a representative feature annotated with `// ->` reproduction notes.
