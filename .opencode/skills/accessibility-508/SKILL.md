---
name: accessibility-508
description: Use when building or reviewing any user-facing UI (SwiftUI or MAUI) that must meet Section 508 / WCAG 2.1 AA — a legal mandate for federal/defense software. Covers names, roles, values, Dynamic Type, contrast, focus, touch targets, and the platform-specific screen-reader traps weak models get wrong.
---

# Section 508 / WCAG Accessibility

For federal/defense software, 508 conformance (≈ WCAG 2.1 AA) is a **legal requirement**, not a
nicety — non-conformant UI can fail an audit and block delivery. Build it in; don't bolt it on.

## The non-negotiables (every screen)
- **Name, role, value** for every interactive element. A control a screen reader can't announce
  is a defect.
- **Don't rely on color alone** (WCAG 1.4.1) — pair color with text/icon/shape for state.
- **Contrast** ≥ 4.5:1 for body text, 3:1 for large text/UI components (WCAG 1.4.3).
- **Text scales** — support Dynamic Type / large fonts up to accessibility sizes (1.4.4); don't
  hard-cap font sizes or truncate at large sizes.
- **Touch targets** ≥ 44×44pt (WCAG 2.5.5).
- **Logical focus order** and visible focus; announce async state changes.
- **Decorative imagery is hidden** from assistive tech; meaningful imagery has a description.

## SwiftUI
- `.accessibilityLabel`, `.accessibilityHint`, `.accessibilityValue`, `.accessibilityAddTraits(.isButton/.isHeader)`.
- `.accessibilityElement(children: .combine)` to read a composed row as ONE element.
- `.accessibilityHidden(true)` on decorative images (icons whose meaning is in adjacent text).
- Use semantic fonts (`.font(.body)` etc.) so Dynamic Type works; allow `.dynamicTypeSize(...)`.
- Announce changes: `AccessibilityNotification.Announcement("Saved").post()`.

## MAUI (platform traps — these are where models go wrong)
- **Never set `SemanticProperties.Description` on a `Label`** — it overrides `Text` and double-reads.
  Let `Text` speak.
- **Entry/Editor:** use `Placeholder` for context; AVOID `Description` (breaks Android TalkBack
  edit actions). Don't set both `Hint` and `Placeholder` on Android — they collide.
- **Never put `Description` on a layout container** — on iOS/VoiceOver it makes the whole group one
  element and hides the children. Let children be individually focusable; use
  `AutomationProperties.IsInAccessibleTree="false"` / `ExcludedWithChildren` for decorative groups.
- Icon-only buttons and meaningful `Image`s NEED `SemanticProperties.Description`.
- `HeadingLevel` for section headers (Windows Narrator honors all levels; iOS/Android only
  heading-vs-not — set them anyway for correctness).
- Dynamic content: `SemanticScreenReader.Announce(...)`; `SetSemanticFocus()` after nav/errors;
  `TabIndex` for order.

## Reproducing an Angular app? Carry the a11y over
Angular apps often have ARIA roles/labels and form-error associations. Capture those in the
reproduction spec (`porting-angular-to-mobile`) and reproduce the equivalent — a11y is part of the
behavior contract, not just styling.

## Verify — automated checks are necessary but NOT sufficient
Run the real screen readers (VoiceOver on iOS, TalkBack on Android, Narrator on Windows) and tab
through with the keyboard. Confirm reading order, every control's announcement, and large-text
layout. Add accessibility to the `/verify` and `/review` gates for user-facing screens.
