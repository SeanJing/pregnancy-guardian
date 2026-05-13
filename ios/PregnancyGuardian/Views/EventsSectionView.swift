import SwiftUI
import EventKit

struct EventsSectionView: View {
    let date: String
    @State private var events: [EKEvent] = []
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
            } else {
                // Existing events
                ForEach(events, id: \.eventIdentifier) { event in
                    HStack {
                        Circle()
                            .fill(Color(cgColor: event.calendar.cgColor))
                            .frame(width: 8, height: 8)
                        VStack(alignment: .leading) {
                            Text(event.title)
                                .font(.subheadline)
                            if let start = event.startDate {
                                Text(start, style: .time)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }

                if events.isEmpty {
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
        }
        .onAppear { requestAccess() }
    }

    private func requestAccess() {
        if #available(iOS 17.0, *) {
            store.requestFullAccessToEvents { granted, _ in
                DispatchQueue.main.async {
                    accessGranted = granted
                    if granted { loadEvents() }
                }
            }
        } else {
            store.requestAccess(to: .event) { granted, _ in
                DispatchQueue.main.async {
                    accessGranted = granted
                    if granted { loadEvents() }
                }
            }
        }
    }

    private func loadEvents() {
        let start = Calendar.current.startOfDay(for: dateObj)
        let end = Calendar.current.date(byAdding: .day, value: 1, to: start)!
        let predicate = store.predicateForEvents(withStart: start, end: end, calendars: nil)
        events = store.events(matching: predicate)
    }

    private func addEvent() {
        guard !newTitle.isEmpty else { return }
        UIImpactFeedbackGenerator(style: .light).impactOccurred()

        // Combine date + selected time
        let cal = Calendar.current
        let timeComponents = cal.dateComponents([.hour, .minute], from: eventTime)
        var startDate = dateObj
        startDate = cal.date(bySettingHour: timeComponents.hour ?? 0, minute: timeComponents.minute ?? 0, second: 0, of: startDate)!

        // Save to native calendar
        let event = EKEvent(eventStore: store)
        event.title = newTitle
        event.startDate = startDate
        event.endDate = cal.date(byAdding: .hour, value: 1, to: startDate)!
        event.calendar = store.defaultCalendarForNewEvents
        event.addAlarm(EKAlarm(relativeOffset: -3600))
        try? store.save(event, span: .thisEvent)

        // Save to API
        let title = newTitle
        let timeStr = String(format: "%02d:%02d", timeComponents.hour ?? 0, timeComponents.minute ?? 0)
        Task {
            _ = try? await APIService.shared.createEvent(date: date, text: title, time: timeStr)
        }

        newTitle = ""
        loadEvents()
    }
}
