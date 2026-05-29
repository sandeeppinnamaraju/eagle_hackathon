import pandas as pd
from pathlib import Path

excel_path = Path(r'c:/git/eagle_hackathon/apps/db/data/clinical_study_export_20260527_163645.xlsx')

sheets = pd.ExcelFile(excel_path).sheet_names
print(f"Sheets found: {sheets}\n")

for sheet in sheets:
    df = pd.read_excel(excel_path, sheet_name=sheet, nrows=2)
    print(f"Sheet: {sheet}")
    print(f"Columns: {list(df.columns)}\n")
