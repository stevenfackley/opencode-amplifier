// Modern MAUI MVVM with CommunityToolkit.Mvvm source generators.
// Contrast with the weak-model default: hand-written INotifyPropertyChanged + ICommand.

using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Patterns.MauiMvvm;

// `partial` is REQUIRED — the source generators write the generated half of this class.
public partial class WidgetsViewModel : ObservableObject
{
    private readonly IWidgetService _service;

    // Constructor injection (registered in MauiProgram). NOT DependencyService (deprecated).
    public WidgetsViewModel(IWidgetService service) => _service = service;

    public ObservableCollection<string> Widgets { get; } = [];

    // [ObservableProperty] turns the private field into a public `IsBusy` with change
    // notification — no manual OnPropertyChanged plumbing.
    [ObservableProperty]
    private bool _isBusy;

    [ObservableProperty]
    private string? _error;

    // [RelayCommand] generates `LoadCommand` (IAsyncRelayCommand) from this method, with
    // async execution and cancellation handled for you. Bind to it: Command="{Binding LoadCommand}".
    [RelayCommand]
    private async Task LoadAsync(CancellationToken ct)
    {
        if (IsBusy) return;
        IsBusy = true;
        Error = null;
        try
        {
            Widgets.Clear();
            foreach (var w in await _service.GetWidgetsAsync(ct))
                Widgets.Add(w);
        }
        catch (Exception ex)
        {
            Error = ex.Message; // surface to bound UI state — don't crash the page
        }
        finally
        {
            IsBusy = false;
        }
    }
}

public interface IWidgetService
{
    Task<IReadOnlyList<string>> GetWidgetsAsync(CancellationToken ct);
}
