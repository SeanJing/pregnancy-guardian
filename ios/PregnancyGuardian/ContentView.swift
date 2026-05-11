import SwiftUI

struct ContentView: View {
    @AppStorage("dueDate") private var dueDate: String = ""
    @State private var selectedTab = 0

    var body: some View {
        if dueDate.isEmpty {
            OnboardingView(dueDate: $dueDate)
        } else {
            TabView(selection: $selectedTab) {
                HomeView(dueDate: dueDate)
                    .tabItem { Label("Home", systemImage: "heart.fill") }
                    .tag(0)

                CalendarView()
                    .tabItem { Label("Calendar", systemImage: "calendar") }
                    .tag(1)

                GalleryView()
                    .tabItem { Label("Gallery", systemImage: "photo.on.rectangle") }
                    .tag(2)

                DocumentsView()
                    .tabItem { Label("Documents", systemImage: "doc.fill") }
                    .tag(3)

                AssistantView()
                    .tabItem { Label("Assistant", systemImage: "bubble.left.fill") }
                    .tag(4)
            }
            .tint(Color("Primary"))
        }
    }
}

struct OnboardingView: View {
    @Binding var dueDate: String
    @State private var selectedDate = Date()

    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            Image(systemName: "heart.fill")
                .font(.system(size: 48))
                .foregroundColor(Color("Primary"))
            Text("Pregnancy Guardian")
                .font(.custom("Varela Round", size: 28))
                .bold()
            Text("When is your baby due?")
                .foregroundColor(.secondary)
            DatePicker("Due Date", selection: $selectedDate, displayedComponents: .date)
                .datePickerStyle(.graphical)
                .padding()
            Button("Get Started") {
                let formatter = DateFormatter()
                formatter.dateFormat = "yyyy-MM-dd"
                dueDate = formatter.string(from: selectedDate)
            }
            .buttonStyle(.borderedProminent)
            .tint(Color("Primary"))
            Spacer()
        }
        .padding()
    }
}
