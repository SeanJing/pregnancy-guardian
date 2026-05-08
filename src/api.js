const BASE = import.meta.env.VITE_API_URL || '/api'
export const UPLOADS_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : ''

// Simple in-memory cache
const cache = {}

async function json(url, opts) {
  const res = await fetch(BASE + url, opts)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

async function cachedGet(url) {
  if (cache[url]) return cache[url]
  const data = await json(url)
  cache[url] = data
  return data
}

function invalidateCalendar() { Object.keys(cache).filter(k => k.startsWith('/calendar')).forEach(k => delete cache[k]) }
function invalidate(url) { delete cache[url] }

function jsonBody(data) {
  return { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
}

export const api = {
  // Settings
  getSettings: () => cachedGet('/settings'),
  saveSettings: (data) => { invalidate('/settings'); return json('/settings', jsonBody(data)) },

  // Calendar
  getCalendar: (from, to) => cachedGet(`/calendar?from=${from}&to=${to}`),
  invalidateCalendar,
  getDay: (date) => json(`/calendar/${date}`),

  // Todos
  createTodo: (date, text) => { invalidateCalendar(); return json('/todos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, text, done: false }) }) },
  updateTodo: (id, data) => { invalidateCalendar(); return json(`/todos/${id}`, jsonBody(data)) },
  deleteTodo: (id) => { invalidateCalendar(); return json(`/todos/${id}`, { method: 'DELETE' }) },

  // Diet
  saveDiet: (date, meal, data) => { invalidateCalendar(); return json(`/diet/${date}/${meal}`, jsonBody(data)) },

  // Monitor
  saveMonitor: (date, metric, value) => { invalidateCalendar(); return json(`/monitor/${date}/${metric}`, jsonBody({ value })) },

  // Exercises
  createExercise: (data) => { invalidateCalendar(); return json('/exercises', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }) },
  updateExercise: (id, data) => { invalidateCalendar(); return json(`/exercises/${id}`, jsonBody(data)) },
  deleteExercise: (id) => { invalidateCalendar(); return json(`/exercises/${id}`, { method: 'DELETE' }) },

  // Gallery
  getGallery: () => cachedGet('/gallery'),
  uploadPhotos: (files) => { invalidate('/gallery'); const fd = new FormData(); files.forEach(f => fd.append('photos', f)); return json('/gallery', { method: 'POST', body: fd }) },
  deletePhoto: (id) => { invalidate('/gallery'); return json(`/gallery/${id}`, { method: 'DELETE' }) },

  // Documents
  getDocuments: () => cachedGet('/documents'),
  uploadDocuments: (files) => { invalidate('/documents'); const fd = new FormData(); files.forEach(f => fd.append('files', f)); return json('/documents', { method: 'POST', body: fd }) },
  deleteDocument: (id) => { invalidate('/documents'); return json(`/documents/${id}`, { method: 'DELETE' }) },

  // Trends
  getTrends: (metric, from, to) => json(`/trends/${metric}?from=${from}&to=${to}`),

  // Search
  search: (q) => json(`/search?q=${encodeURIComponent(q)}`),

  // AI Assistant (streaming)
  ask: async (question, onChunk) => {
    const res = await fetch(BASE + '/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let full = ''
    let sources = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const json = JSON.parse(line.slice(6))
            if (json.sources) { sources = json.sources; continue }
            const token = json.response || json.choices?.[0]?.delta?.content || ''
            if (token) { full += token; onChunk(full) }
          } catch {}
        }
      }
    }
    return { answer: full, sources }
  },
}
