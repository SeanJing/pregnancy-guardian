import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()
app.use('*', cors())

// --- Init DB schema on every request ---
let dbInitialized = false
async function initDB(db) {
  if (dbInitialized) return
  await db.exec("CREATE TABLE IF NOT EXISTS calendar_data (date TEXT PRIMARY KEY, todos TEXT DEFAULT '[]', note TEXT DEFAULT '', diet TEXT DEFAULT '{}', monitor TEXT DEFAULT '{}', exercises TEXT DEFAULT '{}');")
  await db.exec("CREATE TABLE IF NOT EXISTS gallery (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT NOT NULL, original_name TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')));")
  await db.exec("CREATE TABLE IF NOT EXISTS documents (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT NOT NULL, original_name TEXT NOT NULL, size INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));")
  await db.exec("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);")
  dbInitialized = true
}

app.use('/api/*', async (c, next) => {
  await initDB(c.env.DB)
  await next()
})

// --- Calendar ---
app.get('/api/calendar', async (c) => {
  const db = c.env.DB
  const data = {}
  const rows = await db.prepare('SELECT date, todos, note, diet, monitor, exercises FROM calendar_data').all()
  for (const r of rows.results) {
    data[r.date] = { todos: JSON.parse(r.todos), pics: [], note: r.note, diet: JSON.parse(r.diet || '{}'), monitor: JSON.parse(r.monitor || '{}'), exercises: JSON.parse(r.exercises || '{}') }
  }
  const pics = await db.prepare("SELECT id, filename, original_name, strftime('%Y-%m-%d', created_at) as d FROM gallery").all()
  for (const r of pics.results) {
    if (!data[r.d]) data[r.d] = { todos: [], pics: [], note: '', diet: {}, monitor: {}, exercises: {} }
    data[r.d].pics.push({ id: r.id, url: `/uploads/${r.filename}`, name: r.original_name })
  }
  return c.json(data)
})

app.get('/api/calendar/:date', async (c) => {
  const db = c.env.DB
  const date = c.req.param('date')
  const row = await db.prepare('SELECT todos, note, diet, monitor, exercises FROM calendar_data WHERE date = ?').bind(date).first()
  const data = { todos: [], pics: [], note: '', diet: {}, monitor: {}, exercises: {} }
  if (row) {
    data.todos = JSON.parse(row.todos)
    data.note = row.note
    data.diet = JSON.parse(row.diet || '{}')
    data.monitor = JSON.parse(row.monitor || '{}')
    data.exercises = JSON.parse(row.exercises || '{}')
  }
  const pics = await db.prepare("SELECT id, filename, original_name FROM gallery WHERE strftime('%Y-%m-%d', created_at) = ?").bind(date).all()
  for (const r of pics.results) {
    data.pics.push({ id: r.id, url: `/uploads/${r.filename}`, name: r.original_name })
  }
  return c.json(data)
})

app.put('/api/calendar/:date', async (c) => {
  const db = c.env.DB
  const date = c.req.param('date')
  const body = await c.req.json()
  await db.prepare(
    `INSERT INTO calendar_data (date, todos, note, diet, monitor, exercises) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET todos=excluded.todos, note=excluded.note, diet=excluded.diet, monitor=excluded.monitor, exercises=excluded.exercises`
  ).bind(date, JSON.stringify(body.todos || []), body.note || '', JSON.stringify(body.diet || {}), JSON.stringify(body.monitor || {}), JSON.stringify(body.exercises || {})).run()
  return c.json({ ok: true })
})

// --- Gallery ---
app.get('/api/gallery', async (c) => {
  const db = c.env.DB
  const rows = await db.prepare('SELECT id, filename, original_name, created_at FROM gallery ORDER BY created_at DESC').all()
  return c.json(rows.results.map(r => ({ id: r.id, url: `/uploads/${r.filename}`, name: r.original_name, date: r.created_at })))
})

app.post('/api/gallery', async (c) => {
  const db = c.env.DB
  const bucket = c.env.BUCKET
  const formData = await c.req.formData()
  const files = formData.getAll('photos')
  const items = []
  for (const file of files) {
    const filename = `${Date.now()}-${file.name}`
    await bucket.put(filename, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } })
    const res = await db.prepare('INSERT INTO gallery (filename, original_name) VALUES (?, ?) RETURNING id').bind(filename, file.name).first()
    items.push({ id: res.id, url: `/uploads/${filename}`, name: file.name })
  }
  return c.json(items)
})

app.delete('/api/gallery/:id', async (c) => {
  const db = c.env.DB
  const bucket = c.env.BUCKET
  const id = Number(c.req.param('id'))
  const row = await db.prepare('SELECT filename FROM gallery WHERE id = ?').bind(id).first()
  if (row) {
    await bucket.delete(row.filename)
    await db.prepare('DELETE FROM gallery WHERE id = ?').bind(id).run()
  }
  return c.json({ ok: true })
})

// --- Documents ---
app.get('/api/documents', async (c) => {
  const db = c.env.DB
  const rows = await db.prepare('SELECT id, filename, original_name, size, created_at FROM documents ORDER BY created_at DESC').all()
  return c.json(rows.results.map(r => ({ id: r.id, url: `/uploads/${r.filename}`, name: r.original_name, size: r.size, date: r.created_at })))
})

app.post('/api/documents', async (c) => {
  const db = c.env.DB
  const bucket = c.env.BUCKET
  const formData = await c.req.formData()
  const files = formData.getAll('files')
  const items = []
  for (const file of files) {
    const buf = await file.arrayBuffer()
    const filename = `${Date.now()}-${file.name}`
    await bucket.put(filename, buf, { httpMetadata: { contentType: file.type } })
    const res = await db.prepare('INSERT INTO documents (filename, original_name, size) VALUES (?, ?, ?) RETURNING id').bind(filename, file.name, buf.byteLength).first()
    items.push({ id: res.id, url: `/uploads/${filename}`, name: file.name, size: buf.byteLength })
  }
  return c.json(items)
})

app.delete('/api/documents/:id', async (c) => {
  const db = c.env.DB
  const bucket = c.env.BUCKET
  const id = Number(c.req.param('id'))
  const row = await db.prepare('SELECT filename FROM documents WHERE id = ?').bind(id).first()
  if (row) {
    await bucket.delete(row.filename)
    await db.prepare('DELETE FROM documents WHERE id = ?').bind(id).run()
  }
  return c.json({ ok: true })
})

// --- Search ---
app.get('/api/search', async (c) => {
  const db = c.env.DB
  const q = (c.req.query('q') || '').trim()
  if (!q) return c.json({ calendar: [], gallery: [], documents: [] })
  const like = `%${q}%`
  const calendar = await db.prepare('SELECT date, todos, note FROM calendar_data WHERE note LIKE ? OR todos LIKE ? OR diet LIKE ?').bind(like, like, like).all()
  const gallery = await db.prepare('SELECT id, filename, original_name, created_at FROM gallery WHERE original_name LIKE ?').bind(like).all()
  const documents = await db.prepare('SELECT id, filename, original_name, size, created_at FROM documents WHERE original_name LIKE ?').bind(like).all()
  return c.json({
    calendar: calendar.results.map(r => ({ date: r.date, note: r.note, todos: JSON.parse(r.todos) })),
    gallery: gallery.results.map(r => ({ id: r.id, url: `/uploads/${r.filename}`, name: r.original_name, date: r.created_at })),
    documents: documents.results.map(r => ({ id: r.id, url: `/uploads/${r.filename}`, name: r.original_name, size: r.size, date: r.created_at })),
  })
})

// --- Settings ---
app.get('/api/settings', async (c) => {
  const db = c.env.DB
  const rows = await db.prepare('SELECT key, value FROM settings').all()
  const settings = {}
  for (const r of rows.results) settings[r.key] = r.value
  return c.json(settings)
})

app.put('/api/settings', async (c) => {
  const db = c.env.DB
  const body = await c.req.json()
  for (const [key, value] of Object.entries(body)) {
    await db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key, String(value)).run()
  }
  return c.json({ ok: true })
})

// --- Serve uploads from R2 ---
app.get('/uploads/:filename', async (c) => {
  const bucket = c.env.BUCKET
  const filename = c.req.param('filename')
  const obj = await bucket.get(filename)
  if (!obj) return c.notFound()
  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set('cache-control', 'public, max-age=31536000')
  return new Response(obj.body, { headers })
})

export default app
