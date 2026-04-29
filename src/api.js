const BASE = '/api'

async function json(url, opts) {
  const res = await fetch(BASE + url, opts)
  return res.json()
}

export const api = {
  // Settings
  getSettings: () => json('/settings'),
  saveSettings: (data) => json('/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),

  // Calendar
  getCalendar: () => json('/calendar'),
  getDay: (date) => json(`/calendar/${date}`),
  saveDay: (date, data) => json(`/calendar/${date}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),

  // Gallery
  getGallery: () => json('/gallery'),
  uploadPhotos: (files) => {
    const fd = new FormData()
    files.forEach(f => fd.append('photos', f))
    return json('/gallery', { method: 'POST', body: fd })
  },
  deletePhoto: (id) => json(`/gallery/${id}`, { method: 'DELETE' }),

  // Documents
  getDocuments: () => json('/documents'),
  uploadDocuments: (files) => {
    const fd = new FormData()
    files.forEach(f => fd.append('files', f))
    return json('/documents', { method: 'POST', body: fd })
  },
  deleteDocument: (id) => json(`/documents/${id}`, { method: 'DELETE' }),

  // Search
  search: (q) => json(`/search?q=${encodeURIComponent(q)}`),
}
