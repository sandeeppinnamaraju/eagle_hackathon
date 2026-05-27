"""
Generate or update flightdeck-schema-definition.json from the structure of an Excel file.
- Reads all sheets
- Infers column names and types
- Updates or creates the schema JSON file

Usage:
  python generate_schema_from_excel.py
"""

import json
from pathlib import Path
import pandas as pd

def infer_dtype(dtype):
    if pd.api.types.is_integer_dtype(dtype):
        return "int"
    if pd.api.types.is_float_dtype(dtype):
        return "float"
    return "str"

SCRIPT_DIR = Path(__file__).resolve().parent
DATABASE_DIR = SCRIPT_DIR.parent
DATA_DIR = (DATABASE_DIR / "data").resolve()
SCHEMA_FILE = (DATA_DIR / "flightdeck-schema-definition.json").resolve()

# Use the first xlsx found in data directory.
excel_candidates = sorted(DATA_DIR.glob("*.xlsx"))
if not excel_candidates:
    raise FileNotFoundError(f"No Excel file found in {DATA_DIR}")
EXCEL_FILE = excel_candidates[0].resolve()

def main():
    all_sheets = pd.read_excel(EXCEL_FILE, sheet_name=None)
    schema = {}
    for sheet_name, df in all_sheets.items():
        columns = {col: infer_dtype(df[col].dtype) for col in df.columns}
        schema[sheet_name] = {"columns": columns}
    # If schema file exists, merge (preserve primary_keys if present)
    if SCHEMA_FILE.exists():
        with open(SCHEMA_FILE, "r") as f:
            old_schema = json.load(f)
        for sheet, defn in schema.items():
            if sheet in old_schema and "primary_keys" in old_schema[sheet]:
                defn["primary_keys"] = old_schema[sheet]["primary_keys"]
    with open(SCHEMA_FILE, "w") as f:
        json.dump(schema, f, indent=2)
    print(f"Schema updated: {SCHEMA_FILE}")

if __name__ == "__main__":
    main()
