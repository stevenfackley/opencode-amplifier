// An `actor` serializes access to mutable state so concurrent tasks can't race — enforced by the
// compiler. Reach for this instead of NSLock or a serial DispatchQueue.

import Foundation

actor RequestCache {
    private var store: [String: Data] = [:]
    private var inFlight: [String: Task<Data, Error>] = [:]

    // nonisolated `let` config can be read without awaiting; the loader is @Sendable so it can
    // safely cross the actor boundary.
    private let loader: @Sendable (String) async throws -> Data

    init(loader: @escaping @Sendable (String) async throws -> Data) {
        self.loader = loader
    }

    func value(for key: String) async throws -> Data {
        // Already cached.
        if let cached = store[key] { return cached }
        // A load for this key is already running — join it instead of starting a second
        // (request coalescing: no duplicate work, no thundering herd).
        if let existing = inFlight[key] { return try await existing.value }

        let task = Task { try await loader(key) }
        inFlight[key] = task
        defer { inFlight[key] = nil } // clear the slot whether it succeeds or throws

        let data = try await task.value
        store[key] = data
        return data
    }
}

// Usage (note every call is `await` from outside the actor):
//   let cache = RequestCache { key in try await URLSession.shared.data(from: URL(string: key)!).0 }
//   let bytes = try await cache.value(for: "https://example.com/widget/1")
