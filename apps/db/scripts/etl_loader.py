"""
Production-ready ETL loader for Excel to PostgreSQL with schema validation, modularity, and safe upserts.
"""

import json
import logging
import os
from pathlib import Path
from urllib.parse import quote_plus

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import (
    Column,
    Float,
    Integer,
    MetaData,
    PrimaryKeyConstraint,
    Table,
    Text,
    create_engine,
    inspect,
    select,
)
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import SQLAlchemyError

# ========== CONFIG & LOGGING ==========


SCRIPT_DIR = Path(__file__).resolve().parent
DATABASE_DIR = SCRIPT_DIR.parent

# Prefer apps/db/data; keep legacy fallbacks for older layouts.
PRIMARY_DATA_DIR = (DATABASE_DIR / "data").resolve()
LEGACY_SCRIPT_DATA_DIR = (SCRIPT_DIR / "data").resolve()
LEGACY_DATABASE_DATA_DIR = (DATABASE_DIR.parent / "database" / "data").resolve()

if PRIMARY_DATA_DIR.exists() or (
    not LEGACY_SCRIPT_DATA_DIR.exists() and not LEGACY_DATABASE_DATA_DIR.exists()
):
    DATA_DIR = PRIMARY_DATA_DIR
elif LEGACY_SCRIPT_DATA_DIR.exists():
    DATA_DIR = LEGACY_SCRIPT_DATA_DIR
else:
    DATA_DIR = LEGACY_DATABASE_DATA_DIR

DATA_DIR.mkdir(parents=True, exist_ok=True)

SCHEMA_FILE = (DATA_DIR / "flightdeck-schema-definition.json").resolve()

# Use the first xlsx found in data directory. This avoids hardcoding timestamped filenames.
excel_candidates = sorted(DATA_DIR.glob("*.xlsx"))
EXCEL_FILE = excel_candidates[0].resolve() if excel_candidates else (DATA_DIR / "clinical_study_export.xlsx").resolve()

LOG_FILE = (DATA_DIR / "etl_loader.log").resolve()

logging.basicConfig(
    filename=str(LOG_FILE),
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s"
)

ENV_PATH = (SCRIPT_DIR.parent / ".env").resolve()


def _load_env_files():
    env_candidates = []
    for candidate in [
        (DATABASE_DIR / ".env").resolve(),
        (DATABASE_DIR.parent / "database" / ".env").resolve(),
        (DATABASE_DIR.parent / ".env").resolve(),
        (DATABASE_DIR.parent.parent / ".env").resolve(),
        ENV_PATH,
    ]:
        if candidate not in env_candidates:
            env_candidates.append(candidate)
    loaded_any = False
    for env_file in env_candidates:
        if env_file.exists():
            load_dotenv(dotenv_path=env_file, override=False)
            loaded_any = True
    if not loaded_any:
        log_message = (
            "No .env file found in expected locations: "
            f"{', '.join(str(p) for p in env_candidates)}"
        )
        print(log_message)
        logging.warning(log_message)


def _build_database_url():
    required = ["PGHOST", "PGUSER", "PGPORT", "PGDATABASE", "PGPASSWORD"]
    values = {key: os.getenv(key) for key in required}
    ssl_mode = os.getenv("PGSSLMODE", "require")
    missing = [key for key, value in values.items() if not value]
    if missing:
        raise RuntimeError(
            "Missing required environment variables: "
            f"{', '.join(missing)}. Set them in a .env file or shell environment."
        )

    try:
        int(values["PGPORT"])
    except ValueError as exc:
        raise RuntimeError("PGPORT must be a valid integer.") from exc

    encoded_password = quote_plus(values["PGPASSWORD"])
    return (
        f"postgresql+psycopg2://{values['PGUSER']}:{encoded_password}"
        f"@{values['PGHOST']}:{values['PGPORT']}/{values['PGDATABASE']}"
        f"?sslmode={ssl_mode}"
    )


_load_env_files()
DATABASE_URL = _build_database_url()
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
metadata = MetaData()

# ========== UTILS ==========
def normalize_table_name(name):
    return (
        name.strip().lower().replace(" ", "_").replace("-", "_")
    )

def to_sqlalchemy_type(dtype_name):
    if dtype_name == "int":
        return Integer
    if dtype_name == "float":
        return Float
    if dtype_name in {"str", "object"}:
        return Text
    return Text

def log_and_print(msg, level="info"):
    print(msg)
    getattr(logging, level)(msg)

# ========== SCHEMA VALIDATION ==========
def load_schema(schema_path):
    with open(schema_path, "r") as f:
        return json.load(f)

def get_existing_tables(engine):
    inspector = inspect(engine)
    return set(inspector.get_table_names())

def get_table_columns(engine, table_name):
    inspector = inspect(engine)
    return {col['name']: col for col in inspector.get_columns(table_name)}

def validate_table_schema(engine, table_name, schema):
    existing_cols = get_table_columns(engine, table_name)
    schema_cols = schema["columns"]
    mismatches = []
    for col, dtype in schema_cols.items():
        if col not in existing_cols:
            mismatches.append(f"Missing column: {col}")
        # Type check can be added here if needed
    for col in existing_cols:
        if col not in schema_cols:
            mismatches.append(f"Extra column: {col}")
    return mismatches

def create_table(engine, table_name, schema):
    cols = [Column(col, to_sqlalchemy_type(dtype), nullable=True) for col, dtype in schema["columns"].items()]
    pk = schema.get("primary_keys", [])
    tbl = Table(table_name, metadata, *cols)
    if pk:
        tbl.append_constraint(PrimaryKeyConstraint(*pk, name=f"pk_{table_name}"))
    tbl.create(engine, checkfirst=True)
    log_and_print(f"Created table: {table_name}")


# ========== EXTRACT ==========
def extract_excel_sheets(excel_file):
    """Extract: Read all sheets from the Excel file."""
    log_and_print(f"Extracting data from Excel: {excel_file}")
    return pd.read_excel(excel_file, sheet_name=None)

# ========== TRANSFORM ==========
def transform_dataframe(df, schema):
    """Transform: Clean and align DataFrame columns/types to schema."""
    expected_columns = list(schema["columns"].keys())
    df = df.copy()
    for col in expected_columns:
        if col not in df.columns:
            df[col] = None
    df = df[expected_columns]
    df = df.where(pd.notna(df), None)
    # Optionally: add more type conversions here
    return df

# ========== LOAD ==========
def row_exists(engine, table_name, pk_cols, row):
    tbl = Table(table_name, metadata, autoload_with=engine)
    pk_filter = [getattr(tbl.c, col) == row[col] for col in pk_cols]
    stmt = select(tbl).where(*pk_filter)
    with engine.connect() as conn:
        result = conn.execute(stmt).first()
        return result is not None


def upsert_row(engine, table_name, row, pk_cols):
    tbl = Table(table_name, metadata, autoload_with=engine)
    stmt = pg_insert(tbl).values(**row)
    if pk_cols:
        update_cols = {col: stmt.excluded[col] for col in row if col not in pk_cols}
        stmt = stmt.on_conflict_do_update(
            index_elements=pk_cols,
            set_=update_cols
        )
    with engine.begin() as conn:
        conn.execute(stmt)

def load_table(engine, sheet_name, schema, df):
    """Load: Upsert rows into the database (insert or update on PK conflict)."""
    table_name = normalize_table_name(sheet_name)
    pk_cols = schema.get("primary_keys", [])
    upserted, failed = 0, 0
    for _, row in df.iterrows():
        row_dict = row.where(pd.notna(row), None).to_dict()
        if pk_cols and all(row_dict.get(pk) is not None for pk in pk_cols):
            try:
                upsert_row(engine, table_name, row_dict, pk_cols)
                upserted += 1
            except SQLAlchemyError as e:
                log_and_print(f"Failed to upsert row in {table_name}: {e}", level="error")
                failed += 1
        else:
            log_and_print(f"Missing PK in row for {table_name}: {row_dict}", level="warning")
            failed += 1
    log_and_print(f"{table_name}: Upserted {upserted}, Failed {failed}")

# ========== MAIN ETL ==========

def main():
    if not SCHEMA_FILE.exists():
        raise FileNotFoundError(f"Schema file not found: {SCHEMA_FILE}")
    if not EXCEL_FILE.exists():
        raise FileNotFoundError(
            f"Excel file not found in {DATA_DIR}. Add an .xlsx file before running ETL."
        )

    schema_def = load_schema(SCHEMA_FILE)
    existing_tables = get_existing_tables(engine)
    # Schema check and table creation
    for sheet_name, schema in schema_def.items():
        table_name = normalize_table_name(sheet_name)
        if table_name not in existing_tables:
            create_table(engine, table_name, schema)
        else:
            mismatches = validate_table_schema(engine, table_name, schema)
            if mismatches:
                log_and_print(f"Schema mismatch for {table_name}: {mismatches}", level="error")
                continue

    # EXTRACT
    all_sheets = extract_excel_sheets(EXCEL_FILE)
    for sheet_name, df in all_sheets.items():
        if sheet_name not in schema_def:
            log_and_print(f"Sheet {sheet_name} not in schema, skipping", level="warning")
            continue

        # TRANSFORM
        transformed_df = transform_dataframe(df, schema_def[sheet_name])
        
        # LOAD
        load_table(engine, sheet_name, schema_def[sheet_name], transformed_df)
    log_and_print("ETL process completed.")

if __name__ == "__main__":
    main()
