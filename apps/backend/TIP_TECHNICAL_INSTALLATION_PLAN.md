# TIP Technical Installation Plan

## Related Record
The formal Technical Installation Record for this solution is documented in `TIR_TECHNICAL_INSTALLATION_RECORD.md`.

## Purpose
This document defines the technical installation plan for TIP in the current FlightDeck codebase. It covers environment preparation, backend setup, database setup, configuration, validation, deployment readiness, and rollback considerations.

## Solution Scope
- Backend: FastAPI service under `apps/backend`
- Database: PostgreSQL setup and ETL loaders under `apps/db`
- API base paths: `/api` and `/api/v1`
- Core functional areas:
  - Authentication
  - Study Protocol
  - Study Overview
  - Protocol Search
  - Admin configuration

## Target Environments
| Environment | Purpose | Notes |
| --- | --- | --- |
| Local | Developer setup and testing | Runs from workstation or dev VM |
| Test / UAT | Integration and user validation | Mirrors production configuration as closely as possible |
| Production | Business usage | Hosted deployment with secure configuration |

## Technical Prerequisites

### Infrastructure
- Windows, Linux, or cloud-hosted runtime capable of running Python 3.11+.
- PostgreSQL instance accessible from the TIP backend.
- Network access from the backend host to the database.
- TLS-enabled database access when using managed PostgreSQL.

### Software
- Python 3.11 or later
- `pip`
- Git
- PostgreSQL client access or equivalent DB connectivity tools

### Access Requirements
- Source repository access
- Database credentials with schema read and write permissions
- Deployment target access for the selected environment
- Application configuration values for API and authentication setup

## Application Structure
- `apps/backend`: FastAPI backend application
- `apps/backend/src/main.py`: API bootstrap and router registration
- `apps/backend/src/routers`: API route implementations
- `apps/db`: Database setup and ETL utilities
- `apps/db/scripts`: Data loading scripts
- `apps/.env` or `apps/db/.env`: Environment configuration for DB access

## Installation Sequence

### 1. Clone Source Code
```bash
git clone <repository-url>
cd eagle_hackathon
```

### 2. Create Environment Configuration
Create one of the supported environment files:
- `apps/db/.env`
- `apps/.env`

Minimum required database settings:
```env
PGHOST=<database-host>
PGUSER=<database-user>
PGPORT=5432
PGDATABASE=<database-name>
PGPASSWORD=<database-password>
PGSSLMODE=require
```

Recommended backend settings:
```env
APP_NAME=FlightDeck APIs
APP_VERSION=1.0.0
API_PREFIX=/api
API_VERSION_PREFIX=/api/v1
ALLOWED_ORIGINS=*
JWT_SECRET=<strong-secret>
JWT_EXPIRE_MINUTES=60
COOKIE_SECURE=true
```

### 3. Install Backend Dependencies
From `apps/backend`:
```bash
pip install -r requirements.txt
```

If a dedicated virtual environment is required:
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Prepare Database
Confirm PostgreSQL connectivity using the configured environment values.

Load or refresh data as required:
```bash
cd apps/db
python scripts/etl_loader.py
```

Optional targeted loaders may be run when only specific datasets need refresh, for example:
- KPI timeline loader
- Site breakdown loader
- Site detail loader
- Protocol sites loader

### 5. Start the Backend Service
From `apps/backend`:
```bash
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Expected API routes:
- `http://localhost:8000/api/health`
- `http://localhost:8000/api/v1/health`
- `http://localhost:8000/docs`

## Installation Validation

### Basic Health Checks
Validate the following endpoints after startup:
```bash
GET /api/health
GET /api/db/version
GET /api/v1/health
GET /api/v1/db/version
```

### Functional Validation
Verify core business APIs:
- `POST /api/v1/auth/login`
- `GET /api/v1/study-protocol/studies?page=1&limit=20`
- `GET /api/v1/study-protocol/kpi-details`
- `GET /api/v1/study-overview/insights`
- `GET /api/v1/protocols/summary`

### Automated Validation
From the repository root:
```bash
set PYTHONPATH=C:/git
python -m pytest eagle_hackathon/apps/backend/tests -q
```

Adjust `PYTHONPATH` for the actual installation path when not running under `C:/git`.

## Performance and Readiness Checks
- Confirm the study list endpoint returns within acceptable SLA for page sizes used by the UI.
- Verify database-backed KPI endpoints do not return 500 errors when optional derived columns are absent.
- Confirm environment variables are loaded consistently in local, UAT, and production environments.
- Confirm CORS configuration matches the deployed frontend origin.

## Deployment Considerations

### Configuration Management
- Do not store secrets in source-controlled files.
- Store `PGPASSWORD`, `JWT_SECRET`, and any production credentials in secure secret management.
- Use environment-specific values for allowed origins and cookie security.

### Database Change Control
- Apply schema updates before deploying code that depends on them.
- Run ETL loaders after schema changes when derived or reporting tables need refresh.
- Capture a DB backup or restore point before major refreshes.

### Operational Readiness
- Enable application logging.
- Monitor API latency for high-traffic endpoints.
- Validate production connectivity to the PostgreSQL server before cutover.

## Rollback Plan
- Revert the backend deployment to the previous stable version if health checks fail.
- Restore prior environment configuration if configuration changes caused the issue.
- Restore database backup only if data or schema changes introduced a functional regression.
- Re-run smoke tests after rollback.

## Installation Exit Criteria
TIP installation is considered complete when all of the following are true:
- Backend service starts successfully.
- Database connection succeeds.
- ETL load completes without blocking errors.
- Core APIs return successful responses.
- Authentication works with a valid test account.
- Study Protocol and Study Overview pages load expected data.
- Targeted backend tests pass.

## Ownership
- Application installation owner: Backend engineering team
- Database installation owner: Data or DB engineering team
- Deployment approval owner: Environment or release owner

## Revision Notes
- Version 1.0
- Created for the current TIP / FlightDeck backend and PostgreSQL deployment model