const express = require('express')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const initSqlJs = require('sql.js')

/**
 * Create the Express app with a SQLite database.
 * @param {object} opts
 * @param {string} opts.dbPath - Path to SQLite file
 * @param {string} opts.uploadsDir - Path to uploads directory
 * @returns {Promise<{app: import('express').Express, close: () => void}>}
 */
async function createApp({ dbPath, uploadsDir }) {
  fs.mkdirSync(uploadsDir, { recursive: true })

  const SQL = await initSqlJs()
  let db
  if (fs.existsSync(dbPath)) {
    db = new SQL.Database(fs.readFileSync(dbPath))
  } else {
    db = new SQL.Database()
  }

  db.run(`CREATE TABLE IF NOT EXISTS calendar_data (
    date TEXT PRIMARY KEY, todos TEXT DEFAULT '[]', note TEXT DEFAULT ''
  )`)
  db.run(`CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT NOT NULL,
    original_name TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now'))
  )`)
  db.run(`CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT NOT NULL,
    original_name TEXT NOT NULL, size INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )`)
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY, value TEXT NOT NULL
  )`)
  save()

  function save() { fs.writeFileSync(dbPath, Buffer.from(db.export())) }

  function query(sql, params = []) {
    const stmt = db.prepare(sql)
    stmt.bind(params)
    const rows = []
    while (stmt.step()) rows.push(stmt.getAsObject())
    stmt.free()
    return rows
  }

  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use('/uploads', express.static(uploadsDir))

  const upload = multer({ storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, uploadsDir),
    filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  })})

  // --- Calendar ---
  app.get('/api/calendar', (_, res) => {
    const data = {}
    query('SELECT date, todos, note FROM calendar_data').forEach(r => {
      data[r.date] = { todos: JSON.parse(r.todos), pics: [], note: r.note }
    })
    query("SELECT id, filename, original_name, strftime('%Y-%m-%d', created_at) as d FROM gallery").forEach(r => {
      if (!data[r.d]) data[r.d] = { todos: [], pics: [], note: '' }
      data[r.d].pics.push({ id: r.id, url: `/uploads/${r.filename}`, name: r.original_name })
    })
    res.json(data)
  })

  app.put('/api/calendar/:date', (req, res) => {
    const { date } = req.params
    const { todos, note } = req.body
    db.run(
      `INSERT INTO calendar_data (date, todos, note) VALUES (?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET todos=excluded.todos, note=excluded.note`,
      [date, JSON.stringify(todos || []), note || '']
    )
    save()
    res.json({ ok: true })
  })

  // --- Gallery ---
  app.get('/api/gallery', (_, res) => {
    const items = query('SELECT id, filename, original_name, created_at FROM gallery ORDER BY created_at DESC')
      .map(r => ({ id: r.id, url: `/uploads/${r.filename}`, name: r.original_name, date: r.created_at }))
    res.json(items)
  })

  app.post('/api/gallery', upload.array('photos'), (req, res) => {
    const items = req.files.map(f => {
      db.run('INSERT INTO gallery (filename, original_name) VALUES (?, ?)', [f.filename, f.originalname])
      const id = query('SELECT last_insert_rowid() as id')[0].id
      return { id, url: `/uploads/${f.filename}`, name: f.originalname }
    })
    save()
    res.json(items)
  })

  app.delete('/api/gallery/:id', (req, res) => {
    const rows = query('SELECT filename FROM gallery WHERE id = ?', [Number(req.params.id)])
    if (rows.length) {
      fs.unlink(path.join(uploadsDir, rows[0].filename), () => {})
      db.run('DELETE FROM gallery WHERE id = ?', [Number(req.params.id)])
      save()
    }
    res.json({ ok: true })
  })

  // --- Documents ---
  app.get('/api/documents', (_, res) => {
    const items = query('SELECT id, filename, original_name, size, created_at FROM documents ORDER BY created_at DESC')
      .map(r => ({ id: r.id, url: `/uploads/${r.filename}`, name: r.original_name, size: r.size, date: r.created_at }))
    res.json(items)
  })

  app.post('/api/documents', upload.array('files'), (req, res) => {
    const items = req.files.map(f => {
      db.run('INSERT INTO documents (filename, original_name, size) VALUES (?, ?, ?)', [f.filename, f.originalname, f.size])
      const id = query('SELECT last_insert_rowid() as id')[0].id
      return { id, url: `/uploads/${f.filename}`, name: f.originalname, size: f.size }
    })
    save()
    res.json(items)
  })

  app.delete('/api/documents/:id', (req, res) => {
    const rows = query('SELECT filename FROM documents WHERE id = ?', [Number(req.params.id)])
    if (rows.length) {
      fs.unlink(path.join(uploadsDir, rows[0].filename), () => {})
      db.run('DELETE FROM documents WHERE id = ?', [Number(req.params.id)])
      save()
    }
    res.json({ ok: true })
  })

  // --- Search ---
  app.get('/api/search', (req, res) => {
    const q = (req.query.q || '').trim()
    if (!q) return res.json({ calendar: [], gallery: [], documents: [] })
    const like = `%${q}%`
    const calendar = query(
      "SELECT date, todos, note FROM calendar_data WHERE note LIKE ? OR todos LIKE ?", [like, like]
    ).map(r => ({ date: r.date, note: r.note, todos: JSON.parse(r.todos) }))
    const gallery = query(
      "SELECT id, filename, original_name, created_at FROM gallery WHERE original_name LIKE ?", [like]
    ).map(r => ({ id: r.id, url: `/uploads/${r.filename}`, name: r.original_name, date: r.created_at }))
    const documents = query(
      "SELECT id, filename, original_name, size, created_at FROM documents WHERE original_name LIKE ?", [like]
    ).map(r => ({ id: r.id, url: `/uploads/${r.filename}`, name: r.original_name, size: r.size, date: r.created_at }))
    res.json({ calendar, gallery, documents })
  })

  // --- Settings ---
  app.get('/api/settings', (_, res) => {
    const rows = query('SELECT key, value FROM settings')
    const settings = {}
    rows.forEach(r => { settings[r.key] = r.value })
    res.json(settings)
  })

  app.put('/api/settings', (req, res) => {
    Object.entries(req.body).forEach(([key, value]) => {
      db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [key, String(value)])
    })
    save()
    res.json({ ok: true })
  })

  // --- Backup ---
  app.get('/api/backup', (_, res) => {
    save()
    const archiver = require('archiver')
    const name = `pg-backup-${new Date().toISOString().slice(0,10)}`
    res.set({ 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${name}.zip"` })
    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.pipe(res)
    archive.file(dbPath, { name: 'pg.sqlite' })
    archive.directory(uploadsDir, 'uploads')
    archive.finalize()
  })

  return { app, close: () => db.close() }
}

// Run server when executed directly
if (require.main === module) {
  const DB_PATH = path.join(__dirname, 'pg.sqlite')
  const UPLOADS = path.join(__dirname, 'uploads')
  createApp({ dbPath: DB_PATH, uploadsDir: UPLOADS }).then(({ app }) => {
    app.listen(3001, () => console.log('PG server running on http://localhost:3001'))
  })
}

module.exports = { createApp }
