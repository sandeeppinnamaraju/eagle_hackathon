import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv
from pathlib import Path
from urllib.parse import quote_plus
import os

# =========================================
# LOAD ENVIRONMENT VARIABLES
# =========================================

BASE_DIR = Path(__file__).resolve().parent.parent

env_path = BASE_DIR / ".env"

load_dotenv(dotenv_path=env_path)

# =========================================
# DATABASE CONFIG
# =========================================

PGHOST = os.getenv("PGHOST")
PGUSER = os.getenv("PGUSER")
PGPORT = os.getenv("PGPORT")
PGDATABASE = os.getenv("PGDATABASE")
PGPASSWORD = os.getenv("PGPASSWORD")

encoded_password = quote_plus(PGPASSWORD)

DATABASE_URL = (
    f"postgresql+psycopg2://{PGUSER}:{encoded_password}"
    f"@{PGHOST}:{PGPORT}/{PGDATABASE}"
)

# =========================================
# CREATE DATABASE ENGINE
# =========================================

print("\nCreating database engine...\n")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

# =========================================
# EXCEL FILE PATH
# =========================================

excel_file = "data/clinical_study_export_20260520_231947.xlsx"

print("Looking for Excel file:")
print(excel_file)

# =========================================
# READ ALL SHEETS
# =========================================

print("\nReading all Excel sheets...\n")

all_sheets = pd.read_excel(
    excel_file,
    sheet_name=None
)

print("Sheets found:\n")

for sheet_name in all_sheets.keys():

    print("-", sheet_name)

# =========================================
# PROCESS EACH SHEET
# =========================================

for sheet_name, df in all_sheets.items():

    print("\n===================================")
    print(f"PROCESSING SHEET: {sheet_name}")
    print("===================================\n")

    # ---------------------------------
    # CLEAN TABLE NAME
    # ---------------------------------

    table_name = (
        sheet_name
        .strip()
        .lower()
        .replace(" ", "_")
        .replace("-", "_")
    )

    print(f"Table name: {table_name}")

    # ---------------------------------
    # SHOW BASIC INFO
    # ---------------------------------

    print(f"Rows: {len(df)}")
    print(f"Columns: {len(df.columns)}")

    # ---------------------------------
    # UPLOAD TO AZURE POSTGRESQL
    # ---------------------------------

    print("\nUploading to Azure PostgreSQL...\n")

    df.to_sql(
        table_name,
        con=engine,
        if_exists="replace",
        index=False
    )

    print(f"SUCCESS: Uploaded '{table_name}'")

# =========================================
# DONE
# =========================================

print("\n===================================")
print("ALL TABLES UPLOADED SUCCESSFULLY!")
print("===================================\n")