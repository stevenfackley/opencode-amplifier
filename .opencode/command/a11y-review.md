---
description: Audit a screen or diff for Section 508 / WCAG 2.1 AA conformance
model: gpt-5.1     # strong model for criterion-by-criterion audit
---

Audit the target below against the `accessibility-508` skill. Go criterion by criterion and
report issues with WCAG reference, severity, file:line, and the concrete fix:

1. Name/role/value on every interactive element (icon buttons especially).
2. Color not the only signal of state/meaning (1.4.1).
3. Contrast ≥ 4.5:1 text / 3:1 large+UI (1.4.3).
4. Text scales with Dynamic Type / large fonts; no hard caps or truncation (1.4.4).
5. Touch targets ≥ 44×44pt (2.5.5).
6. Logical focus order; async changes announced.
7. Decorative imagery hidden; meaningful imagery described.
8. Platform traps: MAUI `Description` on Labels/containers/Entries; SwiftUI missing labels/traits.

End with a PASS/FAIL per criterion and the top blocking fixes. Note that real screen-reader
testing (VoiceOver/TalkBack/Narrator) is still required — flag what must be manually verified.

Target (paste @paths, a diff, or a screen):
$ARGUMENTS
