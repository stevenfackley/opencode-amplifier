// Vertical slice: one feature = one file. Endpoint + request + handler + validation colocated.
// Contrast with the layered default (Controllers/ + Services/ + DTOs/ spread across folders).

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Patterns.MinimalApiSlice;

public static class CreateWidget
{
    public record Request(string Name, int Quantity);
    public record Response(Guid Id, string Name);

    // Register the route. From Program.cs:  app.MapCreateWidget();
    public static IEndpointRouteBuilder MapCreateWidget(this IEndpointRouteBuilder app)
    {
        app.MapPost("/widgets", Handle)
           .WithName(nameof(CreateWidget))
           .Produces<Response>(StatusCodes.Status201Created)
           .ProducesValidationProblem();
        return app;
    }

    // Handler: validate -> act -> typed result. No persistence details leak in here.
    private static async Task<IResult> Handle(Request req, IWidgetStore store, CancellationToken ct)
    {
        var errors = Validate(req);
        if (errors.Count > 0) return Results.ValidationProblem(errors);

        var id = await store.AddAsync(req.Name, req.Quantity, ct);
        return Results.Created($"/widgets/{id}", new Response(id, req.Name));
    }

    private static Dictionary<string, string[]> Validate(Request r)
    {
        var e = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(r.Name)) e[nameof(r.Name)] = ["Name is required."];
        if (r.Quantity <= 0) e[nameof(r.Quantity)] = ["Quantity must be positive."];
        return e; // empty == valid
    }
}

// Persistence behind an interface keeps the slice testable and storage-agnostic.
public interface IWidgetStore
{
    Task<Guid> AddAsync(string name, int quantity, CancellationToken ct);
}
