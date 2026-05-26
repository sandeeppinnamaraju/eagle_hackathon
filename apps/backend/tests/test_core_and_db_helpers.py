from __future__ import annotations

from pathlib import Path
import pytest

from eagle_hackathon.apps.backend.src.core import config
from eagle_hackathon.apps.backend.src.db import connection
from eagle_hackathon.apps.backend.src import load_env


def test_parse_csv_uses_default() -> None:
    assert config._parse_csv("", "a,b") == ["a", "b"]


def test_get_settings_reads_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_NAME", "Test App")
    monkeypatch.setenv("APP_VERSION", "2.0")
    monkeypatch.setenv("API_PREFIX", "/api")
    monkeypatch.setenv("API_VERSION_PREFIX", "/api/v1")
    monkeypatch.setenv("ALLOWED_ORIGINS", "https://a.com, https://b.com")
    monkeypatch.setenv("PGHOST", "db-host")
    monkeypatch.setenv("PGUSER", "db-user")
    monkeypatch.setenv("PGPORT", "5433")
    monkeypatch.setenv("PGDATABASE", "db-name")
    monkeypatch.setenv("PGPASSWORD", "secret")
    monkeypatch.setenv("PGSSLMODE", "disable")

    settings = config.get_settings()

    assert settings.app_name == "Test App"
    assert settings.allowed_origins == ["https://a.com", "https://b.com"]
    assert settings.pg_port == 5433
    assert settings.pg_sslmode == "disable"


def test_load_backend_env_returns_apps_env_path() -> None:
    env_path = load_env.load_backend_env()
    assert isinstance(env_path, Path)
    assert env_path.name == ".env"
    assert env_path.parent.name == "apps"


def test_get_conn_params_maps_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        connection,
        "get_settings",
        lambda: config.Settings(
            app_name="x",
            app_version="1",
            api_prefix="/api",
            api_version_prefix="/api/v1",
            allowed_origins=["*"],
            pg_host="h",
            pg_user="u",
            pg_port=5432,
            pg_database="d",
            pg_password="p",
            pg_sslmode="require",
        ),
    )

    params = connection.get_conn_params()

    assert params == {
        "host": "h",
        "user": "u",
        "port": 5432,
        "database": "d",
        "password": "p",
        "sslmode": "require",
    }


def test_get_db_connection_calls_psycopg2(monkeypatch: pytest.MonkeyPatch) -> None:
    called = {}

    monkeypatch.setattr(connection, "get_conn_params", lambda: {"host": "h"})

    def fake_connect(**kwargs):
        called["kwargs"] = kwargs
        return "conn"

    monkeypatch.setattr(connection.psycopg2, "connect", fake_connect)

    result = connection.get_db_connection()

    assert result == "conn"
    assert called["kwargs"] == {"host": "h"}
