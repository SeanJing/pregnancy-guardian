import SwiftUI

struct DayDetailView: View {
    let date: String
    let dayData: DayData
    let onRefresh: () async -> Void
    let updateDay: ((DayData) -> DayData) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            DietSectionView(date: date, diet: dayData.diet, updateDay: updateDay)
            MonitorSectionView(date: date, monitor: dayData.monitor, updateDay: updateDay)
            ExerciseSectionView(date: date, exercises: dayData.exercises, onRefresh: onRefresh, updateDay: updateDay)
            EventsSectionView(date: date, apiEvents: dayData.events)
        }
        .padding()
        .background(.white)
        .cornerRadius(12)
        .padding(.horizontal)
    }
}

struct DayDetailFullView: View {
    let date: String
    let dayData: DayData
    let onRefresh: () async -> Void
    let updateDay: ((DayData) -> DayData) -> Void

    private var title: String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        guard let d = f.date(from: date) else { return date }
        f.dateFormat = "EEEE, MMM d"
        return f.string(from: d)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                DietSectionView(date: date, diet: dayData.diet, updateDay: updateDay)
                MonitorSectionView(date: date, monitor: dayData.monitor, updateDay: updateDay)
                ExerciseSectionView(date: date, exercises: dayData.exercises, onRefresh: onRefresh, updateDay: updateDay)
                EventsSectionView(date: date, apiEvents: dayData.events)
            }
            .padding()
        }
        .background(Color("Surface"))
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Diet Section

struct DietSectionView: View {
    let date: String
    let diet: [String: DietItem]
    let updateDay: ((DayData) -> DayData) -> Void
    private let meals = ["breakfast", "lunch", "dinner"]
    @State private var editing = false
    @State private var editData: [String: (name: String, instructions: String)] = [:]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Label("Diet", systemImage: "fork.knife")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(Color("Primary"))
                Spacer()
                Button(editing ? "Done" : "Edit") {
                    if editing { saveAll() }
                    editing.toggle()
                }
                .font(.subheadline)
            }

            if editing {
                ForEach(meals, id: \.self) { meal in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(meal.capitalized).font(.caption).foregroundColor(.secondary)
                        TextField("Meal name", text: binding(for: meal, field: \.name))
                            .textFieldStyle(.roundedBorder).font(.subheadline)
                        TextField("Instructions", text: binding(for: meal, field: \.instructions))
                            .textFieldStyle(.roundedBorder).font(.subheadline)
                    }
                }
            } else {
                ForEach(meals, id: \.self) { meal in
                    if let item = diet[meal], !item.name.isEmpty {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(meal.capitalized).font(.caption).foregroundColor(.secondary)
                            Text(item.name).font(.subheadline)
                            if !item.instructions.isEmpty {
                                Text(item.instructions).font(.caption).foregroundColor(.secondary)
                            }
                        }
                    }
                }
                if meals.allSatisfy({ diet[$0]?.name.isEmpty ?? true }) {
                    Text("No meals recorded").font(.subheadline).foregroundColor(.secondary)
                }
            }
        }
        .onAppear { initEditData() }
    }

    private func initEditData() {
        for meal in meals {
            editData[meal] = (diet[meal]?.name ?? "", diet[meal]?.instructions ?? "")
        }
    }

    private func binding(for meal: String, field: WritableKeyPath<(name: String, instructions: String), String>) -> Binding<String> {
        Binding(
            get: { editData[meal]?[keyPath: field] ?? "" },
            set: { editData[meal]?[keyPath: field] = $0 }
        )
    }

    private func saveAll() {
        var updatedDiet = diet
        for meal in meals {
            guard let data = editData[meal], !data.name.isEmpty else { continue }
            updatedDiet[meal] = DietItem(name: data.name, instructions: data.instructions)
            Task {
                try? await APIService.shared.saveDiet(date: date, meal: meal, data: ["name": data.name, "instructions": data.instructions])
            }
        }
        updateDay { d in var d = d; d.diet = updatedDiet; return d }
    }
}

// MARK: - Monitor Section

struct MonitorSectionView: View {
    let date: String
    let monitor: [String: MonitorItem]
    let updateDay: ((DayData) -> DayData) -> Void
    private let metrics = [("weight", "Weight (kg)"), ("bloodPressure", "Blood Pressure"), ("heartRate", "Heart Rate"), ("bloodSugar", "Blood Sugar"), ("kickCounts", "Kick Counts"), ("mood", "Mood (1-5)")]
    @State private var editing = false
    @State private var editValues: [String: String] = [:]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Label("Monitor", systemImage: "heart.fill")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(Color("Primary"))
                Spacer()
                Button(editing ? "Done" : "Edit") {
                    if editing { saveAll() }
                    editing.toggle()
                }
                .font(.subheadline)
            }

            if editing {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                    ForEach(metrics, id: \.0) { key, label in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(label).font(.caption).foregroundColor(.secondary)
                            TextField("—", text: Binding(
                                get: { editValues[key] ?? "" },
                                set: { editValues[key] = $0 }
                            ))
                            .textFieldStyle(.roundedBorder).font(.subheadline)
                        }
                    }
                }
            } else {
                let recorded = metrics.filter { monitor[$0.0]?.value.isEmpty == false }
                if recorded.isEmpty {
                    Text("No metrics recorded").font(.subheadline).foregroundColor(.secondary)
                } else {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                        ForEach(recorded, id: \.0) { key, label in
                            VStack(alignment: .leading, spacing: 2) {
                                Text(label).font(.caption).foregroundColor(.secondary)
                                Text(monitor[key]?.value ?? "").font(.subheadline)
                            }
                        }
                    }
                }
            }
        }
        .onAppear { initEditValues() }
    }

    private func initEditValues() {
        for (key, _) in metrics {
            editValues[key] = monitor[key]?.value ?? ""
        }
    }

    private func saveAll() {
        var updatedMonitor = monitor
        for (key, _) in metrics {
            guard let value = editValues[key], !value.isEmpty else { continue }
            updatedMonitor[key] = MonitorItem(value: value)
            Task { try? await APIService.shared.saveMonitor(date: date, metric: key, value: value) }
        }
        updateDay { d in var d = d; d.monitor = updatedMonitor; return d }
    }
}

// MARK: - Exercise Section

struct ExerciseSectionView: View {
    let date: String
    let exercises: [ExerciseItem]
    let onRefresh: () async -> Void
    let updateDay: ((DayData) -> DayData) -> Void
    @State private var showAdd = false
    @State private var activity = ""
    @State private var steps = ""
    @State private var duration = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Label("Exercises", systemImage: "flame.fill")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(Color("Primary"))
                Spacer()
                Button("Add") { showAdd.toggle() }
                    .font(.subheadline)
            }

            ForEach(exercises) { ex in
                HStack {
                    Text("\(ex.activity) · \(ex.steps) steps · \(ex.duration) min")
                        .font(.subheadline)
                    Spacer()
                    Button { deleteExercise(ex.id) } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.red.opacity(0.5))
                    }
                }
            }

            if exercises.isEmpty && !showAdd {
                Text("No exercises recorded").font(.subheadline).foregroundColor(.secondary)
            }

            if showAdd {
                HStack(spacing: 4) {
                    TextField("Activity", text: $activity).textFieldStyle(.roundedBorder).font(.subheadline)
                    TextField("Steps", text: $steps).textFieldStyle(.roundedBorder).font(.subheadline).frame(width: 60)
                    TextField("Min", text: $duration).textFieldStyle(.roundedBorder).font(.subheadline).frame(width: 50)
                    Button("Save") { addExercise() }
                        .font(.subheadline)
                        .buttonStyle(.borderedProminent)
                        .tint(Color("Primary"))
                }
            }
        }
    }

    private func addExercise() {
        Task {
            _ = try? await APIService.shared.createExercise(date: date, activity: activity, steps: Int(steps) ?? 0, duration: Int(duration) ?? 0)
            activity = ""; steps = ""; duration = ""
            await onRefresh()
        }
    }

    private func deleteExercise(_ id: Int) {
        Task {
            try? await APIService.shared.deleteExercise(id: id)
            await onRefresh()
        }
    }
}

// MARK: - Todo Section

