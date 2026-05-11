import SwiftUI

struct DocumentsView: View {
    @State private var documents: [DocumentItem] = []
    @State private var loading = true
    @State private var search = ""

    private let baseURL = "https://pregnancy-guardian-api.hfjingxiao13.workers.dev"

    private var filtered: [DocumentItem] {
        search.isEmpty ? documents : documents.filter { $0.name.localizedCaseInsensitiveContains(search) }
    }

    var body: some View {
        NavigationStack {
            List {
                if loading {
                    ProgressView()
                } else if filtered.isEmpty {
                    Text(search.isEmpty ? "No documents yet" : "No results for \"\(search)\"")
                        .foregroundColor(.secondary)
                } else {
                    ForEach(filtered) { doc in
                        Link(destination: URL(string: "\(baseURL)\(doc.url)")!) {
                            HStack {
                                Image(systemName: doc.name.hasSuffix(".pdf") ? "doc.richtext" : "doc")
                                    .foregroundColor(doc.name.hasSuffix(".pdf") ? .red : .secondary)
                                VStack(alignment: .leading) {
                                    Text(doc.name)
                                        .font(.subheadline)
                                        .lineLimit(1)
                                    Text("\(formatSize(doc.size)) · \(doc.date?.prefix(10) ?? "")")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                    }
                    .onDelete(perform: deleteDocuments)
                }
            }
            .searchable(text: $search, prompt: "Search documents")
            .navigationTitle("Documents")
            .task { await load() }
        }
    }

    private func load() async {
        do { documents = try await APIService.shared.getDocuments() } catch {}
        loading = false
    }

    private func deleteDocuments(at offsets: IndexSet) {
        for i in offsets {
            let doc = filtered[i]
            Task { try? await APIService.shared.deleteDocument(id: doc.id) }
            documents.removeAll { $0.id == doc.id }
        }
    }

    private func formatSize(_ bytes: Int) -> String {
        if bytes < 1024 { return "\(bytes) B" }
        if bytes < 1048576 { return "\(bytes / 1024) KB" }
        return "\(bytes / 1048576) MB"
    }
}
