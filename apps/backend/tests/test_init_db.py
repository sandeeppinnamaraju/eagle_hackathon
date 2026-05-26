from __future__ import annotations

import pytest

from eagle_hackathon.apps.backend.src.scripts import init_db


class FakeCursor:
    def __init__(self, exists_values):
        self.exists_values = list(exists_values)
        self.calls = 0

    def execute(self, _query, _params):
        self.calls += 1

    def fetchone(self):
        return (self.exists_values.pop(0),)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


class FakeConnection:
    def __init__(self, cursor: FakeCursor):
        self._cursor = cursor

    def cursor(self):
        return self._cursor

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


def test_run_db_init_check_all_tables_present(monkeypatch: pytest.MonkeyPatch) -> None:
    cursor = FakeCursor([True, True])
    monkeypatch.setattr(init_db, "get_conn_params", lambda: {"password": "x"})
    monkeypatch.setattr(init_db.psycopg2, "connect", lambda **_: FakeConnection(cursor))

    result = init_db.run_db_init_check()

    assert result["ok"] is True
    assert result["missing_tables"] == []
    assert result["checked_tables"] == init_db.REQUIRED_TABLES


def test_run_db_init_check_collects_missing_tables(monkeypatch: pytest.MonkeyPatch) -> None:
    cursor = FakeCursor([True, False])
    monkeypatch.setattr(init_db, "get_conn_params", lambda: {"password": "x"})
    monkeypatch.setattr(init_db.psycopg2, "connect", lambda **_: FakeConnection(cursor))

    result = init_db.run_db_init_check()

    assert result["ok"] is False
    assert result["missing_tables"] == ["protocols"]
