import SwiftUI

struct WeeklyGuideView: View {
    let week: Int
    
    private var content: String? {
        guard let url = Bundle.main.url(forResource: "weekly-articles", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let dict = try? JSONSerialization.jsonObject(with: data) as? [String: String] else {
            return nil
        }
        return dict[String(week)]
    }

    private var attributedContent: AttributedString? {
        guard let content else { return nil }
        return try? AttributedString(markdown: content, options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace))
    }

    var body: some View {
        if let attributedContent {
            VStack(alignment: .leading, spacing: 8) {
                Text("Week \(week) Guide")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(Color("Primary"))
                Text(attributedContent)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding()
            .background(.white)
            .cornerRadius(12)
            .padding(.horizontal)
        }
    }
}
