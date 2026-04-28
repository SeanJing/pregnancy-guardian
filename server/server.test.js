import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createRequire } from 'module'
import request from 'supertest'
import fs from 'fs'
import path from 'path'
import os from 'os'

const require = createRequire(import.meta.url)
const { createApp } = require('../server/server.cjs')

let app, close, tmpDir

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pg-test-'))
  const result = await createApp({
    dbPath: path.join(tmpDir, 'test.sqlite'),
    uploadsDir: path.join(tmpDir, 'uploads'),
  })
  app = result.app
  close = result.close
})

afterAll(() => {
  close()
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

// --- Calendar ---
describe('Calendar API', () => {
  it('GET /api/calendar returns empty object initially', async () => {
    const res = await request(app).get('/api/calendar')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({})
  })

  it('PUT /api/calendar/:date saves and retrieves data', async () => {
    const date = '2026-05-01'
    const payload = { todos: [{ text: 'Buy vitamins', done: false }], note: 'Doctor visit' }

    const put = await request(app).put(`/api/calendar/${date}`).send(payload)
    expect(put.status).toBe(200)
    expect(put.body).toEqual({ ok: true })

    const get = await request(app).get('/api/calendar')
    expect(get.body[date].note).toBe('Doctor visit')
    expect(get.body[date].todos).toHaveLength(1)
    expect(get.body[date].todos[0].text).toBe('Buy vitamins')
  })

  it('PUT /api/calendar/:date upserts on same date', async () => {
    const date = '2026-05-01'
    await request(app).put(`/api/calendar/${date}`).send({ todos: [], note: 'Updated' })

    const get = await request(app).get('/api/calendar')
    expect(get.body[date].note).toBe('Updated')
    expect(get.body[date].todos).toHaveLength(0)
  })
})

// --- Gallery ---
describe('Gallery API', () => {
  let photoId

  it('GET /api/gallery returns empty array initially', async () => {
    const res = await request(app).get('/api/gallery')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('POST /api/gallery uploads a photo', async () => {
    const res = await request(app)
      .post('/api/gallery')
      .attach('photos', Buffer.from('fake-image'), 'ultrasound.jpg')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('ultrasound.jpg')
    expect(res.body[0]).toHaveProperty('id')
    expect(res.body[0]).toHaveProperty('url')
    photoId = res.body[0].id
  })

  it('POST /api/gallery uploads multiple photos', async () => {
    const res = await request(app)
      .post('/api/gallery')
      .attach('photos', Buffer.from('img1'), 'bump-week20.jpg')
      .attach('photos', Buffer.from('img2'), 'bump-week24.jpg')
    expect(res.body).toHaveLength(2)
  })

  it('GET /api/gallery lists uploaded photos', async () => {
    const res = await request(app).get('/api/gallery')
    expect(res.body.length).toBeGreaterThanOrEqual(3)
  })

  it('DELETE /api/gallery/:id removes a photo', async () => {
    const del = await request(app).delete(`/api/gallery/${photoId}`)
    expect(del.body).toEqual({ ok: true })

    const list = await request(app).get('/api/gallery')
    expect(list.body.find(p => p.id === photoId)).toBeUndefined()
  })
})

// --- Documents ---
describe('Documents API', () => {
  let docId

  it('GET /api/documents returns empty array initially', async () => {
    const res = await request(app).get('/api/documents')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('POST /api/documents uploads a file', async () => {
    const res = await request(app)
      .post('/api/documents')
      .attach('files', Buffer.from('pdf-content'), 'blood-test.pdf')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('blood-test.pdf')
    expect(res.body[0]).toHaveProperty('size')
    docId = res.body[0].id
  })

  it('GET /api/documents lists uploaded documents', async () => {
    const res = await request(app).get('/api/documents')
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('blood-test.pdf')
  })

  it('DELETE /api/documents/:id removes a document', async () => {
    const del = await request(app).delete(`/api/documents/${docId}`)
    expect(del.body).toEqual({ ok: true })

    const list = await request(app).get('/api/documents')
    expect(list.body).toHaveLength(0)
  })
})

// --- Settings ---
describe('Settings API', () => {
  it('GET /api/settings returns empty object initially', async () => {
    const res = await request(app).get('/api/settings')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({})
  })

  it('PUT /api/settings saves and retrieves settings', async () => {
    await request(app).put('/api/settings').send({ dueDate: '2026-10-15' })

    const res = await request(app).get('/api/settings')
    expect(res.body.dueDate).toBe('2026-10-15')
  })

  it('PUT /api/settings upserts existing keys', async () => {
    await request(app).put('/api/settings').send({ dueDate: '2026-11-01' })

    const res = await request(app).get('/api/settings')
    expect(res.body.dueDate).toBe('2026-11-01')
  })
})

// --- Search ---
describe('Search API', () => {
  beforeEach(async () => {
    await request(app).put('/api/calendar/2026-06-10').send({ todos: [{ text: 'Ultrasound appointment', done: false }], note: 'Week 20 checkup' })
    await request(app).post('/api/documents').attach('files', Buffer.from('x'), 'prenatal-report.pdf')
  })

  it('GET /api/search returns empty when no query', async () => {
    const res = await request(app).get('/api/search')
    expect(res.body).toEqual({ calendar: [], gallery: [], documents: [] })
  })

  it('GET /api/search finds calendar notes', async () => {
    const res = await request(app).get('/api/search?q=checkup')
    expect(res.body.calendar.length).toBeGreaterThanOrEqual(1)
    expect(res.body.calendar[0].note).toContain('checkup')
  })

  it('GET /api/search finds calendar todos', async () => {
    const res = await request(app).get('/api/search?q=Ultrasound')
    expect(res.body.calendar.length).toBeGreaterThanOrEqual(1)
  })

  it('GET /api/search finds documents by name', async () => {
    const res = await request(app).get('/api/search?q=prenatal')
    expect(res.body.documents.length).toBeGreaterThanOrEqual(1)
    expect(res.body.documents[0].name).toContain('prenatal')
  })

  it('GET /api/search returns empty for no match', async () => {
    const res = await request(app).get('/api/search?q=xyznonexistent')
    expect(res.body.calendar).toHaveLength(0)
    expect(res.body.gallery).toHaveLength(0)
    expect(res.body.documents).toHaveLength(0)
  })
})

// --- Backup ---
describe('Backup API', () => {
  it('GET /api/backup returns a zip file', async () => {
    const res = await request(app).get('/api/backup').buffer(true).parse((res, cb) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => cb(null, Buffer.concat(chunks)))
    })
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toBe('application/zip')
    expect(res.headers['content-disposition']).toContain('.zip')
    expect(Buffer.isBuffer(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
  })
})
