import Foundation

struct DayData: Codable {
    var events: [EventItem]
    var diet: [String: DietItem]
    var monitor: [String: MonitorItem]
    var exercises: [ExerciseItem]
}

struct EventItem: Codable, Identifiable {
    let id: Int
    var text: String
    var time: String?
}

struct DietItem: Codable {
    var id: Int?
    var name: String
    var instructions: String
}

struct MonitorItem: Codable {
    var id: Int?
    var value: String
}

struct ExerciseItem: Codable, Identifiable {
    let id: Int
    var activity: String
    var steps: Int
    var duration: Int
}

struct PhotoItem: Codable, Identifiable {
    let id: Int
    let url: String
    let name: String
    var caption: String?
    var date: String?
}

struct DocumentItem: Codable, Identifiable {
    let id: Int
    let url: String
    let name: String
    let size: Int
    var date: String?
}

struct TrendPoint: Codable {
    let date: String
    let value: String
}
