// Modern MAUI dependency injection. Register the graph in MauiProgram; constructor injection
// builds it. Replaces DependencyService (deprecated in .NET 10) and ad-hoc `new ViewModel()`.

using Microsoft.Extensions.Logging;

namespace Patterns.MauiDi;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .ConfigureFonts(fonts => { /* register fonts */ });

        // Services: Singleton = stateless, app-lifetime.
        builder.Services.AddSingleton<IWidgetService, WidgetService>();
        builder.Services.AddHttpClient(); // typed/named clients with handlers > raw HttpClient

        // Pages + ViewModels: Transient so every navigation gets fresh state.
        builder.Services.AddTransient<WidgetsViewModel>();
        builder.Services.AddTransient<WidgetsPage>();

#if DEBUG
        builder.Logging.AddDebug();
#endif
        return builder.Build();
    }
}

// The page receives its ViewModel via the constructor — DI resolves the whole graph.
public partial class WidgetsPage : ContentPage
{
    public WidgetsPage(WidgetsViewModel vm)
    {
        InitializeComponent();
        BindingContext = vm;
    }
}

// Register Shell routes once (e.g. in AppShell ctor); DI still injects the page's dependencies.
//   Routing.RegisterRoute(nameof(WidgetsPage), typeof(WidgetsPage));
//
// Marshal to the UI thread with the dispatcher (NOT Device.BeginInvokeOnMainThread):
//   await Dispatcher.DispatchAsync(() => Error = message);
