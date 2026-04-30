const BASE = import.meta.env.VITE_API_URL || '/api'
export const UPLOADS_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : ''

async function json(url, opts) {
  const res = await fetch(BASE + url, opts)
  return res.json()
}

function jsonBody(data) {
  return { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
}

export const api = {
  // Settings
  getSettings: () => json('/settings'),
  saveSettings: (data) => json('/settings', jsonBody(data)),

  // Calendar
  getCalendar: () => json('/calendar'),
  getDay: (date) => json(`/calendar/${date}`),

  // Todos
  createTodo: (date, text) => json('/todos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, text, done: false }) }),
  updateTodo: (id, data) => json(`/todos/${id}`, jsonBody(data)),
  deleteTodo: (id) => json(`/todos/${id}`, { method: 'DELETE' }),

  // Diet
  saveDiet: (date, meal, data) => json(`/diet/${date}/${meal}`, jsonBody(data)),

  // Monitor
  saveMonitor: (date, metric, value) => json(`/monitor/${date}/${metric}`, jsonBody({ value })),

  // Exercises
  createExercise: (data) => json('/exercises', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateExercise: (id, data) => json(`/exercises/${id}`, jsonBody(data)),
  deleteExercise: (id) => json(`/exercises/${id}`, { method: 'DELETE' }),

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
