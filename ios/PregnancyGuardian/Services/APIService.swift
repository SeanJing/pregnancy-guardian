import Foundation

class APIService {
    static let shared = APIService()
    static let host = "https://pregnancy-guardian-api.hfjingxiao13.workers.dev"
    private let baseURL = "\(APIService.host)/api"

    private init() {}

    // MARK: - Calendar

    func getCalendar(from: String, to: String) async throws -> [String: DayData] {
        let data = try await get("/calendar?from=\(from)&to=\(to)")
        return try JSONDecoder().decode([String: DayData].self, from: data)
    }

    func getDay(_ date: String) async throws -> DayData {
        let data = try await get("/calendar/\(date)")
        return try JSONDecoder().decode(DayData.self, from: data)
    }

    // MARK: - Events

    func createEvent(date: String, text: String, time: String = "") async throws -> EventItem {
        let body = ["date": date, "text": text, "time": time]
        let data = try await post("/events", body: body)
        return try JSONDecoder().decode(EventItem.self, from: data)
    }

    func updateEvent(id: Int, text: String, done: Bool) async throws {
        let body: [String: Any] = ["text": text, "done": done]
        _ = try await put("/events/\(id)", jsonBody: body)
    }

    func deleteEvent(id: Int) async throws {
        _ = try await delete("/events/\(id)")
    }

    // MARK: - Diet

    func saveDiet(date: String, meal: String, data: [String: String]) async throws {
        _ = try await put("/diet/\(date)/\(meal)", jsonBody: data)
    }

    // MARK: - Monitor

    func saveMonitor(date: String, metric: String, value: String) async throws {
        _ = try await put("/monitor/\(date)/\(metric)", jsonBody: ["value": value])
    }

    // MARK: - Exercises

    func createExercise(date: String, activity: String, steps: Int, duration: Int) async throws -> ExerciseItem {
        let body: [String: Any] = ["date": date, "activity": activity, "steps": steps, "duration": duration]
        let data = try await post("/exercises", jsonBody: body)
        return try JSONDecoder().decode(ExerciseItem.self, from: data)
    }

    func deleteExercise(id: Int) async throws {
        _ = try await delete("/exercises/\(id)")
    }

    // MARK: - Gallery

    func getGallery() async throws -> [PhotoItem] {
        let data = try await get("/gallery")
        return try JSONDecoder().decode([PhotoItem].self, from: data)
    }

    func uploadPhoto(imageData: Data, filename: String) async throws -> [PhotoItem] {
        let boundary = UUID().uuidString
        var request = URLRequest(url: URL(string: "\(baseURL)/gallery")!)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"photos\"; filename=\"\(filename)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = body

        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode([PhotoItem].self, from: data)
    }

    func deletePhoto(id: Int) async throws {
        _ = try await delete("/gallery/\(id)")
    }

    // MARK: - Documents

    func getDocuments() async throws -> [DocumentItem] {
        let data = try await get("/documents")
        return try JSONDecoder().decode([DocumentItem].self, from: data)
    }

    func deleteDocument(id: Int) async throws {
        _ = try await delete("/documents/\(id)")
    }

    // MARK: - Settings

    func getSettings() async throws -> [String: String] {
        let data = try await get("/settings")
        return try JSONDecoder().decode([String: String].self, from: data)
    }

    func saveSettings(_ settings: [String: String]) async throws {
        _ = try await put("/settings", jsonBody: settings)
    }

    // MARK: - Trends

    func getTrends(metric: String) async throws -> [TrendPoint] {
        let data = try await get("/trends/\(metric)?from=2000-01-01&to=2099-12-31")
        return try JSONDecoder().decode([TrendPoint].self, from: data)
    }

    // MARK: - Assistant

    func ask(question: String) -> URLRequest {
        var request = URLRequest(url: URL(string: "\(baseURL)/ask")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: ["question": question])
        return request
    }

    // MARK: - Private helpers

    private func get(_ path: String) async throws -> Data {
        let (data, _) = try await URLSession.shared.data(from: URL(string: "\(baseURL)\(path)")!)
        return data
    }

    private func post(_ path: String, body: [String: String]) async throws -> Data {
        var request = URLRequest(url: URL(string: "\(baseURL)\(path)")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, _) = try await URLSession.shared.data(for: request)
        return data
    }

    private func post(_ path: String, jsonBody: [String: Any]) async throws -> Data {
        var request = URLRequest(url: URL(string: "\(baseURL)\(path)")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: jsonBody)
        let (data, _) = try await URLSession.shared.data(for: request)
        return data
    }

    private func put(_ path: String, jsonBody: Any) async throws -> Data {
        var request = URLRequest(url: URL(string: "\(baseURL)\(path)")!)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: jsonBody)
        let (data, _) = try await URLSession.shared.data(for: request)
        return data
    }

    private func delete(_ path: String) async throws -> Data {
        var request = URLRequest(url: URL(string: "\(baseURL)\(path)")!)
        request.httpMethod = "DELETE"
        let (data, _) = try await URLSession.shared.data(for: request)
        return data
    }
}
