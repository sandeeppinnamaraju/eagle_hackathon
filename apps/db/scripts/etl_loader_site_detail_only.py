import json
import os
from pathlib import Path
from dotenv import load_dotenv
import pandas as pd
from sqlalchemy import create_engine, MetaData
from etl_loader import (
    normalize_table_name, load_schema, transform_dataframe, load_table, to_sqlalchemy_type, create_table, validate_table_schema, get_existing_tables
)

SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = (SCRIPT_DIR.parent / "data").resolve()
SCHEMA_FILE = (DATA_DIR / "flightdeck-schema-definition.json").resolve()
EXCEL_FILE = (DATA_DIR / "clinical_study_export_20260527_163645.xlsx").resolve()
ENV_PATH = (SCRIPT_DIR.parent / ".env").resolve()

load_dotenv(dotenv_path=ENV_PATH, override=True)

from urllib.parse import quote_plus
required = ["PGHOST", "PGUSER", "PGPORT", "PGDATABASE", "PGPASSWORD"]
values = {key: os.getenv(key) for key in required}
ssl_mode = os.getenv("PGSSLMODE", "require")
encoded_user = quote_plus(values["PGUSER"])
encoded_password = quote_plus(values["PGPASSWORD"])
DATABASE_URL = (
    f"postgresql+psycopg2://{encoded_user}:{encoded_password}"
    f"@{values['PGHOST']}:{values['PGPORT']}/{values['PGDATABASE']}"
    f"?sslmode={ssl_mode}"
)
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
metadata = MetaData()

schema_def = load_schema(SCHEMA_FILE)
sheet_name = "Site Detail"
table_name = normalize_table_name(sheet_name)

# Ensure table exists and schema matches
existing_tables = get_existing_tables(engine)
if table_name not in existing_tables:
    create_table(engine, table_name, schema_def[sheet_name])
else:
    mismatches = validate_table_schema(engine, table_name, schema_def[sheet_name])
    if mismatches:
        print(f"Schema mismatch for {table_name}: {mismatches}")
        exit(1)

# Load only the Site Detail sheet
all_sheets = pd.read_excel(EXCEL_FILE, sheet_name=None)
df = all_sheets[sheet_name]
print(f"Rows in DataFrame before load: {len(df)}")
transformed_df = transform_dataframe(df, schema_def[sheet_name])
print(f"Rows in transformed DataFrame: {len(transformed_df)}")
try:
    load_table(engine, sheet_name, schema_def[sheet_name], transformed_df)
    print("Load successful.")
except Exception as e:
    print(f"Error during load_table: {e}")
print("Done loading Site Detail.")
