"""
Load login records from Excel into PostgreSQL public.login_details.

Passwords are bcrypt-hashed before insert/update so plaintext is never stored.
"""

from __future__ import annotations

import argparse
import logging
import os
from pathlib import Path
from urllib.parse import quote_plus

import bcrypt
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import MetaData, Table, create_engine, select


SCRIPT_DIR = Path(__file__).resolve().parent
DATABASE_DIR = SCRIPT_DIR.parent
DATA_DIR = (DATABASE_DIR / "data").resolve()
DEFAULT_EXCEL_FILE = (DATA_DIR / "user_credentials.xlsx").resolve()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


def _load_env_files() -> None:
    env_candidates = []
    for candidate in [
        (DATABASE_DIR / ".env").resolve(),
        (DATABASE_DIR.parent / "database" / ".env").resolve(),
        (DATABASE_DIR.parent / ".env").resolve(),
        (DATABASE_DIR.parent.parent / ".env").resolve(),
    ]:
        if candidate not in env_candidates:
            env_candidates.append(candidate)

    for env_file in env_candidates:
        if env_file.exists():
            load_dotenv(dotenv_path=env_file, override=False)


def _build_database_url() -> str:
    required = ["PGHOST", "PGUSER", "PGPORT", "PGDATABASE", "PGPASSWORD"]
    values = {key: os.getenv(key) for key in required}
    ssl_mode = os.getenv("PGSSLMODE", "require")
    missing = [key for key, value in values.items() if not value]
    if missing:
        raise RuntimeError(
            "Missing required environment variables: "
            f"{', '.join(missing)}. Set them in a .env file or shell environment."
        )

    encoded_user = quote_plus(values["PGUSER"])
    encoded_password = quote_plus(values["PGPASSWORD"])
    return (
        f"postgresql+psycopg2://{encoded_user}:{encoded_password}"
        f"@{values['PGHOST']}:{values['PGPORT']}/{values['PGDATABASE']}"
        f"?sslmode={ssl_mode}"
    )


def _normalize_excel_columns(df: pd.DataFrame) -> pd.DataFrame:
    renamed = {col: str(col).strip().lower() for col in df.columns}
    normalized = df.rename(columns=renamed)
    required = {"username", "password", "role"}
    missing = required - set(normalized.columns)
    if missing:
        raise RuntimeError(
            "Excel file is missing required column(s): "
            f"{', '.join(sorted(missing))}. Expected username, password, role."
        )
    return normalized[["username", "password", "role"]]


def _resolve_table_columns(table: Table) -> tuple[str, str, str]:
    existing = {col.name for col in table.columns}

    def pick(candidates: list[str]) -> str | None:
        for name in candidates:
            if name in existing:
                return name
        return None

    username_col = pick(["username", "user_name"])
    password_col = pick(["password_hash", "password"])
    role_col = pick(["role", "user_role"])

    if not username_col or not password_col or not role_col:
        raise RuntimeError(
            "Could not map required table columns in public.login_details. "
            f"Found columns: {', '.join(sorted(existing))}. "
            "Need username/user_name, password_hash/password, and role/user_role."
        )

    return username_col, password_col, role_col


def load_login_details(excel_file: Path, schema: str, table_name: str, bcrypt_rounds: int) -> None:
    if not excel_file.exists():
        raise FileNotFoundError(f"Excel file not found: {excel_file}")

    _load_env_files()
    engine = create_engine(_build_database_url(), pool_pre_ping=True)

    dataframe = pd.read_excel(excel_file)
    dataframe = _normalize_excel_columns(dataframe)
    dataframe = dataframe.where(pd.notna(dataframe), None)

    metadata = MetaData(schema=schema)
    login_table = Table(table_name, metadata, autoload_with=engine, schema=schema)
    username_col, password_col, role_col = _resolve_table_columns(login_table)

    inserted = 0
    updated = 0
    skipped = 0

    with engine.begin() as conn:
        for row in dataframe.to_dict(orient="records"):
            username = str(row["username"]).strip() if row["username"] is not None else ""
            password = str(row["password"]) if row["password"] is not None else ""
            role = str(row["role"]).strip() if row["role"] is not None else ""

            if not username or not password or not role:
                skipped += 1
                logging.warning("Skipping row with missing username/password/role: %s", row)
                continue

            password_hash = bcrypt.hashpw(
                password.encode("utf-8"), bcrypt.gensalt(rounds=bcrypt_rounds)
            ).decode("utf-8")

            exists_stmt = (
                select(login_table.c[username_col])
                .where(login_table.c[username_col] == username)
                .limit(1)
            )
            exists = conn.execute(exists_stmt).first() is not None

            if exists:
                update_stmt = (
                    login_table.update()
                    .where(login_table.c[username_col] == username)
                    .values(**{password_col: password_hash, role_col: role})
                )
                conn.execute(update_stmt)
                updated += 1
            else:
                insert_values = {
                    username_col: username,
                    password_col: password_hash,
                    role_col: role,
                }
                conn.execute(login_table.insert().values(**insert_values))
                inserted += 1

    logging.info(
        "Completed load for %s.%s from %s | inserted=%s updated=%s skipped=%s",
        schema,
        table_name,
        excel_file,
        inserted,
        updated,
        skipped,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Load users from Excel into PostgreSQL login_details with bcrypt-hashed passwords."
    )
    parser.add_argument(
        "--excel",
        default=str(DEFAULT_EXCEL_FILE),
        help="Path to the Excel file containing username, password, role columns.",
    )
    parser.add_argument("--schema", default="public", help="Target PostgreSQL schema.")
    parser.add_argument("--table", default="login_details", help="Target PostgreSQL table name.")
    parser.add_argument(
        "--bcrypt-rounds",
        type=int,
        default=12,
        help="bcrypt cost factor (default: 12).",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    load_login_details(
        excel_file=Path(args.excel).resolve(),
        schema=args.schema,
        table_name=args.table,
        bcrypt_rounds=args.bcrypt_rounds,
    )