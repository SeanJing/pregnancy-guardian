const BASE = import.meta.env.VITE_API_URL || '/api'
export const UPLOADS_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : ''

// Simple in-memory cache
const cache = {}

async function json(url, opts) {
  const res = await fetch(BASE + url, opts)
  return res.json()
}

async function cachedGet(url) {
  if (cache[url]) return cache[url]
  const data = await json(url)
  cache[url] = data
  return data
}

function invalidate(url) { delete cache[url] }

function jsonBody(data) {
  return { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
}

export const api = {
  // Settings
  getSettings: () => cachedGet('/settings'),
  saveSettings: (data) => { invalidate('/settings'); return json('/settings', jsonBody(data)) },

  // Calendar
  getCalendar: () => cachedGet('/calendar'),
  invalidateCalendar: () => invalidate('/calendar'),
  getDay: (date) => json(`/calendar/${date}`),

  // Todos
  createTodo: (date, text) => { invalidate('/calendar'); return json('/todos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, text, done: false }) }) },
  updateTodo: (id, data) => { invalidate('/calendar'); return json(`/todos/${id}`, jsonBody(data)) },
  deleteTodo: (id) => { invalidate('/calendar'); return json(`/todos/${id}`, { method: 'DELETE' }) },

  // Diet
  saveDiet: (date, meal, data) => json(`/diet/${date}/${meal}`, jsonBody(data)),

  // Monitor
  saveMonitor: (date, metric, value) => json(`/monitor/${date}/${metric}`, jsonBody({ value })),

  // Exercises
  createExercise: (data) => { invalidate('/calendar'); return json('/exercises', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }) },
  updateExercise: (id, data) => { invalidate('/calendar'); return json(`/exercises/${id}`, jsonBody(data)) },
  deleteExercise: (id) => { invalidate('/calendar'); return json(`/exercises/${id}`, { method: 'DELETE' }) },

  // Gallery
  getGallery: () => cachedGet('/gallery'),
  uploadPhotos: (files) => { invalidate('/gallery'); const fd = new FormData(); files.forEach(f => fd.append('photos', f)); return json('/gallery', { method: 'POST', body: fd }) },
  deletePhoto: (id) => { invalidate('/gallery'); return json(`/gallery/${id}`, { method: 'DELETE' }) },

  // Documents
  getDocuments: () => cachedGet('/documents'),
  uploadDocuments: (files) => { invalidate('/documents'); const fd = new FormData(); files.forEach(f => fd.append('files', f)); return json('/documents', { method: 'POST', body: fd }) },
  deleteDocument: (id) => { invalidate('/documents'); return json(`/documents/${id}`, { method: 'DELETE' }) },

  // Search
  search: (q) => json(`/search?q=${encodeURIComponent(q)}`),
}
