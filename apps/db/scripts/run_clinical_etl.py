"""
Run the full ETL pipeline explicitly against the clinical study export xlsx.
"""
import json
import logging
import os
import sys
from pathlib import Path
from urllib.parse import quote_plus

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import (
    Column, Float, Integer, MetaData, PrimaryKeyConstraint,
    Table, Text, and_, create_engine, inspect, select,
)
from sqlalchemy.exc import SQLAlchemyError

SCRIPT_DIR = Path(__file__).resolve().parent
DATABASE_DIR = SCRIPT_DIR.parent
DATA_DIR = (DATABASE_DIR / "data").resolve()

# Explicitly pick the clinical study xlsx (not user_credentials)
clinical_candidates = [f for f in sorted(DATA_DIR.glob("*.xlsx"), key=lambda p: p.stat().st_mtime, reverse=True)
                       if "user_credentials" not in f.name]
if not clinical_candidates:
    raise FileNotFoundError("No clinical study Excel file found in data/")
EXCEL_FILE = clinical_candidates[0].resolve()
SCHEMA_FILE = (DATA_DIR / "flightdeck-schema-definition.json").resolve()

print(f"Using Excel file: {EXCEL_FILE}")

# Load env
for env_candidate in [DATABASE_DIR / ".env", DATABASE_DIR.parent / ".env", DATABASE_DIR.parent.parent / ".env"]:
    if env_candidate.exists():
        load_dotenv(dotenv_path=env_candidate, override=False)
        break

host = os.getenv("PGHOST"); user = os.getenv("PGUSER"); port = os.getenv("PGPORT", "5432")
db = os.getenv("PGDATABASE"); pw = os.getenv("PGPASSWORD"); ssl = os.getenv("PGSSLMODE", "require")
DATABASE_URL = f"postgresql+psycopg2://{quote_plus(user)}:{quote_plus(pw)}@{host}:{port}/{db}?sslmode={ssl}"
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
metadata = MetaData()

def normalize(name): return name.strip().lower().replace(" ", "_").replace("-", "_")
def to_type(t): return Integer if t == "int" else Float if t == "float" else Text
def infer_dtype(dtype):
    if pd.api.types.is_integer_dtype(dtype): return "int"
    if pd.api.types.is_float_dtype(dtype): return "float"
    return "str"

# Step 1: generate schema from clinical xlsx only
print("\n=== Step 1: Generate schema from clinical Excel ===")
all_sheets = pd.read_excel(EXCEL_FILE, sheet_name=None)
schema = {}
if SCHEMA_FILE.exists():
    with open(SCHEMA_FILE) as f:
        schema = json.load(f)
for sheet_name, df in all_sheets.items():
    cols = {col: infer_dtype(df[col].dtype) for col in df.columns}
    if sheet_name not in schema:
        schema[sheet_name] = {"columns": cols}
    else:
        schema[sheet_name]["columns"] = cols
with open(SCHEMA_FILE, "w") as f:
    json.dump(schema, f, indent=2)
print(f"Schema updated: {SCHEMA_FILE}")

# Step 2: create/update tables
print("\n=== Step 2: Update DB schema ===")
inspector = inspect(engine)
existing_tables = set(inspector.get_table_names())
for sheet_name, defn in schema.items():
    table_name = normalize(sheet_name)
    if table_name not in existing_tables:
        cols = [Column(col, to_type(dtype), nullable=True) for col, dtype in defn["columns"].items()]
        pk = defn.get("primary_keys", [])
        tbl = Table(table_name, metadata, *cols)
        if pk:
            tbl.append_constraint(PrimaryKeyConstraint(*pk, name=f"pk_{table_name}"))
        tbl.create(engine, checkfirst=True)
        print(f"  Created table: {table_name}")
    else:
        print(f"  Table exists: {table_name}")

# Step 3: load data
print("\n=== Step 3: Load data from clinical Excel ===")
for sheet_name, df in all_sheets.items():
    table_name = normalize(sheet_name)
    defn = schema.get(sheet_name, {})
    pk_cols = defn.get("primary_keys", [])
    expected_cols = list(defn.get("columns", {}).keys())
    df = df.copy()
    for col in expected_cols:
        if col not in df.columns:
            df[col] = None
    df = df[expected_cols]
    df = df.where(pd.notna(df), None)

    upserted = failed = 0
    tbl = Table(table_name, metadata, autoload_with=engine)

    if not pk_cols:
        for _, row in df.iterrows():
            row_dict = row.where(pd.notna(row), None).to_dict()
            try:
                with engine.begin() as conn:
                    conn.execute(tbl.insert().values(**row_dict))
                upserted += 1
            except SQLAlchemyError as e:
                failed += 1
        print(f"  {table_name}: Inserted {upserted}, Failed {failed}")
        continue

    for _, row in df.iterrows():
        row_dict = row.where(pd.notna(row), None).to_dict()
        if all(row_dict.get(pk) is not None for pk in pk_cols):
            try:
                tbl2 = Table(table_name, MetaData(), autoload_with=engine)
                pk_filter = [getattr(tbl2.c, col) == row_dict[col] for col in pk_cols]
                with engine.begin() as conn:
                    existing = conn.execute(select(tbl2).where(and_(*pk_filter)).limit(1)).first()
                    if existing:
                        update_vals = {c: v for c, v in row_dict.items() if c not in pk_cols}
                        if update_vals:
                            conn.execute(tbl2.update().where(and_(*pk_filter)).values(**update_vals))
                    else:
                        conn.execute(tbl2.insert().values(**row_dict))
                upserted += 1
            except SQLAlchemyError as e:
                failed += 1
        else:
            failed += 1
    print(f"  {table_name}: Upserted {upserted}, Failed {failed}")

print("\nETL pipeline completed successfully.")
