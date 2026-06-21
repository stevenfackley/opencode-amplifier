---
id: swift-observable-viewmodel
language: swift
version_bounds: "Swift 5.9+ ; iOS 17 / macOS 14+ (Observation framework)"
last_validated: 2026-06-21
success_rate: null
applicability:
  - "a SwiftUI view needs an observable model with async loading + loading/error state"
  - "targeting iOS 17+/macOS 14+ where the Observation framework is available"
forbidden_contexts:
  - "deployment target below iOS 17 (must use ObservableObject/@Published instead)"
  - "trivial view-local state (a @State value is enough — no model object needed)"
failure_modes:
  - "weak models default to ObservableObject + @Published (older, more re-renders)"
  - "shadowing the `error` property with the catch binding (use self.error)"
  - "forgetting @MainActor, so UI state is mutated off the main actor"
topology: "SwiftUI presentation / view-model layer"
---

# Pattern: swift-observable-viewmodel

**Language / stack:** Swift 5.9+, SwiftUI, the Observation framework (iOS 17+/macOS 14+)

## When to use
A SwiftUI screen needs a model object that loads data asynchronously and exposes
loading/error/content state. `@Observable` is the modern replacement for
`ObservableObject` + `@Published`.

## When NOT to use
- Deployment target below iOS 17 — fall back to `ObservableObject`/`@Published`.
- State that's purely view-local — just use `@State`.

## Key decisions (the part the model can't derive)
- **`@Observable` beats `ObservableObject`/`@Published`:** no protocol conformance, no
  per-property attribute, and SwiftUI tracks only the fields a view actually *reads* — so
  unrelated changes don't re-render that view. Weak models default to the older, chattier form.
- **`@MainActor` on the model** keeps UI state mutation on the main actor; `async` work still
  suspends correctly.
- **State is `private(set)`** — views read it, only the model mutates it.
- In the view: `@State private var model = WidgetsModel(...)`, drive it with `.task { await
  model.load() }`, and use `@Bindable var model` when you need two-way bindings to controls.

## Gotchas
- Inside `catch`, the binding is also named `error` — assign to `self.error`, not `error`.
- Don't recreate the model on every view update; hold it in `@State` (or inject it).

## The example
See `WidgetsModel.swift`.
