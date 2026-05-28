"""Tests for tokenless auth router login endpoint."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from eagle_hackathon.apps.backend.src.routers import fd_auth as auth_router


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_client() -> TestClient:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from eagle_hackathon.apps.backend.src.routers.fd_auth import router

    app = FastAPI()
    app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
    app.include_router(router, prefix="/api")
    return TestClient(app, raise_server_exceptions=True)


def test_login_success(monkeypatch: pytest.MonkeyPatch) -> None:
    import bcrypt

    hashed = bcrypt.hashpw(b"FD_hack@user1", bcrypt.gensalt()).decode()
    monkeypatch.setattr(auth_router, "_fetch_user", lambda u: ("eagle_user1", hashed, "user"))

    client = _make_client()
    resp = client.post("/api/auth/login", json={"username": "eagle_user1", "password": "FD_hack@user1"})

    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["username"] == "eagle_user1"
    assert body["role"] == "user"


def test_login_wrong_password(monkeypatch: pytest.MonkeyPatch) -> None:
    import bcrypt

    hashed = bcrypt.hashpw(b"correct-password", bcrypt.gensalt()).decode()
    monkeypatch.setattr(auth_router, "_fetch_user", lambda u: ("eagle_user1", hashed, "user"))

    client = _make_client()
    resp = client.post("/api/auth/login", json={"username": "eagle_user1", "password": "wrong-password"})

    assert resp.status_code == 401
    assert resp.json()["detail"] == "Invalid username or password"


def test_login_unknown_user(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(auth_router, "_fetch_user", lambda u: None)

    client = _make_client()
    resp = client.post("/api/auth/login", json={"username": "ghost", "password": "any"})

    assert resp.status_code == 401


def test_login_db_error(monkeypatch: pytest.MonkeyPatch) -> None:
    from fastapi import HTTPException

    def raise_error(u):
        raise HTTPException(status_code=500, detail="Database error")

    monkeypatch.setattr(auth_router, "_fetch_user", raise_error)

    client = _make_client()
    resp = client.post("/api/auth/login", json={"username": "eagle_user1", "password": "any"})

    assert resp.status_code == 500
