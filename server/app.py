"""Pregnancy Guardian API server."""

import json
import os
import sqlite3
import shutil
import tempfile
import time
from datetime import date
from pathlib import Path
from zipfile import ZipFile

from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).parent
DB_PATH = BASE_DIR / "pg.sqlite"
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

app = FastAPI()


def get_db() -> sqlite3.Connection:
    """Get a database connection with row factory."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables if they don't exist."""
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS calendar_data (
            date TEXT PRIMARY KEY,
            todos TEXT DEFAULT '[]',
            note TEXT DEFAULT '',
            diet TEXT DEFAULT '{}',
            monitor TEXT DEFAULT '{}',
            exercises TEXT DEFAULT '{}'
        );
        CREATE TABLE IF NOT EXISTS gallery (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            size INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
    """)
    # Migrate: add columns if missing
    existing = {r[1] for r in conn.execute("PRAGMA table_info(calendar_data)")}
    for col in ("diet", "monitor", "exercises"):
        if col not in existing:
            conn.execute(f"ALTER TABLE calendar_data ADD COLUMN {col} TEXT DEFAULT '{{}}'")
    conn.commit()
    conn.close()


init_db()

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


# --- Calendar ---

@app.get("/api/calendar")
def get_calendar():
    conn = get_db()
    data = {}
    for row in conn.execute("SELECT date, todos, note, diet, monitor, exercises FROM calendar_data"):
        data[row["date"]] = {
            "todos": json.loads(row["todos"]),
            "pics": [],
            "note": row["note"],
            "diet": json.loads(row["diet"] or "{}"),
            "monitor": json.loads(row["monitor"] or "{}"),
            "exercises": json.loads(row["exercises"] or "{}"),
        }
    for row in conn.execute("SELECT id, filename, original_name, strftime('%Y-%m-%d', created_at) as d FROM gallery"):
        d = row["d"]
        if d not in data:
            data[d] = {"todos": [], "pics": [], "note": ""}
        data[d]["pics"].append({"id": row["id"], "url": f"/uploads/{row['filename']}", "name": row["original_name"]})
    conn.close()
    return data


@app.get("/api/calendar/{date_str}")
def get_calendar_day(date_str: str):
    conn = get_db()
    row = conn.execute("SELECT todos, note, diet, monitor, exercises FROM calendar_data WHERE date = ?", (date_str,)).fetchone()
    data = {"todos": [], "pics": [], "note": "", "diet": {}, "monitor": {}, "exercises": {}}
    if row:
        data["todos"] = json.loads(row["todos"])
        data["note"] = row["note"]
        data["diet"] = json.loads(row["diet"] or "{}")
        data["monitor"] = json.loads(row["monitor"] or "{}")
        data["exercises"] = json.loads(row["exercises"] or "{}")
    for r in conn.execute("SELECT id, filename, original_name FROM gallery WHERE strftime('%Y-%m-%d', created_at) = ?", (date_str,)):
        data["pics"].append({"id": r["id"], "url": f"/uploads/{r['filename']}", "name": r["original_name"]})
    conn.close()
    return data


@app.put("/api/calendar/{date_str}")
async def save_calendar(date_str: str, request: Request):
    body = await request.json()
    todos = json.dumps(body.get("todos", []))
    note = body.get("note", "")
    diet = json.dumps(body.get("diet", {}))
    monitor = json.dumps(body.get("monitor", {}))
    exercises = json.dumps(body.get("exercises", {}))
    conn = get_db()
    conn.execute(
        "INSERT INTO calendar_data (date, todos, note, diet, monitor, exercises) VALUES (?, ?, ?, ?, ?, ?) "
        "ON CONFLICT(date) DO UPDATE SET todos=excluded.todos, note=excluded.note, diet=excluded.diet, monitor=excluded.monitor, exercises=excluded.exercises",
        (date_str, todos, note, diet, monitor, exercises),
    )
    conn.commit()
    conn.close()
    return {"ok": True}


# --- Gallery ---

@app.get("/api/gallery")
def get_gallery():
    conn = get_db()
    items = [
        {"id": r["id"], "url": f"/uploads/{r['filename']}", "name": r["original_name"], "date": r["created_at"]}
        for r in conn.execute("SELECT id, filename, original_name, created_at FROM gallery ORDER BY created_at DESC")
    ]
    conn.close()
    return items


@app.post("/api/gallery")
async def upload_photos(photos: list[UploadFile] = File(...)):
    conn = get_db()
    items = []
    for f in photos:
        filename = f"{int(time.time() * 1000)}-{f.filename}"
        path = UPLOADS_DIR / filename
        content = await f.read()
        path.write_bytes(content)
        conn.execute("INSERT INTO gallery (filename, original_name) VALUES (?, ?)", (filename, f.filename))
        conn.commit()
        row_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        items.append({"id": row_id, "url": f"/uploads/{filename}", "name": f.filename})
    conn.close()
    return items


@app.delete("/api/gallery/{photo_id}")
def delete_photo(photo_id: int):
    conn = get_db()
    row = conn.execute("SELECT filename FROM gallery WHERE id = ?", (photo_id,)).fetchone()
    if row:
        (UPLOADS_DIR / row["filename"]).unlink(missing_ok=True)
        conn.execute("DELETE FROM gallery WHERE id = ?", (photo_id,))
        conn.commit()
    conn.close()
    return {"ok": True}


# --- Documents ---

@app.get("/api/documents")
def get_documents():
    conn = get_db()
    items = [
        {"id": r["id"], "url": f"/uploads/{r['filename']}", "name": r["original_name"], "size": r["size"], "date": r["created_at"]}
        for r in conn.execute("SELECT id, filename, original_name, size, created_at FROM documents ORDER BY created_at DESC")
    ]
    conn.close()
    return items


@app.post("/api/documents")
async def upload_documents(files: list[UploadFile] = File(...)):
    conn = get_db()
    items = []
    for f in files:
        content = await f.read()
        filename = f"{int(time.time() * 1000)}-{f.filename}"
        path = UPLOADS_DIR / filename
        path.write_bytes(content)
        size = len(content)
        conn.execute("INSERT INTO documents (filename, original_name, size) VALUES (?, ?, ?)", (filename, f.filename, size))
        conn.commit()
        row_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        items.append({"id": row_id, "url": f"/uploads/{filename}", "name": f.filename, "size": size})
    conn.close()
    return items


@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: int):
    conn = get_db()
    row = conn.execute("SELECT filename FROM documents WHERE id = ?", (doc_id,)).fetchone()
    if row:
        (UPLOADS_DIR / row["filename"]).unlink(missing_ok=True)
        conn.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        conn.commit()
    conn.close()
    return {"ok": True}


# --- Search ---

@app.get("/api/search")
def search(q: str = ""):
    q = q.strip()
    if not q:
        return {"calendar": [], "gallery": [], "documents": []}
    like = f"%{q}%"
    conn = get_db()
    calendar = [
        {"date": r["date"], "note": r["note"], "todos": json.loads(r["todos"])}
        for r in conn.execute("SELECT date, todos, note FROM calendar_data WHERE note LIKE ? OR todos LIKE ? OR diet LIKE ?", (like, like, like))
    ]
    gallery = [
        {"id": r["id"], "url": f"/uploads/{r['filename']}", "name": r["original_name"], "date": r["created_at"]}
        for r in conn.execute("SELECT id, filename, original_name, created_at FROM gallery WHERE original_name LIKE ?", (like,))
    ]
    documents = [
        {"id": r["id"], "url": f"/uploads/{r['filename']}", "name": r["original_name"], "size": r["size"], "date": r["created_at"]}
        for r in conn.execute("SELECT id, filename, original_name, size, created_at FROM documents WHERE original_name LIKE ?", (like,))
    ]
    conn.close()
    return {"calendar": calendar, "gallery": gallery, "documents": documents}


# --- Settings ---

@app.get("/api/settings")
def get_settings():
    conn = get_db()
    settings = {r["key"]: r["value"] for r in conn.execute("SELECT key, value FROM settings")}
    conn.close()
    return settings


@app.put("/api/settings")
async def save_settings(request: Request):
    body = await request.json()
    conn = get_db()
    for key, value in body.items():
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            (key, str(value)),
        )
    conn.commit()
    conn.close()
    return {"ok": True}


# --- Backup ---

@app.get("/api/backup")
def backup():
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
    with ZipFile(tmp.name, "w") as zf:
        zf.write(str(DB_PATH), "pg.sqlite")
        for f in UPLOADS_DIR.iterdir():
            if f.is_file():
                zf.write(str(f), f"uploads/{f.name}")
    today = date.today().isoformat()
    return FileResponse(
        tmp.name,
        media_type="application/zip",
        filename=f"pg-backup-{today}.zip",
        background=None,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)
