# TIR Technical Installation Record

## Document Control
| Field | Value |
| --- | --- |
| Document title | Technical Installation Record |
| Solution name | TIP / FlightDeck |
| Document type | TIR |
| Version | 1.0 |
| Date | 2026-05-29 |
| Prepared from | TIP technical installation plan and verified backend workspace state |
| Primary area | `apps/backend` and `apps/db` |

## Purpose
This Technical Installation Record captures the installed application components, required configuration, database setup, validation activities, observed technical outcomes, operational considerations, and post-installation status for the TIP / FlightDeck solution in the current codebase.

## Installation Summary
- Solution type: FastAPI backend with PostgreSQL-backed reporting and dashboard APIs
- Backend location: `apps/backend`
- Database utilities location: `apps/db`
- API entry points: `/api` and `/api/v1`
- Main capabilities installed:
  - Authentication
  - Study Protocol APIs
  - Study Overview APIs
  - Protocol Search APIs
  - Admin configuration APIs

## Installed Technical Components

### Application Components
| Component | Location | Description |
| --- | --- | --- |
| API bootstrap | `apps/backend/src/main.py` | Registers routers and mounts API prefixes |
| Study Protocol router | `apps/backend/src/routers/fd_study_protocol.py` | Study list, KPI, health, and DB utility endpoints |
| Study Overview router | `apps/backend/src/routers/fd_study_overview.py` | Study overview insights and breakdown endpoints |
| Authentication router | `apps/backend/src/routers/fd_auth.py` | Login and auth handling |
| Protocol router | `apps/backend/src/routers/fd_protocol_similarity.py` | Protocol summary, search, and similarity endpoints |

### Database Components
| Component | Location | Description |
| --- | --- | --- |
| DB connection settings | `apps/backend/src/db/connection.py` | Builds PostgreSQL connection parameters |
| ETL loader | `apps/db/scripts/etl_loader.py` | Loads core data into PostgreSQL |
| DB schema definition | `apps/database/data/flightdeck-schema-definition.json` | Schema reference for database structure |
| ETL logs | `apps/db/data/etl_loader.log` | Operational loader log output |

## Installation Environment

### Runtime Prerequisites
- Python 3.11 or later
- `pip`
- Git access to the repository
- PostgreSQL server reachable from the application host
- TLS-capable PostgreSQL connection when using managed cloud databases

### Required Configuration
Supported environment file locations:
- `apps/db/.env`
- `apps/database/.env`
- `apps/.env`
- `.env` at the repository root

Required database variables:
```env
PGHOST=<database-host>
PGUSER=<database-user>
PGPORT=5432
PGDATABASE=<database-name>
PGPASSWORD=<database-password>
PGSSLMODE=require
```

Recommended backend variables:
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

## Installation Record

### Source and Dependency Installation
The solution is installed from the repository root and backend dependencies are installed from `apps/backend`.

Representative installation commands:
```bash
git clone <repository-url>
cd eagle_hackathon
pip install -r apps/backend/requirements.txt
```

Optional virtual environment setup:
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r apps/backend/requirements.txt
```

### Database Preparation Record
The database installation process requires:
- reachable PostgreSQL connectivity
- valid environment-based credentials
- execution of ETL loaders to populate required reporting tables

Representative loader command:
```bash
cd apps/db
python scripts/etl_loader.py
```

Targeted loaders may also be used for partial refreshes, including KPI timeline, site breakdown, site detail, and protocol site data.

### Application Startup Record
Representative backend startup command:
```bash
cd apps/backend
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Expected local endpoints after startup:
- `http://localhost:8000/api/health`
- `http://localhost:8000/api/v1/health`
- `http://localhost:8000/docs`

## Validation Record

### Health and Connectivity Validation
The installed backend exposes health and database version checks:
- `GET /api/health`
- `GET /api/db/version`
- `GET /api/v1/health`
- `GET /api/v1/db/version`

### Functional API Validation
Core APIs validated in the current solution scope include:
- `POST /api/v1/auth/login`
- `GET /api/v1/study-protocol/studies?page=1&limit=20`
- `GET /api/v1/study-protocol/kpi-details`
- `GET /api/v1/study-overview/insights`
- `GET /api/v1/protocols/summary`

### Test Execution Record
Focused backend router tests were executed from the repository root using:
```bash
set PYTHONPATH=C:/git
python -m pytest eagle_hackathon/apps/backend/tests/test_study_protocol_routes.py -q
```

Observed result at the time of this record:
- `35 passed`

## Performance Record

### Studies API Analysis
The endpoint below was identified as a performance-sensitive path:
- `GET /api/v1/study-protocol/studies?page=1&limit=200&sortOrder=asc`

Observed technical findings:
- Direct database execution for the main study list query was fast.
- The primary application bottleneck was repeated retrieval of performance thresholds during per-row response shaping in the Study Protocol router.
- This created unnecessary additional database calls proportional to the number of returned studies.

### Implemented Optimization Record
The Study Protocol router was updated so that performance thresholds are retrieved once per request and reused across all returned study rows.

Files affected:
- `apps/backend/src/routers/fd_study_protocol.py`
- `apps/backend/tests/test_study_protocol_routes.py`

Observed benchmark for the same handler path in the workspace after the change:
- Before optimization: approximately `20629.6 ms`
- After optimization: approximately `286.97 ms`

### Performance Interpretation
This optimization preserved the existing API contract and reduced avoidable backend latency without changing filters, sorting, response fields, or route paths.

## Configuration and Security Record
- Database and JWT secrets must not be stored in source-controlled files.
- `PGPASSWORD`, `JWT_SECRET`, and production configuration values must be stored in secure environment or secret-management tooling.
- `ALLOWED_ORIGINS` and `COOKIE_SECURE` must be environment-specific.
- Production database access should use TLS-enabled settings.

## Operational Considerations

### Monitoring
- Monitor API latency for Study Protocol and Study Overview endpoints.
- Monitor ETL execution logs and database refresh outcomes.
- Monitor authentication failures and backend health endpoints.

### Change Control
- Apply schema or data changes before releasing code that depends on them.
- Refresh ETL-loaded data after material schema or mapping changes.
- Capture restore points or backups before major database refresh operations.

## Known Constraints
- Frontend source code is not present in this workspace, so frontend installation steps are not recorded here.
- Production runtime behavior depends on deployment of the latest backend code and correct environment configuration.
- Environment-specific secrets and deployment pipeline settings are external to this record.

## Rollback Record
If installation validation fails after deployment:
- revert the backend deployment to the last stable release
- restore previous environment settings if configuration changes caused the issue
- restore database backup only when a data or schema regression has been introduced
- rerun smoke tests after rollback

## Exit Criteria
The technical installation is considered complete when all of the following are true:
- backend service starts successfully
- database connectivity succeeds
- ETL load completes without blocking failures
- core APIs return successful responses
- authentication works for a valid test user
- Study Protocol and Study Overview data render successfully in consuming clients
- targeted backend tests pass

## Approvals and Ownership
| Role | Ownership |
| --- | --- |
| Application installation owner | Backend engineering team |
| Database installation owner | Data or DB engineering team |
| Release approval owner | Environment or release owner |

## Revision History
| Version | Date | Description |
| --- | --- | --- |
| 1.0 | 2026-05-29 | Initial TIR created from the TIP installation plan and current validated backend state |