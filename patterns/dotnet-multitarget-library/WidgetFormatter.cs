// Shared code that compiles for BOTH netstandard2.0 and net10.0.
// `record` works on ns2.0 because PolySharp supplies the init/record polyfills.
// Anything net-only lives behind #if NET — never in the shared path.

using System;

namespace Patterns.MultiTarget;

public record Widget(string Name, int Quantity);

public static class WidgetFormatter
{
    public static string Describe(Widget w) => $"{w.Name} x{w.Quantity}";

    // Example of a net-only fast path. The ns2.0 floor MUST still have a working implementation.
    public static string Stamp()
    {
#if NET8_0_OR_GREATER
        // DateOnly is net6+ — only valid on the modern target.
        return DateOnly.FromDateTime(DateTime.UtcNow).ToString("O");
#else
        // ns2.0 floor: DateOnly does not exist here, so use DateTime.
        return DateTime.UtcNow.Date.ToString("yyyy-MM-dd");
#endif
    }
}
