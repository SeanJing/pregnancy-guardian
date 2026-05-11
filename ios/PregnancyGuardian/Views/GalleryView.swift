import SwiftUI
import PhotosUI

struct GalleryView: View {
    @State private var photos: [PhotoItem] = []
    @State private var loading = true
    @State private var selectedPhoto: PhotoItem?
    @State private var photoPickerItem: PhotosPickerItem?

    private let baseURL = "https://pregnancy-guardian-api.hfjingxiao13.workers.dev"

    private var grouped: [(String, [PhotoItem])] {
        let dict = Dictionary(grouping: photos) { $0.date?.prefix(10).description ?? "Unknown" }
        return dict.sorted { $0.key > $1.key }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                if loading {
                    ProgressView().padding(.top, 100)
                } else if photos.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "photo.on.rectangle")
                            .font(.system(size: 48))
                            .foregroundColor(.secondary.opacity(0.5))
                        Text("No photos yet")
                            .foregroundColor(.secondary)
                    }
                    .padding(.top, 100)
                } else {
                    LazyVStack(alignment: .leading, spacing: 16) {
                        ForEach(grouped, id: \.0) { date, items in
                            Section {
                                LazyVGrid(columns: [GridItem(.adaptive(minimum: 80))], spacing: 4) {
                                    ForEach(items) { photo in
                                        AsyncImage(url: URL(string: "\(baseURL)\(photo.url)")) { image in
                                            image.resizable().scaledToFill()
                                        } placeholder: {
                                            Color.gray.opacity(0.2)
                                        }
                                        .frame(width: 80, height: 80)
                                        .clipped()
                                        .cornerRadius(6)
                                        .onTapGesture { selectedPhoto = photo }
                                    }
                                }
                            } header: {
                                Text(date)
                                    .font(.subheadline)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.secondary)
                                    .padding(.horizontal)
                            }
                        }
                    }
                    .padding()
                }
            }
            .background(Color("Surface"))
            .navigationTitle("Gallery")
            .toolbar {
                PhotosPicker(selection: $photoPickerItem, matching: .images) {
                    Image(systemName: "plus")
                }
            }
            .onChange(of: photoPickerItem) { _, item in
                Task { await uploadPhoto(item) }
            }
            .sheet(item: $selectedPhoto) { photo in
                PhotoDetailView(photo: photo, baseURL: baseURL) {
                    Task {
                        try? await APIService.shared.deletePhoto(id: photo.id)
                        photos.removeAll { $0.id == photo.id }
                        selectedPhoto = nil
                    }
                }
            }
            .task { await load() }
        }
    }

    private func load() async {
        do { photos = try await APIService.shared.getGallery() } catch {}
        loading = false
    }

    private func uploadPhoto(_ item: PhotosPickerItem?) async {
        guard let item, let data = try? await item.loadTransferable(type: Data.self) else { return }
        do {
            let items = try await APIService.shared.uploadPhoto(imageData: data, filename: "photo_\(Date().timeIntervalSince1970).jpg")
            photos.insert(contentsOf: items, at: 0)
        } catch {}
    }
}

struct PhotoDetailView: View {
    let photo: PhotoItem
    let baseURL: String
    let onDelete: () -> Void

    var body: some View {
        NavigationStack {
            AsyncImage(url: URL(string: "\(baseURL)\(photo.url)")) { image in
                image.resizable().scaledToFit()
            } placeholder: {
                ProgressView()
            }
            .navigationTitle(photo.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                Button("Delete", role: .destructive, action: onDelete)
            }
        }
    }
}
