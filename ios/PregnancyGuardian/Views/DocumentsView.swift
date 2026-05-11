import SwiftUI
import UniformTypeIdentifiers

struct DocumentsView: View {
    @State private var documents: [DocumentItem] = []
    @State private var loading = true
    @State private var search = ""
    @State private var showFilePicker = false

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
                                        .font(.subheadline)
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
            .toolbar {
                Button { showFilePicker = true } label: {
                    Image(systemName: "plus")
                }
            }
            .fileImporter(isPresented: $showFilePicker, allowedContentTypes: [.pdf, .image, .plainText, .data], allowsMultipleSelection: true) { result in
                Task { await uploadFiles(result) }
            }
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

    private func uploadFiles(_ result: Result<[URL], Error>) async {
        guard let urls = try? result.get() else { return }
        for url in urls {
            guard url.startAccessingSecurityScopedResource() else { continue }
            defer { url.stopAccessingSecurityScopedResource() }
            guard let data = try? Data(contentsOf: url) else { continue }
            let filename = url.lastPathComponent
            let boundary = UUID().uuidString
            var request = URLRequest(url: URL(string: "\(baseURL)/api/documents")!)
            request.httpMethod = "POST"
            request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
            var body = Data()
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"files\"; filename=\"\(filename)\"\r\n".data(using: .utf8)!)
            body.append("Content-Type: application/octet-stream\r\n\r\n".data(using: .utf8)!)
            body.append(data)
            body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
            request.httpBody = body
            if let (responseData, _) = try? await URLSession.shared.data(for: request),
               let items = try? JSONDecoder().decode([DocumentItem].self, from: responseData) {
                documents.insert(contentsOf: items, at: 0)
            }
        }
    }
}
