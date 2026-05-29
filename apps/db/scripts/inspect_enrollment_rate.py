import pandas as pd
from pathlib import Path

excel_path = Path(r'c:/git/eagle_hackathon/apps/db/data/clinical_study_export_20260527_163645.xlsx')
df = pd.read_excel(excel_path, sheet_name='Enrollment Rate')
print(df.head(10))
print(f"\nColumns: {list(df.columns)}")
print(f"Rows: {len(df)}")
