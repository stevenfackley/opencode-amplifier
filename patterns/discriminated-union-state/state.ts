// Tagged-union state. Self-contained; illustrates making illegal states unrepresentable
// and forcing total handling via a `never` exhaustiveness guard.

// Each variant carries ONLY the data valid in that state.
// You cannot access `data` while loading — it isn't on the type.
type FetchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; data: T }
  | { status: "error"; error: string };

// Compile-time exhaustiveness: if a new variant is added and not handled below,
// `assertNever` gets a value that isn't `never` and the build FAILS.
function assertNever(x: never): never {
  throw new Error(`Unhandled state variant: ${JSON.stringify(x)}`);
}

// Render (or reduce) by exhaustively switching on the discriminant.
function render<T>(state: FetchState<T>, show: (data: T) => string): string {
  switch (state.status) {
    case "idle":
      return "Nothing yet.";
    case "loading":
      return "Loading…";
    case "loaded":
      return show(state.data); // `data` is available ONLY here — narrowed by `status`
    case "error":
      return `Error: ${state.error}`; // `error` exists ONLY here
    default:
      return assertNever(state); // add a variant above without a case -> compile error
  }
}

// --- Worked usage -------------------------------------------------------------------------
const examples: FetchState<{ name: string }>[] = [
  { status: "idle" },
  { status: "loading" },
  { status: "loaded", data: { name: "Ada" } },
  { status: "error", error: "timeout" },
];

export function demo(): string[] {
  return examples.map((s) => render(s, (d) => `Loaded: ${d.name}`));
}
