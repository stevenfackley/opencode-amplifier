---
id: maui-di-services
language: csharp
version_bounds: ".NET 8+ MAUI"
last_validated: 2026-06-21
success_rate: null
applicability:
  - "wiring services, view-models, and pages in a .NET MAUI app"
  - "a view-model or page needs a dependency (HttpClient, a service, etc.)"
forbidden_contexts:
  - "non-MAUI .NET (use the generic host DI directly)"
  - "a trivial app with no services or shared state"
failure_modes:
  - "weak models reach for DependencyService (deprecated in .NET 10) or `new ViewModel()`"
  - "registering pages/VMs with the wrong lifetime (Singleton page keeps stale state)"
  - "using Device.BeginInvokeOnMainThread (deprecated) instead of Dispatcher.DispatchAsync"
topology: "composition root (MauiProgram) + pages"
---

# Pattern: maui-di-services

**Language / stack:** C# / .NET MAUI built-in DI

## When to use
Any MAUI app with services and view-models. Register everything in `MauiProgram` and let
constructor injection build the graph. This is the modern replacement for `DependencyService`
(deprecated) and ad-hoc `new ViewModel()`.

## When NOT to use
- Non-MAUI .NET — use the generic host's DI directly.
- A toy app with no services worth registering.

## Key decisions (the part the model can't derive)
- **Lifetimes matter:**
  - `AddSingleton` for stateless, app-lifetime services (clients, caches).
  - `AddTransient` for **pages and view-models** so each navigation gets a fresh instance —
    a Singleton page keeps stale UI state across navigations.
- **Pages take their ViewModel via the constructor**; MAUI resolves the whole graph when the
  page is created. No `BindingContext = new WidgetsViewModel(...)` by hand.
- **Shell routes** are registered with `Routing.RegisterRoute(...)`; DI still supplies the
  page's constructor dependencies.
- **Main-thread marshaling** uses `Dispatcher.DispatchAsync(...)`, NOT the deprecated
  `Device.BeginInvokeOnMainThread`.

## Gotchas
- Don't capture a Transient (page/VM) inside a Singleton — it leaks and defeats the lifetime.
- Register `HttpClient` via `AddHttpClient` if you need named/typed clients + handlers.

## The example
See `MauiProgram.cs`.
