# Pregnancy Guardian

A full-stack pregnancy tracking app for expectant parents. Track daily health, store memories, and get AI-powered advice from pregnancy books.

## Features

- **Calendar** — Weekly view with daily tracking (diet, body metrics, exercises, to-dos)
- **Gallery** — Photo timeline grouped by day, with upload
- **Documents** — Upload and organize pregnancy-related files (reports, prescriptions)
- **Assistant** — AI-powered Q&A grounded in pregnancy books (RAG with Cloudflare Vectorize)
- **Trends** — Line charts for weight, blood pressure, heart rate, blood sugar over time
- **Week Tracker** — Pregnancy progress ring, countdown, trimester colors
- **Weekly Guide** — Week-by-week pregnancy articles with collapsible sections

## Architecture

```
pregnancy-guardian/
├── src/                    # React web app (Vite + Tailwind CSS v4)
├── ios/                    # SwiftUI iOS app
├── worker/                 # Cloudflare Worker (API backend)
├── scripts/                # Ingestion & utility scripts
├── data/                   # Source content (weekly articles, markdown)
└── server/                 # Python/FastAPI local backend (alternative)
```

### Backend (Cloudflare — Production)

| Service | Purpose |
|---------|---------|
| Workers | API endpoints (Hono framework) |
| D1 | SQLite database (todos, diet, monitor, exercises, gallery, documents, settings) |
| R2 | File storage (photos, documents) |
| Vectorize | Vector database for RAG knowledge base |
| Workers AI | Embeddings (bge-base-en-v1.5) + LLM (Llama 3.3 70B) |

### Backend (Local — Development)

Python/FastAPI + SQLite on disk. Same API contract as the Worker.

```bash
python3.12 server/app.py  # starts on port 3001
npm run dev               # Vite dev server with proxy
```

## Getting Started

### Web App (Development)

```bash
npm install
npm run dev               # http://localhost:5173
```

### Web App (Deploy to Cloudflare)

```bash
npm run build
npx wrangler deploy                                          # Worker API
npx wrangler pages deploy dist --project-name pregnancy-guardian  # Frontend
```

### iOS App

Open `ios/PregnancyGuardian.xcodeproj` in Xcode and press ⌘R.

### Knowledge Base

```bash
# Check PDF quality
python3.12 scripts/check_pdf.py book.pdf

# Ingest a PDF book
python3.12 scripts/ingest_pdf.py book.pdf <WORKER_URL>

# Ingest an EPUB
python3.12 scripts/ingest_epub.py book.epub <WORKER_URL>

# Ingest weekly articles
python3.12 scripts/ingest_weeks.py <WORKER_URL>

# Delete a book
python3.12 scripts/delete_book.py book.pdf.manifest.json <WORKER_URL>
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar?from=&to=` | Get week's data |
| GET | `/api/calendar/:date` | Get single day |
| POST | `/api/todos` | Create todo |
| PUT | `/api/todos/:id` | Update todo |
| DELETE | `/api/todos/:id` | Delete todo |
| PUT | `/api/diet/:date/:meal` | Save meal (partial update) |
| PUT | `/api/monitor/:date/:metric` | Save metric |
| POST | `/api/exercises` | Create exercise |
| DELETE | `/api/exercises/:id` | Delete exercise |
| GET | `/api/gallery` | List photos |
| POST | `/api/gallery` | Upload photos |
| DELETE | `/api/gallery/:id` | Delete photo |
| GET | `/api/documents` | List documents |
| POST | `/api/documents` | Upload documents |
| DELETE | `/api/documents/:id` | Delete document |
| GET | `/api/trends/:metric` | Get metric history |
| GET | `/api/settings` | Get settings |
| PUT | `/api/settings` | Save settings |
| POST | `/api/knowledge/ingest` | Ingest chunks into Vectorize |
| POST | `/api/knowledge/delete` | Delete vectors by IDs |
| POST | `/api/ask` | AI assistant (streaming) |
| GET | `/api/backup` | Download full backup (zip) |

## Tech Stack

**Web**: React 19, Vite 8, Tailwind CSS v4, Recharts, react-markdown

**iOS**: SwiftUI, async/await, PhotosPicker, Swift Charts

**Backend**: Hono (Cloudflare Worker), FastAPI (local)

**AI/RAG**: Cloudflare Vectorize + Workers AI (bge-base-en-v1.5 embeddings, Llama 3.3 70B)

## Design

- Warm pink theme (#F472B6 primary)
- Varela Round (headings) + Nunito Sans (body)
- Trimester colors: pink (1st), amber (2nd), purple (3rd)
- Mobile-friendly weekly calendar with inline detail panel
