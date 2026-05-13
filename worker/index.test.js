import { env } from 'cloudflare:test'
import { describe, it, expect } from 'vitest'
import app from './index'

async function request(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) opts.body = JSON.stringify(body)
  return app.fetch(new Request(`http://localhost${path}`, opts), env)
}

describe('Settings', () => {
  it('GET /api/settings returns empty', async () => {
    const res = await request('GET', '/api/settings')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({})
  })

  it('PUT /api/settings saves data', async () => {
    await request('PUT', '/api/settings', { dueDate: '2026-10-15' })
    const res = await request('GET', '/api/settings')
    expect((await res.json()).dueDate).toBe('2026-10-15')
  })
})

describe('Events', () => {
  it('POST /api/events creates event', async () => {
    const res = await request('POST', '/api/events', { date: '2026-05-13', text: 'Doctor', time: '14:00' })
    const data = await res.json()
    expect(data.id).toBeDefined()
    expect(data.text).toBe('Doctor')
    expect(data.time).toBe('14:00')
  })

  it('GET /api/calendar returns events', async () => {
    await request('POST', '/api/events', { date: '2026-05-13', text: 'Test', time: '09:00' })
    const res = await request('GET', '/api/calendar?from=2026-05-13&to=2026-05-13')
    const data = await res.json()
    expect(data['2026-05-13'].events.length).toBeGreaterThan(0)
  })

  it('DELETE /api/events/:id removes event', async () => {
    const created = await (await request('POST', '/api/events', { date: '2026-05-14', text: 'Del' })).json()
    await request('DELETE', `/api/events/${created.id}`)
    const day = await (await request('GET', '/api/calendar?from=2026-05-14&to=2026-05-14')).json()
    const events = day['2026-05-14']?.events || []
    expect(events.find(e => e.id === created.id)).toBeUndefined()
  })
})

describe('Diet', () => {
  it('PUT /api/diet saves meal', async () => {
    await request('PUT', '/api/diet/2026-05-13/breakfast', { name: 'Oatmeal' })
    const res = await request('GET', '/api/calendar/2026-05-13')
    const data = await res.json()
    expect(data.diet.breakfast.name).toBe('Oatmeal')
  })
})

describe('Monitor', () => {
  it('PUT /api/monitor saves metric', async () => {
    await request('PUT', '/api/monitor/2026-05-13/weight', { value: '62.5' })
    const res = await request('GET', '/api/calendar/2026-05-13')
    const data = await res.json()
    expect(data.monitor.weight.value).toBe('62.5')
  })
})

describe('Exercises', () => {
  it('POST /api/exercises creates exercise', async () => {
    const res = await request('POST', '/api/exercises', { date: '2026-05-13', activity: 'Walk', steps: 5000, duration: 30 })
    const data = await res.json()
    expect(data.id).toBeDefined()
    expect(data.activity).toBe('Walk')
  })
})

describe('Gallery', () => {
  it('GET /api/gallery returns array', async () => {
    const res = await request('GET', '/api/gallery')
    expect(res.status).toBe(200)
    expect(Array.isArray(await res.json())).toBe(true)
  })
})

describe('Documents', () => {
  it('GET /api/documents returns array', async () => {
    const res = await request('GET', '/api/documents')
    expect(res.status).toBe(200)
    expect(Array.isArray(await res.json())).toBe(true)
  })
})

describe('Trends', () => {
  it('GET /api/trends/:metric returns array', async () => {
    await request('PUT', '/api/monitor/2026-05-13/weight', { value: '63' })
    const res = await request('GET', '/api/trends/weight')
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
  })
})
