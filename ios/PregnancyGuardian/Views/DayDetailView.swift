import SwiftUI

struct DayDetailView: View {
    let date: String
    let dayData: DayData
    let onRefresh: () async -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            DietSectionView(date: date, diet: dayData.diet)
            MonitorSectionView(date: date, monitor: dayData.monitor)
            ExerciseSectionView(date: date, exercises: dayData.exercises, onRefresh: onRefresh)
            TodoSectionView(date: date, todos: dayData.todos, onRefresh: onRefresh)
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
                DietSectionView(date: date, diet: dayData.diet)
                MonitorSectionView(date: date, monitor: dayData.monitor)
                ExerciseSectionView(date: date, exercises: dayData.exercises, onRefresh: onRefresh)
                TodoSectionView(date: date, todos: dayData.todos, onRefresh: onRefresh)
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
    private let meals = ["breakfast", "lunch", "dinner"]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Diet", systemImage: "fork.knife")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(Color("Primary"))
            ForEach(meals, id: \.self) { meal in
                VStack(alignment: .leading, spacing: 4) {
                    Text(meal.capitalized)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    TextField("Meal name", text: .constant(diet[meal]?.name ?? ""))
                        .textFieldStyle(.roundedBorder)
                        .font(.subheadline)
                        .onSubmit { saveMeal(meal) }
                    TextField("Instructions / notes", text: .constant(diet[meal]?.instructions ?? ""))
                        .textFieldStyle(.roundedBorder)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .onSubmit { saveMeal(meal) }
                }
            }
        }
    }

    private func saveMeal(_ meal: String) {
        Task {
            try? await APIService.shared.saveDiet(date: date, meal: meal, data: ["name": diet[meal]?.name ?? ""])
        }
    }
}

// MARK: - Monitor Section

struct MonitorSectionView: View {
    let date: String
    let monitor: [String: MonitorItem]
    private let metrics = [("weight", "Weight (kg)"), ("bloodPressure", "Blood Pressure"), ("heartRate", "Heart Rate"), ("bloodSugar", "Blood Sugar"), ("kickCounts", "Kick Counts"), ("mood", "Mood (1-5)")]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Monitor", systemImage: "heart.fill")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(Color("Primary"))
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                ForEach(metrics, id: \.0) { key, label in
                    VStack(alignment: .leading, spacing: 2) {
                        Text(label)
                            .font(.caption)
                            .foregroundColor(.secondary)
                        TextField("—", text: .constant(monitor[key]?.value ?? ""))
                            .textFieldStyle(.roundedBorder)
                            .font(.subheadline)
                    }
                }
            }
        }
    }
}

// MARK: - Exercise Section

struct ExerciseSectionView: View {
    let date: String
    let exercises: [ExerciseItem]
    let onRefresh: () async -> Void
    @State private var activity = ""
    @State private var steps = ""
    @State private var duration = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Exercises", systemImage: "flame.fill")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(Color("Primary"))
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
            HStack(spacing: 4) {
                TextField("Activity", text: $activity).textFieldStyle(.roundedBorder).font(.subheadline)
                TextField("Steps", text: $steps).textFieldStyle(.roundedBorder).font(.subheadline).frame(width: 60)
                TextField("Min", text: $duration).textFieldStyle(.roundedBorder).font(.subheadline).frame(width: 50)
                Button("Add") { addExercise() }
                    .font(.subheadline)
                    .buttonStyle(.borderedProminent)
                    .tint(Color("Primary"))
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

struct TodoSectionView: View {
    let date: String
    let todos: [TodoItem]
    let onRefresh: () async -> Void
    @State private var newText = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("To-Dos", systemImage: "checkmark.circle")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(Color("Primary"))
            ForEach(todos) { todo in
                HStack {
                    Button { toggleTodo(todo) } label: {
                        Image(systemName: todo.done ? "checkmark.circle.fill" : "circle")
                            .foregroundColor(todo.done ? Color("Primary") : .gray)
                    }
                    Text(todo.text)
                        .font(.subheadline)
                        .strikethrough(todo.done)
                        .foregroundColor(todo.done ? .secondary : .primary)
                    Spacer()
                    Button { deleteTodo(todo.id) } label: {
                        Image(systemName: "trash")
                            .font(.subheadline)
                            .foregroundColor(.red.opacity(0.5))
                    }
                }
            }
            HStack {
                TextField("Add a task…", text: $newText)
                    .textFieldStyle(.roundedBorder)
                    .font(.subheadline)
                    .onSubmit { addTodo() }
                Button("Add") { addTodo() }
                    .font(.subheadline)
                    .buttonStyle(.borderedProminent)
                    .tint(Color("Primary"))
            }
        }
    }

    private func addTodo() {
        guard !newText.isEmpty else { return }
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        Task {
            _ = try? await APIService.shared.createTodo(date: date, text: newText)
            newText = ""
            await onRefresh()
        }
    }

    private func toggleTodo(_ todo: TodoItem) {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        Task {
            try? await APIService.shared.updateTodo(id: todo.id, text: todo.text, done: !todo.done)
            await onRefresh()
        }
    }

    private func deleteTodo(_ id: Int) {
        Task {
            try? await APIService.shared.deleteTodo(id: id)
            await onRefresh()
        }
    }
}
