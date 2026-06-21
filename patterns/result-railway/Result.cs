// Minimal railway-oriented Result<T,E>. Self-contained; drop into any C# 9+ project.
// The point: expected failures are *values* with types, not exceptions, and the compiler
// forces every caller to handle the error track.

namespace Patterns.ResultRailway;

public readonly record struct Error(string Code, string Message);

public readonly struct Result<T>
{
    private readonly T _value;
    private readonly Error _error;
    public bool IsOk { get; }

    private Result(T value) { _value = value; _error = default; IsOk = true; }
    private Result(Error error) { _value = default!; _error = error; IsOk = false; }

    public static Result<T> Ok(T value) => new(value);
    public static Result<T> Fail(Error error) => new(error);
    public static Result<T> Fail(string code, string message) => new(new Error(code, message));

    // Bind: chain the NEXT step that can also fail. Stays on the error track if already failed.
    public Result<TNext> Bind<TNext>(Func<T, Result<TNext>> next) =>
        IsOk ? next(_value) : Result<TNext>.Fail(_error);

    // Map: transform a success value with a function that CANNOT fail.
    public Result<TNext> Map<TNext>(Func<T, TNext> transform) =>
        IsOk ? Result<TNext>.Ok(transform(_value)) : Result<TNext>.Fail(_error);

    // Match: the only way to read the value — both paths must be handled.
    public TOut Match<TOut>(Func<T, TOut> onOk, Func<Error, TOut> onErr) =>
        IsOk ? onOk(_value) : onErr(_error);
}

// --- Worked usage: a 3-step pipeline that short-circuits on the first failure --------------
public static class Demo
{
    record Order(string Id, int Qty);

    static Result<Order> Parse(string raw) =>
        string.IsNullOrWhiteSpace(raw)
            ? Result<Order>.Fail("parse", "empty input")
            : Result<Order>.Ok(new Order(raw, 3));

    static Result<Order> Validate(Order o) =>
        o.Qty > 0
            ? Result<Order>.Ok(o)
            : Result<Order>.Fail("validate", "qty must be positive");

    static Result<string> Save(Order o) =>
        Result<string>.Ok($"saved {o.Id}");

    public static string Run(string raw) =>
        Parse(raw)
            .Bind(Validate)   // each Bind only runs if the previous step succeeded
            .Bind(Save)       // no null checks, no nested ifs — the railway handles it
            .Match(
                onOk:  msg => $"OK: {msg}",
                onErr: err => $"ERR[{err.Code}]: {err.Message}");
}
