import SwiftUI
import HealthKit

class HealthKitManager {
    static let shared = HealthKitManager()
    let store = HKHealthStore()

    private let readTypes: Set<HKSampleType> = [
        HKQuantityType(.bodyMass),
        HKQuantityType(.heartRate),
        HKQuantityType(.bloodGlucose),
        HKQuantityType(.stepCount),
    ]

    private let writeTypes: Set<HKSampleType> = [
        HKQuantityType(.bodyMass),
        HKQuantityType(.heartRate),
        HKQuantityType(.bloodGlucose),
    ]

    var isAvailable: Bool { HKHealthStore.isHealthDataAvailable() }

    func requestAccess() async -> Bool {
        guard isAvailable else { return false }
        do {
            try await store.requestAuthorization(toShare: writeTypes, read: readTypes)
            return true
        } catch { return false }
    }

    func readLatest(type: HKQuantityTypeIdentifier, unit: HKUnit, for date: Date) async -> Double? {
        let start = Calendar.current.startOfDay(for: date)
        let end = Calendar.current.date(byAdding: .day, value: 1, to: start)!
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end)
        let descriptor = HKSampleQueryDescriptor(
            predicates: [.quantitySample(type: HKQuantityType(type), predicate: predicate)],
            sortDescriptors: [SortDescriptor(\.startDate, order: .reverse)],
            limit: 1
        )
        let results = try? await descriptor.result(for: store)
        return results?.first?.quantity.doubleValue(for: unit)
    }

    func readSteps(for date: Date) async -> Int? {
        let start = Calendar.current.startOfDay(for: date)
        let end = Calendar.current.date(byAdding: .day, value: 1, to: start)!
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end)
        let type = HKQuantityType(.stepCount)

        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, _ in
                let steps = result?.sumQuantity()?.doubleValue(for: .count())
                continuation.resume(returning: steps.map { Int($0) })
            }
            store.execute(query)
        }
    }

    func write(type: HKQuantityTypeIdentifier, value: Double, unit: HKUnit, date: Date) async {
        let quantity = HKQuantity(unit: unit, doubleValue: value)
        let sample = HKQuantitySample(type: HKQuantityType(type), quantity: quantity, start: date, end: date)
        try? await store.save(sample)
    }
}

struct HealthMonitorEditView: View {
    let date: String
    let monitor: [String: MonitorItem]
    let updateDay: ((DayData) -> DayData) -> Void
    @State private var values: [String: String] = [:]
    @State private var healthGranted = false
    @State private var loadedFromHealth = false
    @Environment(\.dismiss) private var dismiss

    private let metrics = [
        ("weight", "Weight (kg)", "scalemass"),
        ("heartRate", "Heart Rate (bpm)", "heart.fill"),
        ("bloodSugar", "Blood Sugar (mmol/L)", "drop.fill"),
        ("kickCounts", "Kick Counts", "figure.walk"),
        ("mood", "Mood (1-5)", "face.smiling"),
    ]

    private var dateObj: Date {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.date(from: date) ?? Date()
    }

    var body: some View {
        Form {
            if healthGranted && loadedFromHealth {
                Section(header: Text("Auto-filled from Health")) {
                    Text("Values from Apple Health are pre-filled below")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Section("Metrics") {
                ForEach(metrics, id: \.0) { key, label, icon in
                    HStack {
                        Image(systemName: icon)
                            .foregroundColor(Color("Primary"))
                            .frame(width: 20)
                        Text(label)
                        Spacer()
                        TextField("—", text: Binding(
                            get: { values[key] ?? "" },
                            set: { values[key] = $0 }
                        ))
                        .multilineTextAlignment(.trailing)
                        .keyboardType(.decimalPad)
                        .frame(width: 80)
                    }
                }
            }

            if !healthGranted {
                Section {
                    Button("Connect Apple Health") {
                        Task {
                            healthGranted = await HealthKitManager.shared.requestAccess()
                            if healthGranted { await loadFromHealth() }
                        }
                    }
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
        .task {
            // Init from API data
            for (key, _,  _) in metrics {
                values[key] = monitor[key]?.value ?? ""
            }
            // Try HealthKit
            healthGranted = await HealthKitManager.shared.requestAccess()
            if healthGranted { await loadFromHealth() }
        }
    }

    private func loadFromHealth() async {
        let hk = HealthKitManager.shared
        let d = dateObj

        if let weight = await hk.readLatest(type: .bodyMass, unit: .gramUnit(with: .kilo), for: d), values["weight"]?.isEmpty ?? true {
            values["weight"] = String(format: "%.1f", weight)
        }
        if let hr = await hk.readLatest(type: .heartRate, unit: .count().unitDivided(by: .minute()), for: d), values["heartRate"]?.isEmpty ?? true {
            values["heartRate"] = String(Int(hr))
        }
        if let bg = await hk.readLatest(type: .bloodGlucose, unit: HKUnit.moleUnit(with: .milli, molarMass: HKUnitMolarMassBloodGlucose).unitDivided(by: .liter()), for: d), values["bloodSugar"]?.isEmpty ?? true {
            values["bloodSugar"] = String(format: "%.1f", bg)
        }
        loadedFromHealth = true
    }

    private func save() {
        var updatedMonitor = monitor
        let hk = HealthKitManager.shared
        let d = dateObj

        for (key, _, _) in metrics {
            guard let value = values[key], !value.isEmpty else { continue }
            updatedMonitor[key] = MonitorItem(value: value)
            // Save to API
            Task { try? await APIService.shared.saveMonitor(date: date, metric: key, value: value) }
            // Save to HealthKit
            if healthGranted, let doubleVal = Double(value) {
                Task {
                    switch key {
                    case "weight": await hk.write(type: .bodyMass, value: doubleVal, unit: .gramUnit(with: .kilo), date: d)
                    case "heartRate": await hk.write(type: .heartRate, value: doubleVal, unit: .count().unitDivided(by: .minute()), date: d)
                    case "bloodSugar": await hk.write(type: .bloodGlucose, value: doubleVal, unit: HKUnit.moleUnit(with: .milli, molarMass: HKUnitMolarMassBloodGlucose).unitDivided(by: .liter()), date: d)
                    default: break
                    }
                }
            }
        }
        updateDay { d in var d = d; d.monitor = updatedMonitor; return d }
        dismiss()
    }
}
