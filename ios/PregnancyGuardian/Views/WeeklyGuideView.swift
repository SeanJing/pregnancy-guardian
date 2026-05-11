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
            }
            .padding()
            .background(.white)
            .cornerRadius(12)
            .padding(.horizontal)
        }
    }
}
