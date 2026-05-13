import SwiftUI
import EventKit

struct DisplayEvent: Identifiable {
    let id: String
    let title: String
    let time: String
    let source: String // "calendar" or "api"
    let color: Color
}

struct EventsSectionView: View {
    let date: String
    @State private var displayEvents: [DisplayEvent] = []
    @State private var newTitle = ""
    @State private var eventTime = Date()
    @State private var accessGranted = false

    private let store = EKEventStore()

    private var dateObj: Date {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.date(from: date) ?? Date()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Events", systemImage: "calendar.badge.plus")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(Color("Primary"))

            if !accessGranted {
                Button("Grant Calendar Access") { requestAccess() }
                    .font(.subheadline)
                    .foregroundColor(Color("Primary"))
            }

            // Merged events list
            ForEach(displayEvents) { event in
                HStack(spacing: 8) {
                    Circle()
                        .fill(event.color)
                        .frame(width: 8, height: 8)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(event.title)
                            .font(.subheadline)
                        if !event.time.isEmpty {
                            Text(event.time)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    Spacer()
                    Text(event.source == "calendar" ? "📅" : "☁️")
                        .font(.caption2)
                }
            }

            if displayEvents.isEmpty {
                Text("No events this day")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            // Add new event
            HStack {
                TextField("New event…", text: $newTitle)
                    .textFieldStyle(.roundedBorder)
                    .font(.subheadline)
                    .onSubmit { addEvent() }
                DatePicker("", selection: $eventTime, displayedComponents: .hourAndMinute)
                    .labelsHidden()
                    .frame(width: 80)
                Button("Add") { addEvent() }
                    .font(.subheadline)
                    .buttonStyle(.borderedProminent)
                    .tint(Color("Primary"))
            }
        }
        .onAppear {
            requestAccess()
            Task { await loadAll() }
        }
    }

    private func requestAccess() {
        if #available(iOS 17.0, *) {
            store.requestFullAccessToEvents { granted, _ in
                DispatchQueue.main.async {
                    accessGranted = granted
                    Task { await loadAll() }
                }
            }
        } else {
            store.requestAccess(to: .event) { granted, _ in
                DispatchQueue.main.async {
                    accessGranted = granted
                    Task { await loadAll() }
                }
            }
        }
    }

    private func loadAll() async {
        var merged: [DisplayEvent] = []

        // Native calendar events
        if accessGranted {
            let start = Calendar.current.startOfDay(for: dateObj)
            let end = Calendar.current.date(byAdding: .day, value: 1, to: start)!
            let predicate = store.predicateForEvents(withStart: start, end: end, calendars: nil)
            let calEvents = store.events(matching: predicate)
            let tf = DateFormatter()
            tf.dateFormat = "HH:mm"
            for e in calEvents {
                merged.append(DisplayEvent(
                    id: "cal_\(e.eventIdentifier ?? UUID().uuidString)",
                    title: e.title,
                    time: tf.string(from: e.startDate),
                    source: "calendar",
                    color: Color(cgColor: e.calendar.cgColor)
                ))
            }
        }

        // API events
        if let dayData = try? await APIService.shared.getDay(date) {
            for event in dayData.events {
                // Deduplicate: skip if same title already from calendar
                if !merged.contains(where: { $0.title == event.text && $0.source == "calendar" }) {
                    merged.append(DisplayEvent(
                        id: "api_\(event.id)",
                        title: event.text,
                        time: "", // API events don't have time yet in TodoItem model
                        source: "api",
                        color: Color("Primary")
                    ))
                }
            }
        }

        // Sort by time
        merged.sort { $0.time < $1.time }
        displayEvents = merged
    }

    private func addEvent() {
        guard !newTitle.isEmpty else { return }
        UIImpactFeedbackGenerator(style: .light).impactOccurred()

        let cal = Calendar.current
        let timeComponents = cal.dateComponents([.hour, .minute], from: eventTime)
        var startDate = dateObj
        startDate = cal.date(bySettingHour: timeComponents.hour ?? 0, minute: timeComponents.minute ?? 0, second: 0, of: startDate)!

        // Save to native calendar
        if accessGranted {
            let event = EKEvent(eventStore: store)
            event.title = newTitle
            event.startDate = startDate
            event.endDate = cal.date(byAdding: .hour, value: 1, to: startDate)!
            event.calendar = store.defaultCalendarForNewEvents
            event.addAlarm(EKAlarm(relativeOffset: -3600))
            try? store.save(event, span: .thisEvent)
        }

        // Save to API
        let title = newTitle
        let timeStr = String(format: "%02d:%02d", timeComponents.hour ?? 0, timeComponents.minute ?? 0)
        Task {
            _ = try? await APIService.shared.createEvent(date: date, text: title, time: timeStr)
            await loadAll()
        }

        newTitle = ""
    }
}
