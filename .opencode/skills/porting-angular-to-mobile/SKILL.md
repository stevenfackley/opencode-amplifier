---
name: porting-angular-to-mobile
description: Use when reproducing a developed Angular web app/feature as a native mobile screen (Swift/SwiftUI or MAUI). You are READING Angular to extract behavior, state, API calls, and validation — not writing Angular. Includes an Angular→mobile concept map.
---

# Porting Angular Features to Mobile

You're not maintaining the Angular app — you're reproducing its behavior on mobile. Read it to
extract the spec, not to admire the framework. Reproduce the **behavior and UX contract**, not
the DOM.

## Extract in this order — this IS the reproduction spec
1. **Screens & routing** — the route config (`app.routes.ts` / `RouterModule`) → your screen list
   and nav graph. Route params/guards → your nav arguments + access rules.
2. **API calls** — services using `HttpClient`. Endpoints, request/response shapes, headers/auth.
   This is the SAME backend your mobile app hits — reuse the contract (`consuming-shared-libraries`
   / `swift-api-client`).
3. **State** — what each component holds vs. a shared service (signals / `BehaviorSubject` / NgRx
   store) → your mobile view-model state.
4. **Validation & business rules** — reactive-form `Validators`, custom validators, logic in
   services. Reproduce these EXACTLY (a looser/stricter mobile form is a defect).
5. **UX flows & edge cases** — loading/empty/error/disabled states, conditional rendering
   (`@if`/`@for`/`@empty`, `*ngIf`), confirmations. The states are the spec.

## Angular → mobile concept map
| Angular | SwiftUI | MAUI |
|---|---|---|
| Standalone component | `View` | `ContentPage` + XAML |
| `@Input()` / `@Output()` | init params / closures (or Combine) | bindable props / events |
| Service (`providedIn:'root'`) + DI | `@Observable` model / injected service | DI service (`maui-di-services`) |
| Signal / `BehaviorSubject` | `@Observable` prop / `@State` | `[ObservableProperty]` |
| RxJS pipe / stream | `async`/`await`, `AsyncStream`, Combine | events / `IObservable`, async |
| `HttpClient` service | `swift-api-client` | typed `HttpClient` + ACL |
| Reactive form + `Validators` | form state + validation funcs | validation in the VM |
| Router + guards | `NavigationStack` + nav state | Shell routes + guards |
| `@if` / `@for` control flow | `if` / `ForEach` | `CollectionView` / triggers |
| Pipe (`date`, `currency`) | `Formatter` / computed | `IValueConverter` |

## Gotchas
- **Reproduce validation to the letter** — web/mobile validation mismatch is a real bug.
- RxJS hides timing (`debounceTime`, `switchMap`, `retry`) — capture the behavior, not just the
  final value.
- Web layout ≠ mobile layout — reproduce the *flow and rules*, redesign the *presentation* for
  touch (apply `distinctive-ui-design`; don't transliterate the web look).
- Server-driven behavior (interceptors, route guards) may need a mobile equivalent.

## Output a reproduction spec
Screens → state → API contract → validation rules → UX states/edge cases → open questions for the
web team. Then build with `/plan`. The annotated `angular-feature-anatomy` pattern shows where
each of these lives in real Angular code.
