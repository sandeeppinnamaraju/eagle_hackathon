"""
Schema updater for PostgreSQL: aligns DB tables with the JSON schema definition.
- Adds missing columns
- Alters column types if possible
- Creates new tables if missing
- Does NOT drop columns or tables (safe for production)

Usage:
  python update_schema.py
"""

import json
import logging
import os
from pathlib import Path
from urllib.parse import quote_plus
from sqlalchemy import (
    Column, Float, Integer, MetaData, Table, Text, create_engine, inspect, text
)
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.types import NullType
from dotenv import load_dotenv

def to_sqlalchemy_type(dtype_name):
    if dtype_name == "int":
        return Integer
    if dtype_name == "float":
        return Float
    if dtype_name in {"str", "object"}:
        return Text
    return Text

SCRIPT_DIR = Path(__file__).resolve().parent
DATABASE_DIR = SCRIPT_DIR.parent
DATA_DIR = (DATABASE_DIR / "data").resolve()
SCHEMA_FILE = (DATA_DIR / "flightdeck-schema-definition.json").resolve()


def _load_env_files():
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


_load_env_files()

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
DATABASE_URL = (
    f"postgresql+psycopg2://{encoded_user}:{encoded_password}"
    f"@{values['PGHOST']}:{values['PGPORT']}/{values['PGDATABASE']}"
    f"?sslmode={ssl_mode}"
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
metadata = MetaData()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

def normalize_table_name(name):
    return name.strip().lower().replace(" ", "_").replace("-", "_")

def load_schema(schema_path):
    with open(schema_path, "r") as f:
        return json.load(f)

def get_existing_tables(engine):
    inspector = inspect(engine)
    return set(inspector.get_table_names())

def get_table_columns(engine, table_name):
    inspector = inspect(engine)
    return {col['name']: col for col in inspector.get_columns(table_name)}

def add_column(engine, table_name, col_name, col_type):
    sql_type = col_type().compile(engine.dialect)
    alter_sql = f'ALTER TABLE "{table_name}" ADD COLUMN "{col_name}" {sql_type};'
    with engine.begin() as conn:
        conn.execute(text(alter_sql))
    logging.info(f"Added column {col_name} to {table_name}")

def alter_column_type(engine, table_name, col_name, col_type):
    sql_type = col_type().compile(engine.dialect)
    alter_sql = f'ALTER TABLE "{table_name}" ALTER COLUMN "{col_name}" TYPE {sql_type} USING "{col_name}"::{sql_type};'
    with engine.begin() as conn:
        conn.execute(text(alter_sql))
    logging.info(f"Altered column {col_name} in {table_name} to type {sql_type}")

def create_table(engine, table_name, schema):
    cols = [Column(col, to_sqlalchemy_type(dtype), nullable=True) for col, dtype in schema["columns"].items()]
    tbl = Table(table_name, metadata, *cols)
    tbl.create(engine, checkfirst=True)
    logging.info(f"Created table: {table_name}")

def update_schema():
    if not SCHEMA_FILE.exists():
        raise FileNotFoundError(f"Schema file not found: {SCHEMA_FILE}")
    schema_def = load_schema(SCHEMA_FILE)
    existing_tables = get_existing_tables(engine)
    for sheet_name, schema in schema_def.items():
        table_name = normalize_table_name(sheet_name)
        if table_name not in existing_tables:
            create_table(engine, table_name, schema)
            continue
        # Table exists: check columns
        existing_cols = get_table_columns(engine, table_name)
        for col, dtype in schema["columns"].items():
            if col not in existing_cols:
                add_column(engine, table_name, col, to_sqlalchemy_type(dtype))
            else:
                # Check type
                existing_type = type(existing_cols[col]["type"])
                target_type = to_sqlalchemy_type(dtype)
                # Only alter if types are different and not NullType
                if (
                    existing_type != target_type
                    and not isinstance(existing_cols[col]["type"], NullType)
                ):
                    try:
                        alter_column_type(engine, table_name, col, target_type)
                    except Exception as e:
                        logging.warning(f"Could not alter type for {col} in {table_name}: {e}")
    logging.info("Schema update complete.")

if __name__ == "__main__":
    update_schema()
