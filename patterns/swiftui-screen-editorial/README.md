---
id: swiftui-screen-editorial
language: swift
version_bounds: "Swift 5.9+ / iOS 17+ (@Observable, SwiftUI)"
last_validated: 2026-06-21
success_rate: null
applicability:
  - "building a SwiftUI content screen that must meet the distinctive-ui-design standard"
  - "you want a worked reference for a non-generic, crafted mobile screen"
forbidden_contexts:
  - "a platform-standard utilitarian form where the iOS HIG default is genuinely right"
  - "deployment target below iOS 17 (uses @Observable)"
failure_modes:
  - "weak models emit a default List + system font + blue accent + equal rows + flat background"
  - "no committed aesthetic; no entrance animation; transliterated web layout"
  - "hardcoding colors/sizes instead of a Theme token layer"
topology: "SwiftUI presentation / screen"
---

# Pattern: swiftui-screen-editorial

**Language / stack:** SwiftUI, iOS 17+ — a WORKED screen built to `distinctive-ui-design`

## When to use
You're building a content screen and "looks generic" is the failure to avoid. This is the
implemented reference: it shows where each design lever becomes real SwiftUI code. It composes
with `swift-observable-viewmodel` (state) and `design-tokens` (the aesthetic).

## When NOT to use
- A standard system form where the HIG default is correct — don't over-design a settings page.
- Below iOS 17 (swap `@Observable` for `ObservableObject`).

## The committed direction (swap this for your own — don't ship MY aesthetic everywhere)
**Warm editorial:** Fraunces serif display + Schibsted Grotesk body, ink-on-paper with an ember
accent. Per the skill, every screen should commit to ITS OWN extreme; this is one worked instance,
not a house style.

## Key decisions (the part the model can't derive)
- **A `Theme` token layer**, not inline hex/points — mirrors `design-tokens`. Retheme in one place.
- **Distinctive type as identity:** `.custom("Fraunces", …)` for an oversized serif headline, a
  grotesque body — never the system font as the personality.
- **Asymmetric editorial rows:** an oversized ember index column + stacked title/summary, separated
  by **hairline dividers** — deliberately NOT a stack of equal rounded cards.
- **Atmosphere:** a layered `LinearGradient` + a soft ember `RadialGradient` glow — not a flat fill.
- **One orchestrated entrance:** rows fade+rise with a per-index `animation(...).delay(i * 0.06)`
  staggered reveal — more delight than scattered micro-interactions.
- **All states designed:** loading, empty, error(retry) are crafted, not a bare `ProgressView`.

## Gotchas
- `.custom(...)` fonts need the font files bundled + listed in `Info.plist` (`UIAppFonts`), or they
  silently fall back to system. Bundle them to actually hit the standard.
- Prefer an asset catalog for colors in a real app (free light/dark); inline `Color(...)` here keeps
  the example self-contained.

## The example
See `EntriesView.swift` — a complete, preview-able screen.
