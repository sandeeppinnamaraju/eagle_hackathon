# ETL Pipeline for FlightDeck Database

This folder contains scripts to automate schema management and data loading from Excel to PostgreSQL.

## Pipeline Steps

1. **generate_schema_from_excel.py**
   - Reads the Excel file in `../data/` and infers the schema for each sheet.
   - Updates `flightdeck-schema-definition.json` accordingly.

2. **update_schema.py**
   - Updates the PostgreSQL database schema to match the JSON schema definition.
   - Adds missing columns, alters types if possible, creates new tables as needed.

3. **etl_loader.py**
   - Loads and upserts data from Excel into the database.
   - Uses the schema definition for validation and mapping.

4. **run_etl_pipeline.py**
   - Orchestrates all the above steps in sequence.
   - Usage: `python run_etl_pipeline.py`

5. **load_login_details.py**
   - Reads `user_credentials.xlsx` and loads users into `public.login_details`.
   - Hashes each plaintext password with bcrypt before storing it.
   - Updates existing users by username; inserts new users otherwise.
   - Usage: `python load_login_details.py --excel ../data/user_credentials.xlsx`

## Prerequisites
- Python 3.8+
- PostgreSQL database
- Required Python packages: `pandas`, `sqlalchemy`, `psycopg2`, `python-dotenv`
- Environment variables for DB connection (see below)

## Environment Variables
Set these in a `.env` file in this directory or as shell variables:
```
PGHOST=your-db-host
PGUSER=your-db-user
PGPORT=5432
PGDATABASE=your-db-name
PGPASSWORD=your-db-password
PGSSLMODE=require
```

## Usage
1. Place your Excel file in the `../data/` directory.
2. Run the pipeline:
   ```
   python run_etl_pipeline.py
   ```
3. Check logs and output for success/failure.

## Notes
- The pipeline is safe for production: it does not drop tables or columns.
- Primary keys are preserved if already defined in the schema JSON.
- All scripts can be run individually if needed.
- For creating login details and performance threshold tables, pgAdmin was used to create tables with initial values.
- For subsequent updates and modifications, dedicated backend APIs are provided:
   - PUT /admin/login-details
   - PUT /admin/performance-threshold

---

For questions or issues, contact the project maintainer.
