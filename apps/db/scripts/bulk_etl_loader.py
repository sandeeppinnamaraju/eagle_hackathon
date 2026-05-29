"""
Fast bulk ETL loader - uses DataFrame.to_sql with bulk insert instead of row-by-row.
"""
import json
import os
from pathlib import Path
from urllib.parse import quote_plus

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

SCRIPT_DIR = Path(__file__).resolve().parent
DATABASE_DIR = SCRIPT_DIR.parent
DATA_DIR = (DATABASE_DIR / "data").resolve()
SCHEMA_FILE = (DATA_DIR / "flightdeck-schema-definition.json").resolve()

# Pick clinical xlsx only (not user_credentials)
clinical_candidates = [
    f for f in sorted(DATA_DIR.glob("*.xlsx"), key=lambda p: p.stat().st_mtime, reverse=True)
    if "user_credentials" not in f.name
]
if not clinical_candidates:
    raise FileNotFoundError("No clinical study Excel file found in data/")
EXCEL_FILE = clinical_candidates[0].resolve()
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

def normalize(name):
    return name.strip().lower().replace(" ", "_").replace("-", "_")

print("\n=== Reading Excel sheets ===")
import openpyxl
wb = openpyxl.load_workbook(EXCEL_FILE, read_only=True, data_only=True)
sheet_names = wb.sheetnames
wb.close()
print(f"Found {len(sheet_names)} sheets: {sheet_names}")

print("\n=== Bulk loading tables ===")
for sheet_name in sheet_names:
    table_name = normalize(sheet_name)
    df = pd.read_excel(EXCEL_FILE, sheet_name=sheet_name)
    df.columns = [c.strip().lower().replace(" ", "_").replace("-", "_") for c in df.columns]
    df = df.where(pd.notna(df), None)
    try:
        # Truncate then bulk insert
        with engine.begin() as conn:
            conn.execute(text(f'TRUNCATE TABLE public."{table_name}" RESTART IDENTITY CASCADE'))
        df.to_sql(table_name, engine, schema="public", if_exists="append", index=False, method="multi", chunksize=1000)
        print(f"  {table_name}: {len(df)} rows loaded")
    except Exception as e:
        print(f"  {table_name}: ERROR - {e}")

print("\nBulk ETL completed.")
