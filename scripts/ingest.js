/**
 * Chunks pg.json and ingests into Vectorize via the Worker API.
 *
 * Usage:
 *   node scripts/ingest.js https://pregnancy-guardian-api.YOUR_SUBDOMAIN.workers.dev
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const API_URL = process.argv[2]
if (!API_URL) { console.error('Usage: node scripts/ingest.js <WORKER_URL>'); process.exit(1) }

const guide = JSON.parse(readFileSync(resolve(__dirname, '../src/data/pg.json'), 'utf-8'))

// Build chunks from the guide
const chunks = []
for (const [weekKey, data] of Object.entries(guide)) {
  const week = parseInt(weekKey.replace('week_', ''))
  for (const [category, items] of Object.entries(data)) {
    if (!Array.isArray(items)) continue
    for (let i = 0; i < items.length; i++) {
      chunks.push({
        id: `${weekKey}_${category}_${i}`,
        text: `Week ${week} - ${category}: ${items[i]}`,
        meta: { week, category }
      })
    }
  }
}

console.log(`Total chunks: ${chunks.length}`)

// Ingest in batches of 50 (Vectorize limit per request)
const BATCH_SIZE = 50
for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
  const batch = chunks.slice(i, i + BATCH_SIZE)
  const res = await fetch(`${API_URL}/api/knowledge/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chunks: batch })
  })
  const result = await res.json()
  console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${result.ok ? `✓ ${result.count} chunks` : `✗ ${JSON.stringify(result)}`}`)
}

console.log('Done!')
