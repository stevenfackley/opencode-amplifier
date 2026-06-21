---
id: swiftui-accessibility
language: swift
version_bounds: "Swift 5.7+ / iOS 15+ (SwiftUI accessibility)"
last_validated: 2026-06-21
success_rate: null
applicability:
  - "building SwiftUI UI that must meet Section 508 / WCAG 2.1 AA (federal/defense)"
  - "any user-facing screen — accessibility is part of the behavior contract"
forbidden_contexts:
  - "internal throwaway tooling with no compliance need (still good practice, but not required)"
failure_modes:
  - "icon-only buttons with no accessibilityLabel; state conveyed by color alone"
  - "fixed font sizes that ignore Dynamic Type; tap targets under 44pt"
  - "decorative images announced; composed rows read as separate fragments"
topology: "SwiftUI presentation (accessibility)"
---

# Pattern: swiftui-accessibility

**Language / stack:** SwiftUI, iOS 15+ — concrete 508/WCAG techniques

## When to use
Any user-facing SwiftUI screen in a federal/defense context (508 is a legal requirement). This
shows the moves a constrained model omits: explicit names, traits, combined elements, hidden
decoration, Dynamic Type, and announcements. Pairs with `accessibility-508` and applies on top of
`swiftui-screen-editorial`.

## When NOT to use
- Internal throwaway tooling with no compliance obligation (still good practice).

## Key decisions (the part the model can't derive)
- **Name + role + value, explicitly.** Icon-only buttons need `.accessibilityLabel`; state needs
  `.accessibilityValue`; tappables need `.accessibilityAddTraits(.isButton)`.
- **Never color-only state** (WCAG 1.4.1) — encode state in the accessible value/text too.
- **Combine composed rows** with `.accessibilityElement(children: .combine)` so a card reads as one
  element, not three fragments.
- **Hide decoration** with `.accessibilityHidden(true)` when an adjacent label carries the meaning.
- **Dynamic Type:** semantic fonts (`.font(.body)`) scale; allow large sizes; don't hard-cap.
- **≥ 44pt targets** (WCAG 2.5.5). **Announce** async changes so SR users aren't stranded.

## Gotchas
- Automated checks ≠ conformance — VoiceOver testing is still required.
- `.accessibilityHidden` on a parent hides its children too — scope it to the decorative view.

## The example
See `Accessible.swift`.
