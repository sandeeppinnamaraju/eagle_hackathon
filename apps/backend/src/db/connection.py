import psycopg2

from eagle_hackathon.apps.backend.src.core.config import get_settings


def get_conn_params() -> dict:
    settings = get_settings()
    return {
        "host": settings.pg_host,
        "user": settings.pg_user,
        "port": settings.pg_port,
        "database": settings.pg_database,
        "password": settings.pg_password,
        "sslmode": settings.pg_sslmode,
    }


def get_db_connection():
    return psycopg2.connect(**get_conn_params())
