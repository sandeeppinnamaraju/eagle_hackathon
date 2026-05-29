"""
Orchestrate the full ETL pipeline:
1. Generate schema from Excel
2. Update DB schema
3. Load/upsert data from Excel

Usage:
  python run_etl_pipeline.py
"""

import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent

steps = [
    ("Generate schema from Excel", "generate_schema_from_excel.py"),
    ("Update DB schema", "update_schema.py"),
    ("Load/upsert data from Excel", "etl_loader.py"),
]

def run_step(desc, script):
    print(f"\n=== {desc} ({script}) ===")
    result = subprocess.run([sys.executable, str(SCRIPT_DIR / script)])
    if result.returncode != 0:
        print(f"Step failed: {desc}")
        sys.exit(result.returncode)
    print(f"Step succeeded: {desc}")

if __name__ == "__main__":
    for desc, script in steps:
        run_step(desc, script)
    print("\nETL pipeline completed successfully.")
