# Pregnancy Guardian — Cloudflare Deployment

## Architecture

- **Frontend**: Cloudflare Pages (static React build)
- **Backend**: Cloudflare Worker (Hono + D1 + R2)
- **Database**: Cloudflare D1 (SQLite-compatible)
- **File Storage**: Cloudflare R2 (S3-compatible)

## Prerequisites

```bash
npm install -g wrangler
wrangler login
```

## Setup

### 1. Create D1 Database

```bash
wrangler d1 create pg-database
```

Copy the `database_id` from the output into `wrangler.toml`.

### 2. Create R2 Bucket

```bash
wrangler r2 bucket create pg-uploads
```

### 3. Initialize Database Schema

```bash
wrangler d1 execute pg-database --command "CREATE TABLE IF NOT EXISTS calendar_data (date TEXT PRIMARY KEY, todos TEXT DEFAULT '[]', note TEXT DEFAULT '', diet TEXT DEFAULT '{}', monitor TEXT DEFAULT '{}', exercises TEXT DEFAULT '{}');"
wrangler d1 execute pg-database --command "CREATE TABLE IF NOT EXISTS gallery (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT NOT NULL, original_name TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')));"
wrangler d1 execute pg-database --command "CREATE TABLE IF NOT EXISTS documents (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT NOT NULL, original_name TEXT NOT NULL, size INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));"
wrangler d1 execute pg-database --command "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);"
```

### 4. Deploy Worker (API)

```bash
wrangler deploy
```

Note the Worker URL (e.g., `https://pregnancy-guardian-api.your-subdomain.workers.dev`).

### 5. Deploy Frontend (Pages)

Update `src/api.js` to point to your Worker URL in production:

```js
const BASE = import.meta.env.PROD
  ? 'https://pregnancy-guardian-api.your-subdomain.workers.dev'
  : '/api'
```

Then deploy:

```bash
npm run build
wrangler pages deploy dist --project-name pregnancy-guardian
```

## Local Development

```bash
# Terminal 1: Python backend (local dev, same API contract)
npm run server

# Terminal 2: Vite dev server
npm run dev
```

The local Python server and Cloudflare Worker share the same API contract, so you can develop locally with Python and deploy to Cloudflare.

## Costs (Free Tier)

| Service | Free Limit |
|---------|-----------|
| Workers | 100k requests/day |
| D1 | 5M rows read, 100k writes/day |
| R2 | 10GB storage, 10M reads/month |
| Pages | Unlimited sites, 500 builds/month |
