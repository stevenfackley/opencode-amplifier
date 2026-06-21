// A worked SwiftUI screen built to the distinctive-ui-design standard.
// Committed direction: WARM EDITORIAL (Fraunces serif + grotesque body, ink/paper/ember).
// Swap the Theme for your own bold direction — don't ship this aesthetic everywhere.

import SwiftUI

// MARK: - Theme tokens (mirror of the design-tokens pattern; one place to retheme)
enum Theme {
    static let paper = Color(red: 0.98, green: 0.965, blue: 0.94)
    static let paperDim = Color(red: 0.95, green: 0.92, blue: 0.86)
    static let ink = Color(red: 0.10, green: 0.09, blue: 0.08)
    static let inkSoft = Color(red: 0.42, green: 0.38, blue: 0.33)
    static let ember = Color(red: 0.85, green: 0.34, blue: 0.23)
    static let sage = Color(red: 0.36, green: 0.48, blue: 0.42)

    // Distinctive type as identity. Needs the fonts bundled (Info.plist UIAppFonts) or it falls
    // back to system. NEVER let the system font be the personality.
    static func display(_ s: CGFloat) -> Font { .custom("Fraunces", size: s).weight(.semibold) }
    static func body(_ s: CGFloat) -> Font { .custom("SchibstedGrotesk-Regular", size: s) }

    static let xs: CGFloat = 6, sm: CGFloat = 12, md: CGFloat = 20, lg: CGFloat = 32
}

// MARK: - State (swift-observable-viewmodel pattern)
struct Entry: Identifiable, Sendable {
    let id = UUID(); let index: Int; let tag: String; let title: String; let summary: String
}

@Observable @MainActor
final class EntriesModel {
    enum Phase: Equatable { case loading, loaded, empty, failed(String) }
    private(set) var phase: Phase = .loading
    private(set) var entries: [Entry] = []

    func load() async {
        phase = .loading
        try? await Task.sleep(for: .milliseconds(450)) // simulate I/O
        entries = [
            .init(index: 1, tag: "survey", title: "Tidewater Margins", summary: "Salt line creeping north of the old weir; gulls relocating inland."),
            .init(index: 2, tag: "fauna", title: "The Vanishing Hare", summary: "Tracks thin out past the ridge — third season of decline."),
            .init(index: 3, tag: "weather", title: "Dry Lightning", summary: "Heat storms with no rain; tinder risk climbing through the week."),
        ]
        phase = entries.isEmpty ? .empty : .loaded
    }
}

// MARK: - Screen
struct EntriesView: View {
    @State private var model = EntriesModel()
    @State private var appeared = false

    var body: some View {
        ZStack {
            background
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.lg) {
                    header
                    contentForPhase
                }
                .padding(Theme.md)
            }
        }
        .task {
            await model.load()
            appeared = true // triggers the staggered entrance
        }
    }

    // Atmosphere: warm vertical gradient + a soft ember glow — not a flat fill.
    private var background: some View {
        ZStack {
            LinearGradient(colors: [Theme.paper, Theme.paperDim], startPoint: .top, endPoint: .bottom)
            RadialGradient(colors: [Theme.ember.opacity(0.14), .clear],
                           center: .topTrailing, startRadius: 8, endRadius: 340)
        }
        .ignoresSafeArea()
    }

    // Editorial header: small kicker + oversized serif title, left-aligned (asymmetric).
    private var header: some View {
        VStack(alignment: .leading, spacing: Theme.xs) {
            Text("ALMANAC · 2026")
                .font(Theme.body(13)).tracking(2).foregroundStyle(Theme.ember)
            Text("Field\nNotes")
                .font(Theme.display(56)).foregroundStyle(Theme.ink)
        }
        .opacity(appeared ? 1 : 0)
        .offset(y: appeared ? 0 : 12)
        .animation(.easeOut(duration: 0.5), value: appeared)
    }

    @ViewBuilder private var contentForPhase: some View {
        switch model.phase {
        case .loading: loadingView
        case .failed(let msg): errorView(msg)
        case .empty: emptyView
        case .loaded: entryList
        }
    }

    private var entryList: some View {
        VStack(spacing: 0) {
            ForEach(Array(model.entries.enumerated()), id: \.element.id) { i, entry in
                EntryRow(entry: entry)
                    .opacity(appeared ? 1 : 0)
                    .offset(y: appeared ? 0 : 16)
                    .animation(.easeOut(duration: 0.5).delay(Double(i) * 0.06), value: appeared) // stagger
                if entry.id != model.entries.last?.id {
                    Rectangle().fill(Theme.ink.opacity(0.08)).frame(height: 1) // hairline, not cards
                }
            }
        }
    }

    private var loadingView: some View {
        HStack(spacing: Theme.sm) {
            ProgressView().tint(Theme.ember)
            Text("Gathering notes…").font(Theme.body(15)).foregroundStyle(Theme.inkSoft)
        }
        .padding(.vertical, Theme.lg)
    }

    private var emptyView: some View {
        VStack(spacing: Theme.sm) {
            Text("—").font(Theme.display(40)).foregroundStyle(Theme.inkSoft)
            Text("No entries yet").font(Theme.body(16)).foregroundStyle(Theme.inkSoft)
        }
        .frame(maxWidth: .infinity).padding(.vertical, Theme.lg)
    }

    private func errorView(_ msg: String) -> some View {
        VStack(alignment: .leading, spacing: Theme.sm) {
            Text(msg).font(Theme.body(15)).foregroundStyle(Theme.ink)
            Button {
                Task { await model.load(); appeared = true }
            } label: {
                Text("Try again")
                    .font(Theme.body(15)).foregroundStyle(Theme.paper)
                    .padding(.horizontal, Theme.md).padding(.vertical, Theme.sm)
                    .background(Theme.ember, in: Capsule())
            }
        }
        .padding(.vertical, Theme.lg)
    }
}

// Asymmetric editorial row: oversized ember index + stacked content. Not an equal rounded card.
private struct EntryRow: View {
    let entry: Entry
    var body: some View {
        HStack(alignment: .top, spacing: Theme.md) {
            Text(String(format: "%02d", entry.index))
                .font(Theme.display(22)).foregroundStyle(Theme.ember)
                .frame(width: 40, alignment: .leading)
            VStack(alignment: .leading, spacing: 4) {
                Text(entry.tag.uppercased())
                    .font(Theme.body(11)).tracking(1.5).foregroundStyle(Theme.sage)
                Text(entry.title).font(Theme.display(20)).foregroundStyle(Theme.ink)
                Text(entry.summary).font(Theme.body(15)).foregroundStyle(Theme.inkSoft).lineLimit(2)
            }
            Spacer(minLength: 0)
        }
        .padding(.vertical, Theme.md)
        .contentShape(Rectangle())
    }
}

#Preview { EntriesView() }
