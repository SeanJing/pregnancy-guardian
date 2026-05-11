import SwiftUI

struct WeeklyGuideView: View {
    let week: Int
    @State private var content: String?

    var body: some View {
        if let content, !content.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Text("Week \(week) Guide")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(Color("Primary"))
                Text(content)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(20)
            }
            .padding()
            .background(.white)
            .cornerRadius(12)
            .padding(.horizontal)
        }
    }

    init(week: Int) {
        self.week = week
        if let url = Bundle.main.url(forResource: "weekly-articles", withExtension: "json"),
           let data = try? Data(contentsOf: url),
           let dict = try? JSONSerialization.jsonObject(with: data) as? [String: String] {
            _content = State(initialValue: dict[String(week)])
        } else {
            _content = State(initialValue: nil)
        }
    }
}
