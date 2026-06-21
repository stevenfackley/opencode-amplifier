---
id: maui-mvvm-toolkit
language: csharp
version_bounds: ".NET 8+ MAUI ; CommunityToolkit.Mvvm v8+"
last_validated: 2026-06-21
success_rate: null
applicability:
  - "building a .NET MAUI ViewModel that binds UI to async data with loading/error state"
  - "you want source-generated INotifyPropertyChanged + commands, not hand-written boilerplate"
forbidden_contexts:
  - "trivial static pages with no state to bind"
  - "non-MAUI .NET (no CommunityToolkit.Mvvm dependency)"
failure_modes:
  - "weak models hand-write INotifyPropertyChanged + ICommand by hand (verbose, error-prone)"
  - "forgetting the `partial` keyword (the source generators need it)"
  - "reaching for MessagingCenter (made internal in .NET 10) — use WeakReferenceMessenger"
topology: "presentation / view-model layer"
---

# Pattern: maui-mvvm-toolkit

**Language / stack:** C# / .NET MAUI with `CommunityToolkit.Mvvm`

## When to use
A MAUI page needs a ViewModel that exposes bindable state and commands — especially async data
loading with `IsBusy`/error state. The Toolkit's source generators eliminate the
`INotifyPropertyChanged`/`ICommand` boilerplate constrained models otherwise hand-write (badly).

## When NOT to use
- A static page with nothing to bind.
- Non-MAUI projects (this depends on `CommunityToolkit.Mvvm`).

## Key decisions (the part the model can't derive)
- **`partial class : ObservableObject`** — the generator writes the other half; without
  `partial` it won't compile. This is the #1 thing weak models forget.
- **`[ObservableProperty]` on a private field** generates the public property + change
  notification. `_isBusy` → `IsBusy`. No manual `OnPropertyChanged`.
- **`[RelayCommand]` on a method** generates the command. `LoadAsync` → `LoadCommand` (an
  `IAsyncRelayCommand` with built-in async + cancellation). Bind `Command="{Binding LoadCommand}"`.
- **Errors become state, not crashes** — catch and surface to an `Error` property the UI binds,
  rather than letting the exception kill the page.
- Dependencies arrive by **constructor injection** (see `maui-di-services`), never
  `DependencyService` (deprecated).

## Gotchas
- Use compiled bindings in XAML (`x:DataType="vm:WidgetsViewModel"`) for performance + checks.
- For cross-VM messaging use `WeakReferenceMessenger`, not `MessagingCenter`.

## The example
See `WidgetsViewModel.cs`.
