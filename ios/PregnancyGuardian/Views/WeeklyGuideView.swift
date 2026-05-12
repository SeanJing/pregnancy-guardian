import SwiftUI

struct WeeklyGuideView: View {
    let week: Int

    private var sections: [(title: String, content: String)] {
        guard let url = Bundle.main.url(forResource: "weekly-articles", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let dict = try? JSONSerialization.jsonObject(with: data) as? [String: String],
              let text = dict[String(week)] else { return [] }

        var result: [(String, String)] = []
        var currentTitle = "Overview"
        var currentContent = ""

        for line in text.components(separatedBy: "\n") {
            if line.hasPrefix("##") {
                if !currentContent.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    result.append((currentTitle, currentContent.trimmingCharacters(in: .whitespacesAndNewlines)))
                }
                currentTitle = line.replacingOccurrences(of: "#", with: "").trimmingCharacters(in: .whitespaces)
                currentContent = ""
            } else {
                currentContent += line + "\n"
            }
        }
        if !currentContent.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            result.append((currentTitle, currentContent.trimmingCharacters(in: .whitespacesAndNewlines)))
        }
        return result
    }

    var body: some View {
        if !sections.isEmpty {
            VStack(spacing: 12) {
                Text("Week \(week) Guide")
                    .font(.headline)
                    .foregroundColor(Color("Primary"))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal)

                ForEach(sections.indices, id: \.self) { i in
                    GuideSectionCard(title: sections[i].title, content: sections[i].content, icon: iconFor(sections[i].title))
                }
            }
            .padding(.vertical, 8)
        }
    }

    private func iconFor(_ title: String) -> String {
        let t = title.lowercased()
        if t.contains("baby") { return "heart.fill" }
        if t.contains("body") { return "figure.stand" }
        if t.contains("partner") { return "person.2.fill" }
        if t.contains("tip") { return "lightbulb.fill" }
        if t.contains("plan") { return "checklist" }
        if t.contains("big") { return "ruler" }
        return "info.circle.fill"
    }
}

struct GuideSectionCard: View {
    let title: String
    let content: String
    let icon: String
    @State private var expanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                withAnimation(.easeInOut(duration: 0.3)) { expanded.toggle() }
            } label: {
                HStack {
                    Image(systemName: icon)
                        .foregroundColor(Color("Primary"))
                        .frame(width: 24)
                    Text(title)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                    Spacer()
                    Image(systemName: expanded ? "chevron.up" : "chevron.down")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
            }
            .buttonStyle(.plain)

            if expanded {
                Text(content)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 16)
                    .padding(.bottom, 12)
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .background(.white)
        .cornerRadius(12)
        .padding(.horizontal)
    }
}
