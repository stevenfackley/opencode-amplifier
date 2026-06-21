// Modern SwiftUI model with the Observation framework (iOS 17+/macOS 14+).
// Contrast with the weak-model default: `class: ObservableObject` with `@Published` on every field.

import Observation

// @Observable: no protocol conformance, no per-property @Published. SwiftUI tracks only the
// fields a view actually reads, so unrelated mutations don't trigger redundant re-renders.
@Observable
@MainActor
final class WidgetsModel {
    private(set) var widgets: [String] = []
    private(set) var isLoading = false
    private(set) var error: String?

    private let service: WidgetService

    init(service: WidgetService) {
        self.service = service
    }

    func load() async {
        guard !isLoading else { return }
        isLoading = true
        error = nil
        defer { isLoading = false }
        do {
            widgets = try await service.fetchWidgets()
        } catch {
            // `error` here is the catch binding; assign to the property explicitly.
            self.error = error.localizedDescription
        }
    }
}

protocol WidgetService: Sendable {
    func fetchWidgets() async throws -> [String]
}

// SwiftUI usage:
//   struct WidgetsView: View {
//       @State private var model: WidgetsModel
//       var body: some View {
//           List(model.widgets, id: \.self) { Text($0) }
//               .overlay { if model.isLoading { ProgressView() } }
//               .task { await model.load() }   // runs on appear, cancels on disappear
//       }
//   }
