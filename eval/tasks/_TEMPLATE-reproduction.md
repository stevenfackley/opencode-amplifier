# Eval task — Angular→mobile reproduction: <feature name>

**Tier:** reproduction (brownfield read + greenfield mobile build)
**Work type:** both (read web, build mobile)

> Copy this per real ticket. The eval is only as good as its tasks — use ACTUAL features you
> reproduced, so the numbers reflect your real work.

## Source (Angular)
- Feature / route: `<path or URL in the web app>`
- Key files: `<components, services, routes>`

## Prompt
Reproduce the `<feature>` screen on mobile (SwiftUI). Match behavior and validation; redesign the
presentation for touch to the `distinctive-ui-design` standard; meet 508/WCAG.

## Acceptance (objective — fill from the Angular source)
- Screens/navigation match the web route graph.
- API calls hit the same endpoints with the same shapes (reuse the contract).
- **Validation rules reproduced exactly** (list each: `<required, maxLength(40), min(1), …>`).
- UX states present: loading / empty / error / disabled / confirmations.
- Accessibility: names/roles/values, Dynamic Type, contrast, 44pt targets (`/a11y-review` passes).

## Metrics to capture (see METRICS.md)
- Turns to complete · time-to-screen · validation rules missed · a11y issues · review cycles ·
  tokens · merge-readiness (human edits needed).

## Configs to compare
B0 (Sonnet alone) · P (full pipeline: `/port-from-angular`→`/plan`→`/spec-tests`→build→`/review`).
