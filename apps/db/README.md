# Database

## Overview
This directory contains scripts and data related to database setup and management.

## Structure
- `data/`: Contains schema definitions and other data files.
  - `flightdeck-schema-definition.json`: JSON file defining the database schema.
- `scripts/`: Contains database-related scripts.
  - `etl_loader.py`: Script for loading data into the database.

## Setup
1. Ensure the database is running and accessible.
2. Configure a .env file with database credentials. Supported locations:
  - apps/db/.env
  - apps/database/.env (legacy fallback)
  - apps/.env
  - .env at the project root
  Template:
  - apps/db/.env.example
  Required variables:
  - PGHOST
  - PGUSER
  - PGPORT
  - PGDATABASE
  - PGPASSWORD
3. Run the ETL loader script:
   ```bash
   python scripts/etl_loader.py
   ```

## Notes
- Logs for the ETL process are stored at data/etl_loader.log.
- Update the schema definition file (`flightdeck-schema-definition.json`) as needed.