import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()
app.use('*', cors())

async function initDB(db) {
  await db.exec("CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, text TEXT NOT NULL, done INTEGER DEFAULT 0);")
  await db.exec("CREATE TABLE IF NOT EXISTS diet (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, meal TEXT NOT NULL, name TEXT DEFAULT '', instructions TEXT DEFAULT '');")
  await db.exec("CREATE TABLE IF NOT EXISTS monitor (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, metric TEXT NOT NULL, value TEXT NOT NULL);")
  await db.exec("CREATE TABLE IF NOT EXISTS exercises (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, activity TEXT DEFAULT '', steps INTEGER DEFAULT 0, duration INTEGER DEFAULT 0);")
  await db.exec("CREATE TABLE IF NOT EXISTS gallery (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT NOT NULL, original_name TEXT NOT NULL, caption TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')));")
  await db.exec("CREATE TABLE IF NOT EXISTS documents (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT NOT NULL, original_name TEXT NOT NULL, size INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));")
  await db.exec("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);")
}

app.use('/api/*', async (c, next) => {
  await initDB(c.env.DB)
  await runMigrations(c.env.DB)
  await next()
})

async function runMigrations(db) {
  const row = await db.prepare("SELECT value FROM settings WHERE key='schema_version'").first()
  const version = parseInt(row?.value || '0')

  if (version < 1) {
    try { await db.exec("ALTER TABLE gallery ADD COLUMN caption TEXT DEFAULT ''") } catch {}
  }
  if (version < 2) {
    try { await db.exec("ALTER TABLE todos RENAME TO events") } catch {}
  }

  // Add future migrations here:
  // if (version < 3) { await db.exec("...") }

  const latest = 2
  if (version < latest) {
    await db.prepare("INSERT INTO settings (key,value) VALUES ('schema_version',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(String(latest)).run()
  }
}

// --- Calendar (aggregated) ---
app.get('/api/calendar', async (c) => {
  const db = c.env.DB
  const from = c.req.query('from')
  const to = c.req.query('to')
  const data = {}
  const ensure = (d) => { if (!data[d]) data[d] = { events: [], diet: {}, monitor: {}, exercises: [] } }

  const where = (from && to) ? ' WHERE date >= ? AND date <= ?' : ''
  const params = (from && to) ? [from, to] : []

  for (const r of (await db.prepare(`SELECT id, date, text, done FROM events${where} ORDER BY id`).bind(...params).all()).results) {
    ensure(r.date); data[r.date].events.push({ id: r.id, text: r.text, done: !!r.done })
  }
  for (const r of (await db.prepare(`SELECT id, date, meal, name, instructions FROM diet${where} ORDER BY id`).bind(...params).all()).results) {
    ensure(r.date); data[r.date].diet[r.meal] = { id: r.id, name: r.name, instructions: r.instructions }
  }
  for (const r of (await db.prepare(`SELECT id, date, metric, value FROM monitor${where} ORDER BY id`).bind(...params).all()).results) {
    ensure(r.date); data[r.date].monitor[r.metric] = { id: r.id, value: r.value }
  }
  for (const r of (await db.prepare(`SELECT id, date, activity, steps, duration FROM exercises${where} ORDER BY id`).bind(...params).all()).results) {
    ensure(r.date); data[r.date].exercises.push({ id: r.id, activity: r.activity, steps: r.steps, duration: r.duration })
  }
  return c.json(data)
})

app.get('/api/calendar/:date', async (c) => {
  const db = c.env.DB
  const date = c.req.param('date')
  const data = { events: [], diet: {}, monitor: {}, exercises: [] }
  for (const r of (await db.prepare('SELECT id, text, done FROM events WHERE date=? ORDER BY id').bind(date).all()).results) {
    data.events.push({ id: r.id, text: r.text, done: !!r.done })
  }
  for (const r of (await db.prepare('SELECT id, meal, name, instructions FROM diet WHERE date=? ORDER BY id').bind(date).all()).results) {
    data.diet[r.meal] = { id: r.id, name: r.name, instructions: r.instructions }
  }
  for (const r of (await db.prepare('SELECT id, metric, value FROM monitor WHERE date=? ORDER BY id').bind(date).all()).results) {
    data.monitor[r.metric] = { id: r.id, value: r.value }
  }
  for (const r of (await db.prepare('SELECT id, activity, steps, duration FROM exercises WHERE date=? ORDER BY id').bind(date).all()).results) {
    data.exercises.push({ id: r.id, activity: r.activity, steps: r.steps, duration: r.duration })
  }
  return c.json(data)
})

// --- Todos ---
app.post('/api/events', async (c) => {
  const db = c.env.DB
  const { date, text, done } = await c.req.json()
  const res = await db.prepare('INSERT INTO events (date, text, done) VALUES (?, ?, ?) RETURNING id').bind(date, text, done ? 1 : 0).first()
  return c.json({ id: res.id, date, text, done: !!done })
})

app.put('/api/events/:id', async (c) => {
  const db = c.env.DB
  const { text, done } = await c.req.json()
  await db.prepare('UPDATE events SET text=?, done=? WHERE id=?').bind(text, done ? 1 : 0, Number(c.req.param('id'))).run()
  return c.json({ ok: true })
})

app.delete('/api/events/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM events WHERE id=?').bind(Number(c.req.param('id'))).run()
  return c.json({ ok: true })
})

// --- Diet ---
app.put('/api/diet/:date/:meal', async (c) => {
  const db = c.env.DB
  const date = c.req.param('date')
  const meal = c.req.param('meal')
  const body = await c.req.json()
  const existing = await db.prepare('SELECT id, name, instructions FROM diet WHERE date=? AND meal=?').bind(date, meal).first()
  const name = body.name !== undefined ? body.name : (existing?.name || '')
  const instructions = body.instructions !== undefined ? body.instructions : (existing?.instructions || '')
  await db.prepare('DELETE FROM diet WHERE date=? AND meal=?').bind(date, meal).run()
  await db.prepare('INSERT INTO diet (date, meal, name, instructions) VALUES (?, ?, ?, ?)').bind(date, meal, name, instructions).run()
  return c.json({ ok: true })
})

// --- Monitor ---
app.put('/api/monitor/:date/:metric', async (c) => {
  const db = c.env.DB
  const date = c.req.param('date')
  const metric = c.req.param('metric')
  const body = await c.req.json()
  const value = body.value || ''
  await db.prepare('DELETE FROM monitor WHERE date=? AND metric=?').bind(date, metric).run()
  await db.prepare('INSERT INTO monitor (date, metric, value) VALUES (?, ?, ?)').bind(date, metric, value).run()
  return c.json({ ok: true })
})

// --- Exercises ---
app.post('/api/exercises', async (c) => {
  const db = c.env.DB
  const { date, activity, steps, duration } = await c.req.json()
  const res = await db.prepare('INSERT INTO exercises (date, activity, steps, duration) VALUES (?, ?, ?, ?) RETURNING id').bind(date, activity || '', steps || 0, duration || 0).first()
  return c.json({ id: res.id, date, activity, steps, duration })
})

app.put('/api/exercises/:id', async (c) => {
  const db = c.env.DB
  const { activity, steps, duration } = await c.req.json()
  await db.prepare('UPDATE exercises SET activity=?, steps=?, duration=? WHERE id=?').bind(activity || '', steps || 0, duration || 0, Number(c.req.param('id'))).run()
  return c.json({ ok: true })
})

app.delete('/api/exercises/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM exercises WHERE id=?').bind(Number(c.req.param('id'))).run()
  return c.json({ ok: true })
})

// --- Gallery ---
app.get('/api/gallery', async (c) => {
  const rows = await c.env.DB.prepare('SELECT id, filename, original_name, caption, created_at FROM gallery ORDER BY created_at DESC').all()
  return c.json(rows.results.map(r => ({ id: r.id, url: `/uploads/${r.filename}`, name: r.original_name, caption: r.caption || '', date: r.created_at })))
})

app.put('/api/gallery/:id/caption', async (c) => {
  const { caption } = await c.req.json()
  await c.env.DB.prepare('UPDATE gallery SET caption=? WHERE id=?').bind(caption || '', Number(c.req.param('id'))).run()
  return c.json({ ok: true })
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
  const row = await db.prepare('SELECT filename FROM gallery WHERE id=?').bind(Number(c.req.param('id'))).first()
  if (row) {
    await c.env.BUCKET.delete(row.filename)
    await db.prepare('DELETE FROM gallery WHERE id=?').bind(Number(c.req.param('id'))).run()
  }
  return c.json({ ok: true })
})

// --- Documents ---
app.get('/api/documents', async (c) => {
  const rows = await c.env.DB.prepare('SELECT id, filename, original_name, size, created_at FROM documents ORDER BY created_at DESC').all()
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
  const row = await db.prepare('SELECT filename FROM documents WHERE id=?').bind(Number(c.req.param('id'))).first()
  if (row) {
    await c.env.BUCKET.delete(row.filename)
    await db.prepare('DELETE FROM documents WHERE id=?').bind(Number(c.req.param('id'))).run()
  }
  return c.json({ ok: true })
})

// --- Search ---
app.get('/api/search', async (c) => {
  const db = c.env.DB
  const q = (c.req.query('q') || '').trim()
  if (!q) return c.json({ calendar: [], gallery: [], documents: [] })
  const like = `%${q}%`
  const eventsDates = await db.prepare('SELECT DISTINCT date FROM events WHERE text LIKE ?').bind(like).all()
  const dietDates = await db.prepare('SELECT DISTINCT date FROM diet WHERE name LIKE ? OR instructions LIKE ?').bind(like, like).all()
  const dates = [...new Set([...eventsDates.results.map(r => r.date), ...dietDates.results.map(r => r.date)])]
  const calendar = dates.sort().reverse().map(d => ({ date: d }))
  const gallery = (await db.prepare('SELECT id, filename, original_name, created_at FROM gallery WHERE original_name LIKE ?').bind(like).all()).results.map(r => ({ id: r.id, url: `/uploads/${r.filename}`, name: r.original_name, date: r.created_at }))
  const documents = (await db.prepare('SELECT id, filename, original_name, size, created_at FROM documents WHERE original_name LIKE ?').bind(like).all()).results.map(r => ({ id: r.id, url: `/uploads/${r.filename}`, name: r.original_name, size: r.size, date: r.created_at }))
  return c.json({ calendar, gallery, documents })
})

// --- Settings ---
app.get('/api/settings', async (c) => {
  const rows = await c.env.DB.prepare('SELECT key, value FROM settings').all()
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
  const obj = await c.env.BUCKET.get(c.req.param('filename'))
  if (!obj) return c.notFound()
  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set('cache-control', 'public, max-age=31536000')
  return new Response(obj.body, { headers })
})

// --- Trends ---
app.get('/api/trends/:metric', async (c) => {
  const db = c.env.DB
  const metric = c.req.param('metric')
  const from = c.req.query('from') || '2000-01-01'
  const to = c.req.query('to') || '2099-12-31'
  const rows = (await db.prepare('SELECT date, value FROM monitor WHERE metric=? AND date>=? AND date<=? ORDER BY date').bind(metric, from, to).all()).results
  return c.json(rows)
})

// --- Knowledge Base (RAG) ---
app.post('/api/knowledge/ingest', async (c) => {
  const { chunks } = await c.req.json() // [{ id, text, meta }]
  if (!chunks?.length) return c.json({ error: 'No chunks provided' }, 400)

  // Embed all chunks
  const texts = chunks.map(ch => ch.text)
  const { data } = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: texts })

  // Upsert into Vectorize
  const vectors = chunks.map((ch, i) => ({
    id: ch.id,
    values: data[i],
    metadata: { text: ch.text, ...(ch.meta || {}) }
  }))
  await c.env.VECTORIZE.upsert(vectors)

  return c.json({ ok: true, count: vectors.length })
})

app.post('/api/knowledge/delete', async (c) => {
  const { ids } = await c.req.json()
  if (!ids?.length) return c.json({ error: 'No IDs provided' }, 400)
  await c.env.VECTORIZE.deleteByIds(ids)
  return c.json({ ok: true, deleted: ids.length })
})

app.post('/api/ask', async (c) => {
  const { question } = await c.req.json()
  if (!question) return c.json({ error: 'No question provided' }, 400)

  // Embed the question
  const { data } = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [question] })

  // Search for relevant chunks
  const results = await c.env.VECTORIZE.query(data[0], { topK: 5, returnMetadata: 'all' })
  const context = results.matches.map(m => m.metadata.text).join('\n\n')

  if (!context) return c.json({ answer: "I don't have enough information to answer that question." })

  // Ask LLM with streaming
  const stream = await c.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [
      { role: 'system', content: `You are a warm, professional pregnancy health assistant. Prioritize the following knowledge when answering. You may supplement with general pregnancy knowledge if the provided context doesn't fully cover the question, but clearly distinguish between book-based and general advice.\n\nKnowledge:\n${context}` },
      { role: 'user', content: question }
    ],
    stream: true,
    max_tokens: 2048
  })

  // Append sources as final SSE event
  const matchTexts = results.matches.map(m => (m.metadata?.text || '').slice(0, 100).replace(/[\n\r\t]/g, ' '))
  const sources = JSON.stringify(results.matches.map((m, i) => ({
    source: m.metadata?.source,
    score: m.score,
    text: matchTexts[i]
  })))
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()

  ;(async () => {
    try {
      if (stream[Symbol.asyncIterator]) {
        for await (const chunk of stream) {
          await writer.write(typeof chunk === 'string' ? encoder.encode(chunk) : chunk)
        }
      } else {
        const reader = stream.getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          await writer.write(value)
        }
      }
    } catch {}
    await writer.write(encoder.encode(`data: {"sources":${sources}}\n\n`))
    await writer.close()
  })()

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
  })
})

export default app
