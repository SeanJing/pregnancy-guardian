import SwiftUI

struct HomeView: View {
    @AppStorage("dueDate") private var dueDate: String = ""
    @State private var showResetConfirm = false

    private var currentWeek: Int {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        guard let due = formatter.date(from: dueDate) else { return 0 }
        let conception = Calendar.current.date(byAdding: .day, value: -280, to: due)!
        let days = Calendar.current.dateComponents([.day], from: conception, to: Date()).day ?? 0
        return min(max(days / 7 + 1, 1), 40)
    }

    private var daysLeft: Int {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        guard let due = formatter.date(from: dueDate) else { return 0 }
        return max(Calendar.current.dateComponents([.day], from: Date(), to: due).day ?? 0, 0)
    }

    private var trimester: Int {
        if currentWeek <= 13 { return 1 }
        if currentWeek <= 27 { return 2 }
        return 3
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Week tracker
                    VStack(spacing: 12) {
                        Text("\(currentWeek)")
                            .font(.system(size: 48, weight: .bold))
                            .foregroundColor(Color("Primary"))
                        + Text(" weeks")
                            .font(.title3)
                            .foregroundColor(.secondary)

                        ProgressView(value: Double(currentWeek), total: 40)
                            .tint(trimesterColor)

                        HStack {
                            Text("Week 1")
                            Spacer()
                            Text(trimesterName)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(trimesterColor.opacity(0.2))
                                .cornerRadius(8)
                            Spacer()
                            Text("Week 40")
                        }
                        .font(.caption)
                        .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(.white)
                    .cornerRadius(16)

                    // Countdown
                    HStack(spacing: 32) {
                        VStack {
                            Text("\(daysLeft)")
                                .font(.title)
                                .bold()
                                .foregroundColor(.orange)
                            Text("days to go")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        VStack {
                            Text("\(daysLeft / 7)")
                                .font(.title)
                                .bold()
                            Text("weeks left")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding()
                    .background(.white)
                    .cornerRadius(16)

                    Button("Change due date") {
                        showResetConfirm = true
                    }
                    .font(.caption)
                    .foregroundColor(.secondary)
                }
                .padding()
            }
            .background(Color("Surface"))
            .navigationTitle("Pregnancy Guardian")
            .alert("Change Due Date", isPresented: $showResetConfirm) {
                Button("Change", role: .destructive) { dueDate = "" }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This will reset your due date. You'll need to set a new one.")
            }
        }
    }

    private var trimesterColor: Color {
        switch trimester {
        case 1: return .pink
        case 2: return .orange
        default: return .purple
        }
    }

    private var trimesterName: String {
        switch trimester {
        case 1: return "1st Trimester"
        case 2: return "2nd Trimester"
        default: return "3rd Trimester"
        }
    }
}
