import SwiftUI

struct HomeView: View {
    @AppStorage("dueDate") private var dueDate: String = ""
    @AppStorage("nextCheckup") private var nextCheckup: String = ""
    @State private var showResetConfirm = false
    @State private var checkupDate = Date()

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

    private var progress: Double {
        Double(currentWeek) / 40.0
    }

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        if hour < 12 { return "Good morning" }
        if hour < 18 { return "Good afternoon" }
        return "Good evening"
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 28) {
                    // Greeting
                    VStack(spacing: 4) {
                        Text("\(greeting), mama 💕")
                            .font(.title2)
                            .fontWeight(.semibold)
                        Text("Week \(currentWeek) of your beautiful journey")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding(.top, 8)

                    // Illustration + Progress Ring
                    ZStack {
                        // Progress ring
                        Circle()
                            .stroke(Color("Primary").opacity(0.15), lineWidth: 12)
                            .frame(width: 200, height: 200)
                        Circle()
                            .trim(from: 0, to: progress)
                            .stroke(trimesterColor, style: StrokeStyle(lineWidth: 12, lineCap: .round))
                            .frame(width: 200, height: 200)
                            .rotationEffect(.degrees(-90))
                            .animation(.easeInOut(duration: 1), value: progress)

                        // Center illustration
                        VStack(spacing: 4) {
                            Image(systemName: "stroller.fill")
                                .font(.system(size: 44))
                                .foregroundColor(Color("Primary"))
                            Text("\(currentWeek)")
                                .font(.system(size: 36, weight: .bold))
                                .foregroundColor(Color("Primary"))
                            Text("weeks")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }

                    // Trimester badge
                    Text(trimesterName)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 6)
                        .background(trimesterColor.opacity(0.15))
                        .foregroundColor(trimesterColor)
                        .cornerRadius(20)

                    // Countdown cards
                    HStack(spacing: 16) {
                        CountdownCard(value: "\(daysLeft)", label: "days to go", color: .orange)
                        CountdownCard(value: "\(daysLeft / 7)", label: "weeks left", color: Color("Primary"))
                    }
                    .padding(.horizontal)

                    // Next checkup
                    VStack(spacing: 8) {
                        Text("Next Checkup")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(Color("Primary"))
                            .textCase(.uppercase)
                        if !nextCheckup.isEmpty, let days = checkupDaysAway, days > 0 {
                            Text("\(days) days away")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(.orange)
                        }
                        DatePicker("", selection: $checkupDate, displayedComponents: .date)
                            .datePickerStyle(.compact)
                            .labelsHidden()
                            .onChange(of: checkupDate) { _, newDate in
                                let f = DateFormatter()
                                f.dateFormat = "yyyy-MM-dd"
                                nextCheckup = f.string(from: newDate)
                                Task { try? await APIService.shared.saveSettings(["nextCheckup": nextCheckup]) }
                            }
                    }
                    .padding()
                    .background(.white)
                    .cornerRadius(16)

                    // Change due date
                    Button("Change due date") {
                        showResetConfirm = true
                    }
                    .font(.caption)
                    .foregroundColor(.secondary)
                }
                .padding(.vertical)
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

    private var checkupDaysAway: Int? {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        guard let date = f.date(from: nextCheckup) else { return nil }
        return Calendar.current.dateComponents([.day], from: Date(), to: date).day
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

struct CountdownCard: View {
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title)
                .fontWeight(.bold)
                .foregroundColor(color)
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(.white)
        .cornerRadius(16)
    }
}
