import os
from dataclasses import dataclass
from typing import List


@dataclass(frozen=True)
class Settings:
    app_name: str
    app_version: str
    api_prefix: str
    api_version_prefix: str
    allowed_origins: List[str]
    pg_host: str
    pg_user: str
    pg_port: int
    pg_database: str
    pg_password: str
    pg_sslmode: str = "require"
    jwt_secret: str = "change-me-in-production"
    jwt_expire_minutes: int = 60
    cookie_secure: bool = True


def _parse_csv(raw_value: str, default: str) -> List[str]:
    value = raw_value or default
    return [item.strip() for item in value.split(",") if item.strip()]


def get_settings() -> Settings:
    return Settings(
        app_name=os.getenv("APP_NAME", "FlightDeck APIs"),
        app_version=os.getenv("APP_VERSION", "1.0.0"),
        api_prefix=os.getenv("API_PREFIX", "/api"),
        api_version_prefix=os.getenv("API_VERSION_PREFIX", "/api/v1"),
        allowed_origins=_parse_csv(os.getenv("ALLOWED_ORIGINS", "*"), "*"),
        pg_host=os.getenv("PGHOST", ""),
        pg_user=os.getenv("PGUSER", ""),
        pg_port=int(os.getenv("PGPORT", "5432")),
        pg_database=os.getenv("PGDATABASE", ""),
        pg_password=os.getenv("PGPASSWORD", ""),
        pg_sslmode=os.getenv("PGSSLMODE", "require"),
        jwt_secret=os.getenv("JWT_SECRET", "change-me-in-production"),
        jwt_expire_minutes=int(os.getenv("JWT_EXPIRE_MINUTES", "60")),
        cookie_secure=os.getenv("COOKIE_SECURE", "true").lower() != "false",
    )
