import SwiftUI

// MARK: - Diet Edit

struct DietEditView: View {
    let date: String
    let meal: String
    let existing: DietItem?
    let updateDay: ((DayData) -> DayData) -> Void
    @State private var name: String = ""
    @State private var instructions: String = ""
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        Form {
            Section(meal.capitalized) {
                TextField("Meal name", text: $name)
                TextField("Instructions / notes", text: $instructions)
            }
        }
        .navigationTitle("Edit \(meal.capitalized)")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") { save() }
                    .disabled(name.isEmpty)
            }
        }
        .onAppear {
            name = existing?.name ?? ""
            instructions = existing?.instructions ?? ""
        }
    }

    private func save() {
        updateDay { d in
            var d = d
            d.diet[meal] = DietItem(name: name, instructions: instructions)
            return d
        }
        Task {
            try? await APIService.shared.saveDiet(date: date, meal: meal, data: ["name": name, "instructions": instructions])
        }
        dismiss()
    }
}

// MARK: - Monitor Edit

struct MonitorEditView: View {
    let date: String
    let monitor: [String: MonitorItem]
    let updateDay: ((DayData) -> DayData) -> Void
    private let metrics = [("weight", "Weight (kg)"), ("bloodPressure", "Blood Pressure"), ("heartRate", "Heart Rate"), ("bloodSugar", "Blood Sugar"), ("kickCounts", "Kick Counts"), ("mood", "Mood (1-5)")]
    @State private var values: [String: String] = [:]
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        Form {
            ForEach(metrics, id: \.0) { key, label in
                HStack {
                    Text(label)
                    Spacer()
                    TextField("—", text: Binding(
                        get: { values[key] ?? "" },
                        set: { values[key] = $0 }
                    ))
                    .multilineTextAlignment(.trailing)
                    .frame(width: 100)
                }
            }
        }
        .navigationTitle("Edit Metrics")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") { save() }
            }
        }
        .onAppear {
            for (key, _) in metrics {
                values[key] = monitor[key]?.value ?? ""
            }
        }
    }

    private func save() {
        var updatedMonitor = monitor
        for (key, _) in metrics {
            guard let value = values[key], !value.isEmpty else { continue }
            updatedMonitor[key] = MonitorItem(value: value)
            Task { try? await APIService.shared.saveMonitor(date: date, metric: key, value: value) }
        }
        updateDay { d in var d = d; d.monitor = updatedMonitor; return d }
        dismiss()
    }
}

// MARK: - Exercise Add

struct ExerciseAddView: View {
    let date: String
    let onRefresh: () async -> Void
    @State private var activity = ""
    @State private var steps = ""
    @State private var duration = ""
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        Form {
            TextField("Activity", text: $activity)
            TextField("Steps", text: $steps)
                .keyboardType(.numberPad)
            TextField("Duration (min)", text: $duration)
                .keyboardType(.numberPad)
        }
        .navigationTitle("Add Exercise")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") { save() }
                    .disabled(activity.isEmpty)
            }
        }
    }

    private func save() {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        Task {
            _ = try? await APIService.shared.createExercise(date: date, activity: activity, steps: Int(steps) ?? 0, duration: Int(duration) ?? 0)
            await onRefresh()
        }
        dismiss()
    }
}
