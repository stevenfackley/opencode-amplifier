// Accessible SwiftUI techniques for Section 508 / WCAG 2.1 AA.
// Every control has a name, role (trait), and value; decoration is hidden; text scales; targets
// are >= 44pt; meaning never relies on color alone.

import SwiftUI

// State badge: color is reinforced by an icon AND an accessible value (WCAG 1.4.1, never color-only).
struct StatusBadge: View {
    let label: String
    let isActive: Bool
    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: isActive ? "checkmark.circle.fill" : "xmark.circle")
                .accessibilityHidden(true)                 // decorative: the value carries the state
            Text(label)
        }
        .accessibilityElement(children: .combine)          // read as ONE element
        .accessibilityValue(isActive ? "active" : "inactive")
    }
}

// Composed, tappable row: combined into one element with an explicit name, hint, role, and a real
// touch target.
struct AccessibleRow: View {
    let title: String
    let subtitle: String
    let onTap: () -> Void
    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.headline)                // semantic font -> Dynamic Type
                Text(subtitle).font(.subheadline).foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .buttonStyle(.plain)
        .frame(minHeight: 44)                              // WCAG 2.5.5 touch target
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title), \(subtitle)")      // explicit name
        .accessibilityHint("Opens details")               // result of activating
        .accessibilityAddTraits(.isButton)
    }
}

// Section header marked as a heading so screen-reader users can navigate by heading.
struct SectionHeader: View {
    let text: String
    var body: some View {
        Text(text).font(.title2)
            .accessibilityAddTraits(.isHeader)
    }
}

// Allow text to scale all the way up to accessibility sizes — don't hard-cap.
struct ScalingBody: View {
    var body: some View {
        Text("Respects the user's text size.")
            .font(.body)
            .dynamicTypeSize(...DynamicTypeSize.accessibility5)
    }
}

// Announce async state changes so SR users aren't left guessing.
func announce(_ message: String) {
    #if canImport(UIKit)
    AccessibilityNotification.Announcement(message).post()
    #endif
}
