"""Tests for Pregnancy Guardian API (normalized schema)."""

import os
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def setup_test_env(monkeypatch, tmp_path):
    db_path = tmp_path / "test.sqlite"
    uploads_dir = tmp_path / "uploads"
    uploads_dir.mkdir()

    import server.app as app_module
    monkeypatch.setattr(app_module, "DB_PATH", db_path)
    monkeypatch.setattr(app_module, "UPLOADS_DIR", uploads_dir)
    app_module.init_db()
    for route in list(app_module.app.routes):
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


class TestEvents:
    def test_create(self, client):
        res = client.post("/api/events", json={"date": "2026-05-01", "text": "Buy vitamins", "time": "09:00"})
        assert res.status_code == 200
        assert res.json()["text"] == "Buy vitamins"
        assert res.json()["time"] == "09:00"
        assert "id" in res.json()

    def test_update(self, client):
        event = client.post("/api/events", json={"date": "2026-05-01", "text": "Test"}).json()
        client.put(f"/api/events/{event['id']}", json={"text": "Updated", "time": "14:30"})
        day = client.get("/api/calendar/2026-05-01").json()
        assert day["events"][0]["text"] == "Updated"
        assert day["events"][0]["time"] == "14:30"

    def test_delete(self, client):
        event = client.post("/api/events", json={"date": "2026-05-01", "text": "Del"}).json()
        client.delete(f"/api/events/{event['id']}")
        day = client.get("/api/calendar/2026-05-01").json()
        assert len(day["events"]) == 0


class TestDiet:
    def test_save_and_get(self, client):
        client.put("/api/diet/2026-05-01/breakfast", json={"name": "Oatmeal", "instructions": "With berries"})
        day = client.get("/api/calendar/2026-05-01").json()
        assert day["diet"]["breakfast"]["name"] == "Oatmeal"
        assert day["diet"]["breakfast"]["instructions"] == "With berries"

    def test_upsert(self, client):
        client.put("/api/diet/2026-05-01/lunch", json={"name": "Salad", "instructions": ""})
        client.put("/api/diet/2026-05-01/lunch", json={"name": "Soup", "instructions": "Warm"})
        day = client.get("/api/calendar/2026-05-01").json()
        assert day["diet"]["lunch"]["name"] == "Soup"


class TestMonitor:
    def test_save_and_get(self, client):
        client.put("/api/monitor/2026-05-01/weight", json={"value": "62.5"})
        day = client.get("/api/calendar/2026-05-01").json()
        assert day["monitor"]["weight"]["value"] == "62.5"

    def test_upsert(self, client):
        client.put("/api/monitor/2026-05-01/heartRate", json={"value": "75"})
        client.put("/api/monitor/2026-05-01/heartRate", json={"value": "80"})
        day = client.get("/api/calendar/2026-05-01").json()
        assert day["monitor"]["heartRate"]["value"] == "80"


class TestExercises:
    def test_create(self, client):
        res = client.post("/api/exercises", json={"date": "2026-05-01", "activity": "Walking", "steps": 5000, "duration": 30})
        assert res.status_code == 200
        assert "id" in res.json()

    def test_list(self, client):
        client.post("/api/exercises", json={"date": "2026-05-01", "activity": "Yoga", "steps": 0, "duration": 20})
        client.post("/api/exercises", json={"date": "2026-05-01", "activity": "Walking", "steps": 3000, "duration": 25})
        day = client.get("/api/calendar/2026-05-01").json()
        assert len(day["exercises"]) == 2

    def test_delete(self, client):
        ex = client.post("/api/exercises", json={"date": "2026-05-01", "activity": "Run", "steps": 0, "duration": 10}).json()
        client.delete(f"/api/exercises/{ex['id']}")
        day = client.get("/api/calendar/2026-05-01").json()
        assert len(day["exercises"]) == 0


class TestCalendar:
    def test_get_empty(self, client):
        res = client.get("/api/calendar")
        assert res.status_code == 200
        assert res.json() == {}

    def test_aggregated_view(self, client):
        client.post("/api/events", json={"date": "2026-05-01", "text": "Task"})
        client.put("/api/diet/2026-05-01/breakfast", json={"name": "Eggs", "instructions": ""})
        client.put("/api/monitor/2026-05-01/weight", json={"value": "60"})
        client.post("/api/exercises", json={"date": "2026-05-01", "activity": "Walk", "steps": 1000, "duration": 15})
        data = client.get("/api/calendar").json()
        assert "2026-05-01" in data
        assert len(data["2026-05-01"]["events"]) == 1
        assert "breakfast" in data["2026-05-01"]["diet"]
        assert "weight" in data["2026-05-01"]["monitor"]
        assert len(data["2026-05-01"]["exercises"]) == 1


class TestGallery:
    def test_upload_and_list(self, client):
        res = client.post("/api/gallery", files=[("photos", ("test.jpg", b"img", "image/jpeg"))])
        assert len(res.json()) == 1
        items = client.get("/api/gallery").json()
        assert len(items) == 1

    def test_delete(self, client):
        photo = client.post("/api/gallery", files=[("photos", ("del.jpg", b"x", "image/jpeg"))]).json()[0]
        client.delete(f"/api/gallery/{photo['id']}")
        assert client.get("/api/gallery").json() == []


class TestDocuments:
    def test_upload_and_list(self, client):
        res = client.post("/api/documents", files=[("files", ("report.pdf", b"pdf", "application/pdf"))])
        assert len(res.json()) == 1
        assert res.json()[0]["size"] == 3
        items = client.get("/api/documents").json()
        assert len(items) == 1

    def test_delete(self, client):
        doc = client.post("/api/documents", files=[("files", ("del.pdf", b"x", "application/pdf"))]).json()[0]
        client.delete(f"/api/documents/{doc['id']}")
        assert client.get("/api/documents").json() == []


class TestSettings:
    def test_save_and_get(self, client):
        client.put("/api/settings", json={"dueDate": "2026-10-15"})
        assert client.get("/api/settings").json()["dueDate"] == "2026-10-15"


class TestSearch:
    def test_find_events(self, client):
        client.post("/api/events", json={"date": "2026-05-01", "text": "Ultrasound appointment"})
        res = client.get("/api/search?q=Ultrasound")
        assert len(res.json()["calendar"]) >= 1

    def test_find_diet(self, client):
        client.put("/api/diet/2026-05-01/lunch", json={"name": "Salmon salad", "instructions": ""})
        res = client.get("/api/search?q=salmon")
        assert len(res.json()["calendar"]) >= 1

    def test_no_match(self, client):
        res = client.get("/api/search?q=xyznonexistent")
        assert res.json() == {"calendar": [], "gallery": [], "documents": []}


class TestDiary:
    def test_save_and_get(self, client):
        client.put("/api/diary/2026-05-13", json={"content": "Feeling great today!"})
        day = client.get("/api/calendar/2026-05-13").json()
        assert day["diary"] == "Feeling great today!"

    def test_upsert(self, client):
        client.put("/api/diary/2026-05-13", json={"content": "First entry"})
        client.put("/api/diary/2026-05-13", json={"content": "Updated entry"})
        day = client.get("/api/calendar/2026-05-13").json()
        assert day["diary"] == "Updated entry"

    def test_empty(self, client):
        day = client.get("/api/calendar/2026-05-13").json()
        assert day.get("diary", "") == ""


class TestBackup:
    def test_returns_zip(self, client):
        res = client.get("/api/backup")
        assert res.status_code == 200
        assert "application/zip" in res.headers["content-type"]
