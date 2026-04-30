"""Pregnancy Guardian API server."""

import json
import os
import sqlite3
import time
from datetime import date
from pathlib import Path
from zipfile import ZipFile
import tempfile

from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).parent
DB_PATH = BASE_DIR / "pg.sqlite"
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

app = FastAPI()


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            text TEXT NOT NULL,
            done INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS diet (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            meal TEXT NOT NULL,
            name TEXT DEFAULT '',
            instructions TEXT DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS monitor (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            metric TEXT NOT NULL,
            value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS exercises (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            activity TEXT DEFAULT '',
            steps INTEGER DEFAULT 0,
            duration INTEGER DEFAULT 0
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
        CREATE INDEX IF NOT EXISTS idx_todos_date ON todos(date);
        CREATE INDEX IF NOT EXISTS idx_diet_date ON diet(date);
        CREATE INDEX IF NOT EXISTS idx_monitor_date ON monitor(date);
        CREATE INDEX IF NOT EXISTS idx_exercises_date ON exercises(date);
    """)
    conn.commit()
    conn.close()


init_db()
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


# --- Calendar (aggregated view) ---

@app.get("/api/calendar")
def get_calendar():
    conn = get_db()
    data = {}
    # Collect all dates that have any data
    for row in conn.execute("SELECT DISTINCT date FROM todos UNION SELECT DISTINCT date FROM diet UNION SELECT DISTINCT date FROM monitor UNION SELECT DISTINCT date FROM exercises"):
        d = row[0]
        if d not in data:
            data[d] = {"todos": [], "diet": {}, "monitor": {}, "exercises": []}
    # Todos
    for r in conn.execute("SELECT id, date, text, done FROM todos ORDER BY id"):
        data.setdefault(r["date"], {"todos": [], "diet": {}, "monitor": {}, "exercises": []})
        data[r["date"]]["todos"].append({"id": r["id"], "text": r["text"], "done": bool(r["done"])})
    # Diet
    for r in conn.execute("SELECT id, date, meal, name, instructions FROM diet ORDER BY id"):
        data.setdefault(r["date"], {"todos": [], "diet": {}, "monitor": {}, "exercises": []})
        data[r["date"]]["diet"][r["meal"]] = {"id": r["id"], "name": r["name"], "instructions": r["instructions"]}
    # Monitor
    for r in conn.execute("SELECT id, date, metric, value FROM monitor ORDER BY id"):
        data.setdefault(r["date"], {"todos": [], "diet": {}, "monitor": {}, "exercises": []})
        data[r["date"]]["monitor"][r["metric"]] = {"id": r["id"], "value": r["value"]}
    # Exercises
    for r in conn.execute("SELECT id, date, activity, steps, duration FROM exercises ORDER BY id"):
        data.setdefault(r["date"], {"todos": [], "diet": {}, "monitor": {}, "exercises": []})
        data[r["date"]]["exercises"].append({"id": r["id"], "activity": r["activity"], "steps": r["steps"], "duration": r["duration"]})
    conn.close()
    return data


@app.get("/api/calendar/{date_str}")
def get_calendar_day(date_str: str):
    conn = get_db()
    data = {"todos": [], "diet": {}, "monitor": {}, "exercises": []}
    for r in conn.execute("SELECT id, text, done FROM todos WHERE date = ? ORDER BY id", (date_str,)):
        data["todos"].append({"id": r["id"], "text": r["text"], "done": bool(r["done"])})
    for r in conn.execute("SELECT id, meal, name, instructions FROM diet WHERE date = ? ORDER BY id", (date_str,)):
        data["diet"][r["meal"]] = {"id": r["id"], "name": r["name"], "instructions": r["instructions"]}
    for r in conn.execute("SELECT id, metric, value FROM monitor WHERE date = ? ORDER BY id", (date_str,)):
        data["monitor"][r["metric"]] = {"id": r["id"], "value": r["value"]}
    for r in conn.execute("SELECT id, activity, steps, duration FROM exercises WHERE date = ? ORDER BY id", (date_str,)):
        data["exercises"].append({"id": r["id"], "activity": r["activity"], "steps": r["steps"], "duration": r["duration"]})
    conn.close()
    return data


# --- Todos ---

@app.post("/api/todos")
async def create_todo(request: Request):
    body = await request.json()
    conn = get_db()
    cur = conn.execute("INSERT INTO todos (date, text, done) VALUES (?, ?, ?)", (body["date"], body["text"], int(body.get("done", False))))
    conn.commit()
    todo_id = cur.lastrowid
    conn.close()
    return {"id": todo_id, "date": body["date"], "text": body["text"], "done": body.get("done", False)}


@app.put("/api/todos/{todo_id}")
async def update_todo(todo_id: int, request: Request):
    body = await request.json()
    conn = get_db()
    conn.execute("UPDATE todos SET text=?, done=? WHERE id=?", (body.get("text", ""), int(body.get("done", False)), todo_id))
    conn.commit()
    conn.close()
    return {"ok": True}


@app.delete("/api/todos/{todo_id}")
def delete_todo(todo_id: int):
    conn = get_db()
    conn.execute("DELETE FROM todos WHERE id=?", (todo_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


# --- Diet ---

@app.put("/api/diet/{date_str}/{meal}")
async def save_diet(date_str: str, meal: str, request: Request):
    body = await request.json()
    conn = get_db()
    existing = conn.execute("SELECT id, name, instructions FROM diet WHERE date=? AND meal=?", (date_str, meal)).fetchone()
    name = body["name"] if "name" in body else (existing["name"] if existing else "")
    instructions = body["instructions"] if "instructions" in body else (existing["instructions"] if existing else "")
    if existing:
        conn.execute("UPDATE diet SET name=?, instructions=? WHERE id=?", (name, instructions, existing["id"]))
    else:
        conn.execute("INSERT INTO diet (date, meal, name, instructions) VALUES (?, ?, ?, ?)", (date_str, meal, name, instructions))
    conn.commit()
    conn.close()
    return {"ok": True}


# --- Monitor ---

@app.put("/api/monitor/{date_str}/{metric}")
async def save_monitor(date_str: str, metric: str, request: Request):
    body = await request.json()
    conn = get_db()
    existing = conn.execute("SELECT id FROM monitor WHERE date=? AND metric=?", (date_str, metric)).fetchone()
    if existing:
        conn.execute("UPDATE monitor SET value=? WHERE id=?", (body["value"], existing["id"]))
    else:
        conn.execute("INSERT INTO monitor (date, metric, value) VALUES (?, ?, ?)", (date_str, metric, body["value"]))
    conn.commit()
    conn.close()
    return {"ok": True}


# --- Exercises ---

@app.post("/api/exercises")
async def create_exercise(request: Request):
    body = await request.json()
    conn = get_db()
    cur = conn.execute("INSERT INTO exercises (date, activity, steps, duration) VALUES (?, ?, ?, ?)",
                       (body["date"], body.get("activity", ""), int(body.get("steps", 0)), int(body.get("duration", 0))))
    conn.commit()
    ex_id = cur.lastrowid
    conn.close()
    return {"id": ex_id, **body}


@app.put("/api/exercises/{ex_id}")
async def update_exercise(ex_id: int, request: Request):
    body = await request.json()
    conn = get_db()
    conn.execute("UPDATE exercises SET activity=?, steps=?, duration=? WHERE id=?",
                 (body.get("activity", ""), int(body.get("steps", 0)), int(body.get("duration", 0)), ex_id))
    conn.commit()
    conn.close()
    return {"ok": True}


@app.delete("/api/exercises/{ex_id}")
def delete_exercise(ex_id: int):
    conn = get_db()
    conn.execute("DELETE FROM exercises WHERE id=?", (ex_id,))
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
        (UPLOADS_DIR / filename).write_bytes(await f.read())
        cur = conn.execute("INSERT INTO gallery (filename, original_name) VALUES (?, ?)", (filename, f.filename))
        conn.commit()
        items.append({"id": cur.lastrowid, "url": f"/uploads/{filename}", "name": f.filename})
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
        (UPLOADS_DIR / filename).write_bytes(content)
        cur = conn.execute("INSERT INTO documents (filename, original_name, size) VALUES (?, ?, ?)", (filename, f.filename, len(content)))
        conn.commit()
        items.append({"id": cur.lastrowid, "url": f"/uploads/{filename}", "name": f.filename, "size": len(content)})
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
    # Search todos and diet
    dates = set()
    for r in conn.execute("SELECT DISTINCT date FROM todos WHERE text LIKE ?", (like,)):
        dates.add(r[0])
    for r in conn.execute("SELECT DISTINCT date FROM diet WHERE name LIKE ? OR instructions LIKE ?", (like, like)):
        dates.add(r[0])
    calendar = [{"date": d} for d in sorted(dates, reverse=True)]
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
        conn.execute("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (key, str(value)))
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
    return FileResponse(tmp.name, media_type="application/zip", filename=f"pg-backup-{today}.zip")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)
