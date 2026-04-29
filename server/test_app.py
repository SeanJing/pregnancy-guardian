"""Tests for Pregnancy Guardian API."""

import os
import tempfile
import shutil
from pathlib import Path
from zipfile import ZipFile

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def setup_test_env(monkeypatch, tmp_path):
    """Use a temp directory for DB and uploads in each test session."""
    db_path = tmp_path / "test.sqlite"
    uploads_dir = tmp_path / "uploads"
    uploads_dir.mkdir()

    import server.app as app_module
    monkeypatch.setattr(app_module, "DB_PATH", db_path)
    monkeypatch.setattr(app_module, "UPLOADS_DIR", uploads_dir)
    app_module.init_db()
    # Remount static files to use temp uploads dir
    for route in app_module.app.routes:
        if hasattr(route, "name") and route.name == "uploads":
            app_module.app.routes.remove(route)
            break
    from fastapi.staticfiles import StaticFiles
    app_module.app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")
    yield


@pytest.fixture
def client():
    from server.app import app
    return TestClient(app)


# --- Calendar ---

class TestCalendar:
    def test_get_empty(self, client):
        res = client.get("/api/calendar")
        assert res.status_code == 200
        assert res.json() == {}

    def test_put_and_get(self, client):
        payload = {"todos": [{"text": "Buy vitamins", "done": False}], "note": "Doctor visit"}
        res = client.put("/api/calendar/2026-05-01", json=payload)
        assert res.json() == {"ok": True}

        data = client.get("/api/calendar").json()
        assert data["2026-05-01"]["note"] == "Doctor visit"
        assert len(data["2026-05-01"]["todos"]) == 1
        assert data["2026-05-01"]["todos"][0]["text"] == "Buy vitamins"

    def test_upsert(self, client):
        client.put("/api/calendar/2026-05-01", json={"todos": [], "note": "First"})
        client.put("/api/calendar/2026-05-01", json={"todos": [], "note": "Updated"})
        data = client.get("/api/calendar").json()
        assert data["2026-05-01"]["note"] == "Updated"


# --- Gallery ---

class TestGallery:
    def test_get_empty(self, client):
        res = client.get("/api/gallery")
        assert res.status_code == 200
        assert res.json() == []

    def test_upload_photo(self, client):
        res = client.post("/api/gallery", files=[("photos", ("ultrasound.jpg", b"fake-image", "image/jpeg"))])
        assert res.status_code == 200
        items = res.json()
        assert len(items) == 1
        assert items[0]["name"] == "ultrasound.jpg"
        assert "id" in items[0]
        assert "url" in items[0]

    def test_upload_multiple(self, client):
        res = client.post("/api/gallery", files=[
            ("photos", ("bump1.jpg", b"img1", "image/jpeg")),
            ("photos", ("bump2.jpg", b"img2", "image/jpeg")),
        ])
        assert len(res.json()) == 2

    def test_list_photos(self, client):
        client.post("/api/gallery", files=[("photos", ("test.jpg", b"x", "image/jpeg"))])
        res = client.get("/api/gallery")
        assert len(res.json()) >= 1

    def test_delete_photo(self, client):
        upload = client.post("/api/gallery", files=[("photos", ("del.jpg", b"x", "image/jpeg"))])
        photo_id = upload.json()[0]["id"]

        res = client.delete(f"/api/gallery/{photo_id}")
        assert res.json() == {"ok": True}

        items = client.get("/api/gallery").json()
        assert all(p["id"] != photo_id for p in items)


# --- Documents ---

class TestDocuments:
    def test_get_empty(self, client):
        res = client.get("/api/documents")
        assert res.status_code == 200
        assert res.json() == []

    def test_upload_document(self, client):
        res = client.post("/api/documents", files=[("files", ("blood-test.pdf", b"pdf-content", "application/pdf"))])
        assert res.status_code == 200
        items = res.json()
        assert len(items) == 1
        assert items[0]["name"] == "blood-test.pdf"
        assert items[0]["size"] == len(b"pdf-content")

    def test_list_documents(self, client):
        client.post("/api/documents", files=[("files", ("report.pdf", b"x", "application/pdf"))])
        res = client.get("/api/documents")
        assert len(res.json()) >= 1

    def test_delete_document(self, client):
        upload = client.post("/api/documents", files=[("files", ("del.pdf", b"x", "application/pdf"))])
        doc_id = upload.json()[0]["id"]

        res = client.delete(f"/api/documents/{doc_id}")
        assert res.json() == {"ok": True}

        items = client.get("/api/documents").json()
        assert all(d["id"] != doc_id for d in items)


# --- Settings ---

class TestSettings:
    def test_get_empty(self, client):
        res = client.get("/api/settings")
        assert res.status_code == 200
        assert res.json() == {}

    def test_save_and_get(self, client):
        client.put("/api/settings", json={"dueDate": "2026-10-15"})
        res = client.get("/api/settings")
        assert res.json()["dueDate"] == "2026-10-15"

    def test_upsert(self, client):
        client.put("/api/settings", json={"dueDate": "2026-10-15"})
        client.put("/api/settings", json={"dueDate": "2026-11-01"})
        res = client.get("/api/settings")
        assert res.json()["dueDate"] == "2026-11-01"


# --- Search ---

class TestSearch:
    def test_empty_query(self, client):
        res = client.get("/api/search")
        assert res.json() == {"calendar": [], "gallery": [], "documents": []}

    def test_find_notes(self, client):
        client.put("/api/calendar/2026-06-10", json={"todos": [], "note": "Week 20 checkup"})
        res = client.get("/api/search?q=checkup")
        assert len(res.json()["calendar"]) >= 1

    def test_find_todos(self, client):
        client.put("/api/calendar/2026-06-10", json={"todos": [{"text": "Ultrasound", "done": False}], "note": ""})
        res = client.get("/api/search?q=Ultrasound")
        assert len(res.json()["calendar"]) >= 1

    def test_find_documents(self, client):
        client.post("/api/documents", files=[("files", ("prenatal-report.pdf", b"x", "application/pdf"))])
        res = client.get("/api/search?q=prenatal")
        assert len(res.json()["documents"]) >= 1

    def test_no_match(self, client):
        res = client.get("/api/search?q=xyznonexistent")
        data = res.json()
        assert data["calendar"] == []
        assert data["gallery"] == []
        assert data["documents"] == []


# --- Backup ---

class TestBackup:
    def test_returns_zip(self, client):
        res = client.get("/api/backup")
        assert res.status_code == 200
        assert "application/zip" in res.headers["content-type"]
        assert ".zip" in res.headers["content-disposition"]
        assert len(res.content) > 0
