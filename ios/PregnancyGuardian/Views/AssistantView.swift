import SwiftUI

struct ChatMessage: Identifiable {
    let id = UUID()
    let role: String
    var text: String
}

struct AssistantView: View {
    @State private var messages: [ChatMessage] = []
    @State private var input = ""
    @State private var loading = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 12) {
                            if messages.isEmpty {
                                VStack(spacing: 8) {
                                    Image(systemName: "bubble.left")
                                        .font(.system(size: 36))
                                        .foregroundColor(.secondary.opacity(0.4))
                                    Text("Ask anything about pregnancy")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.top, 80)
                            }
                            ForEach(messages) { msg in
                                HStack {
                                    if msg.role == "user" { Spacer() }
                                    Text(msg.text)
                                        .font(.subheadline)
                                        .padding(10)
                                        .background(msg.role == "user" ? Color("Primary") : Color(.systemGray6))
                                        .foregroundColor(msg.role == "user" ? .white : .primary)
                                        .cornerRadius(12)
                                    if msg.role == "assistant" { Spacer() }
                                }
                                .id(msg.id)
                            }
                            if loading {
                                HStack {
                                    ProgressView()
                                        .padding(10)
                                    Spacer()
                                }
                            }
                        }
                        .padding()
                    }
                    .onChange(of: messages.count) { _, _ in
                        if let last = messages.last {
                            proxy.scrollTo(last.id, anchor: .bottom)
                        }
                    }
                }

                // Input bar
                HStack(spacing: 8) {
                    TextField("Ask a question…", text: $input)
                        .textFieldStyle(.roundedBorder)
                        .onSubmit { ask() }
                    Button { ask() } label: {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.title2)
                            .foregroundColor(Color("Primary"))
                    }
                    .disabled(input.isEmpty || loading)
                }
                .padding()
                .background(.bar)
            }
            .navigationTitle("Assistant")
        }
    }

    private func ask() {
        let question = input.trimmingCharacters(in: .whitespaces)
        guard !question.isEmpty else { return }
        messages.append(ChatMessage(role: "user", text: question))
        input = ""
        loading = true

        Task {
            let request = APIService.shared.ask(question: question)
            do {
                let (bytes, _) = try await URLSession.shared.bytes(for: request)
                var answer = ""
                messages.append(ChatMessage(role: "assistant", text: ""))

                for try await line in bytes.lines {
                    guard line.hasPrefix("data: "), line != "data: [DONE]" else { continue }
                    let json = line.dropFirst(6)
                    if let data = json.data(using: .utf8),
                       let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                        if let choices = obj["choices"] as? [[String: Any]],
                           let delta = choices.first?["delta"] as? [String: Any],
                           let content = delta["content"] as? String {
                            answer += content
                            let visible = answer.contains("</think>") ? String(answer.split(separator: "</think>").last ?? "") : (answer.contains("<think>") ? "" : answer)
                            messages[messages.count - 1].text = visible.trimmingCharacters(in: .whitespacesAndNewlines)
                        } else if let response = obj["response"] as? String {
                            answer += response
                            messages[messages.count - 1].text = answer
                        }
                    }
                }
            } catch {
                messages.append(ChatMessage(role: "assistant", text: "Something went wrong. Please try again."))
            }
            loading = false
        }
    }
}
