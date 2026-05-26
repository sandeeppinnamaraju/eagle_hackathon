from __future__ import annotations

from fastapi import HTTPException
from fastapi.responses import JSONResponse
import pytest

from eagle_hackathon.apps.backend.src.routers import fd_study_protocol as study_router


class FakeCursor:
    def __init__(self, fetchone_values=None, fetchall_values=None):
        self.fetchone_values = list(fetchone_values or [])
        self.fetchall_values = list(fetchall_values or [])
        self.executed = []

    def execute(self, query, params=None):
        self.executed.append((query, params))

    def fetchone(self):
        return self.fetchone_values.pop(0)

    def fetchall(self):
        return self.fetchall_values.pop(0)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


class FakeConnection:
    def __init__(self, cursor: FakeCursor | None = None):
        self._cursor = cursor or FakeCursor()

    def cursor(self):
        return self._cursor

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


def test_get_studies_rejects_invalid_page_limit() -> None:
    response = study_router.get_studies(page="0", limit="10")
    assert isinstance(response, JSONResponse)
    assert response.status_code == 400


def test_get_studies_rejects_invalid_status() -> None:
    response = study_router.get_studies(page="1", limit="10", status="Unknown")
    assert isinstance(response, JSONResponse)
    assert response.status_code == 400


def test_get_studies_returns_500_on_unexpected_db_error(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(study_router, "get_conn_params", lambda: {"password": "x"})
    monkeypatch.setattr(study_router, "_parse_flexible_date", lambda *_args, **_kwargs: None)
    monkeypatch.setattr(study_router, "_build_common_study_filters", lambda **_kwargs: ([], []))

    def fake_connect(**_kwargs):
        raise RuntimeError("db unavailable")

    monkeypatch.setattr(study_router.psycopg2, "connect", fake_connect)

    response = study_router.get_studies(
        page="1",
        limit="10",
        search=None,
        therapeutic_area=None,
        phase=None,
        status=None,
        portfolio=None,
        program=None,
        region=None,
        fpi_start_date_raw=None,
        fpi_end_date_raw=None,
        lpo_start_date_raw=None,
        lpo_end_date_raw=None,
        sort_by="id",
        sort_order="asc",
    )

    assert isinstance(response, JSONResponse)
    assert response.status_code == 500


def test_health_raises_when_password_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(study_router, "get_conn_params", lambda: {"password": ""})

    with pytest.raises(HTTPException) as exc_info:
        study_router.health()

    assert exc_info.value.status_code == 500


def test_db_version_success(monkeypatch: pytest.MonkeyPatch) -> None:
    cursor = FakeCursor(fetchone_values=[("PostgreSQL 16",)])
    monkeypatch.setattr(study_router, "get_conn_params", lambda: {"password": "x"})
    monkeypatch.setattr(study_router.psycopg2, "connect", lambda **_: FakeConnection(cursor))

    result = study_router.db_version()

    assert result == {"version": "PostgreSQL 16"}


def test_get_kpi_details_rejects_invalid_date() -> None:
    response = study_router.get_kpi_details(fpi_start_date_raw="not-a-date")
    assert isinstance(response, JSONResponse)
    assert response.status_code == 400
