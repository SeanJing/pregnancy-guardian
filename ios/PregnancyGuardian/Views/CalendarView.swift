import SwiftUI

struct CalendarView: View {
    @State private var weekStart = Calendar.current.date(from: Calendar.current.dateComponents([.yearForWeekOfYear, .weekOfYear], from: Date()))!
    @State private var data: [String: DayData] = [:]
    @State private var selectedDate: String?
    @State private var loading = true
    @AppStorage("dueDate") private var dueDate: String = ""

    private var currentPregnancyWeek: Int? {
        guard !dueDate.isEmpty else { return nil }
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        guard let due = f.date(from: dueDate) else { return nil }
        let conception = Calendar.current.date(byAdding: .day, value: -280, to: due)!
        let mid = Calendar.current.date(byAdding: .day, value: 3, to: weekStart)!
        let days = Calendar.current.dateComponents([.day], from: conception, to: mid).day ?? 0
        let week = days / 7 + 1
        return (1...40).contains(week) ? week : nil
    }

    private var weekDates: [Date] {
        (0..<7).map { Calendar.current.date(byAdding: .day, value: $0, to: weekStart)! }
    }

    private var weekLabel: String {
        let end = Calendar.current.date(byAdding: .day, value: 6, to: weekStart)!
        let f = DateFormatter()
        f.dateFormat = "MMM d"
        let f2 = DateFormatter()
        f2.dateFormat = "MMM d, yyyy"
        return "\(f.string(from: weekStart)) – \(f2.string(from: end))"
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Week navigation
                    HStack {
                        Button { changeWeek(-1) } label: {
                            Image(systemName: "chevron.left")
                        }
                        Spacer()
                        Button(weekLabel) { goToday() }
                            .font(.headline)
                        Spacer()
                        Button { changeWeek(1) } label: {
                            Image(systemName: "chevron.right")
                        }
                    }
                    .padding(.horizontal)

                    // Day cells
                    HStack(spacing: 4) {
                        ForEach(weekDates, id: \.self) { date in
                            let key = dateKey(date)
                            let isToday = Calendar.current.isDateInToday(date)
                            let isSelected = key == selectedDate
                            let hasData = data[key] != nil

                            Button {
                                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                selectedDate = key
                            } label: {
                                VStack(spacing: 4) {
                                    Text(dayName(date))
                                        .font(.caption2)
                                        .foregroundColor(.secondary)
                                    Text("\(Calendar.current.component(.day, from: date))")
                                        .font(.body)
                                        .fontWeight(isToday ? .bold : .regular)
                                        .foregroundColor(isToday ? Color("Primary") : .primary)
                                    if hasData {
                                        Circle()
                                            .fill(Color("Primary"))
                                            .frame(width: 5, height: 5)
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 8)
                                .background(isSelected ? Color("Primary").opacity(0.1) : isToday ? Color("Primary").opacity(0.05) : .clear)
                                .cornerRadius(8)
                                .overlay(isSelected ? RoundedRectangle(cornerRadius: 8).stroke(Color("Primary"), lineWidth: 2) : nil)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal)

                    // Weekly guide (shown when no day selected)
                    if selectedDate == nil, let week = currentPregnancyWeek {
                        WeeklyGuideView(week: week)
                    }
                }
                .padding(.vertical)
            }
            .background(Color("Surface"))
            .navigationTitle("Calendar")
            .navigationDestination(item: $selectedDate) { key in
                let dayData = data[key] ?? DayData(events: [], diet: [:], monitor: [:], exercises: [])
                DayDetailFullView(date: key, dayData: dayData, onRefresh: { await loadWeek() })
            }
            .task { await loadWeek() }
            .refreshable { await loadWeek() }
        }
    }

    private func loadWeek() async {
        let from = dateKey(weekStart)
        let to = dateKey(Calendar.current.date(byAdding: .day, value: 6, to: weekStart)!)
        // Show cached data immediately if available
        if let cached = try? await APIService.shared.getCalendarCached(from: from, to: to) {
            data = cached
            loading = false
        }
        // Fetch fresh data (updates silently, no flicker)
        if let fresh = try? await APIService.shared.getCalendarFresh(from: from, to: to) {
            data = fresh
        }
        loading = false
    }

    private func changeWeek(_ dir: Int) {
        selectedDate = nil
        weekStart = Calendar.current.date(byAdding: .day, value: dir * 7, to: weekStart)!
        // Show cached data for new week immediately (or empty if first visit)
        let from = dateKey(weekStart)
        let to = dateKey(Calendar.current.date(byAdding: .day, value: 6, to: weekStart)!)
        let key = "\(from)_\(to)"
        data = APIService.shared.calendarCacheSync(key: key) ?? [:]
        Task { await loadWeek() }
    }

    private func goToday() {
        weekStart = Calendar.current.date(from: Calendar.current.dateComponents([.yearForWeekOfYear, .weekOfYear], from: Date()))!
        Task { await loadWeek() }
    }

    private func dateKey(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: date)
    }

    private func dayName(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "EEE"
        return f.string(from: date)
    }
}
