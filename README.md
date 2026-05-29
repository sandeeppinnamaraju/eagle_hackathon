# Eagle Hackathon

A comprehensive clinical trial management system built with FastAPI (backend) and modern web technologies. This project provides tools for searching clinical protocols, tracking study performance metrics, and managing protocol-related data.

## 📋 Project Overview

**Eagle Hackathon** is a full-stack application designed to streamline clinical trial data management and protocol discovery. The system includes:

- **Protocol Search Engine**: TF-IDF based similarity search for discovering relevant clinical protocols
- **Study Dashboard**: Real-time KPI tracking and study performance analytics
- **Protocol Management**: Comprehensive protocol database with therapeutic area filtering
- **Database Integration**: PostgreSQL backend for robust data persistence

## 🏗️ Project Structure

```
eagle_hackathon/
├── apps/
│   ├── backend/                          # FastAPI backend application
│   │   ├── src/
│   │   │   ├── main.py                   # API app bootstrap and router registration
│   │   │   ├── routers/                  # API route handlers
│   │   │   │   ├── fd_protocol_similarity.py  # Protocol search endpoints
│   │   │   │   └── fd_study_protocol.py       # Study metrics endpoints
│   │   │   └── scripts/
│   │   │       └── similarity_engine.py  # TF-IDF search implementation
│   │   ├── tests/                        # Backend unit tests
│   │   └── requirements.txt              # Python dependencies
│   ├── db/                               # Database scripts and management
│   │   ├── data/
│   │   │   └── flightdeck-schema-definition.json
│   │   ├── scripts/
│   │   │   └── etl_loader.py             # ETL data loading script
│   │   └── .env.example                  # Environment configuration template
│   └── database/                         # Legacy database path (see apps/db/)
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- PostgreSQL 12+
- pip (Python package manager)

### Installation

1. **Install dependencies**:
   ```bash
   pip install -r apps/backend/requirements.txt
   ```

2. **Configure database connection** — create a `.env` file in `apps/db/` with:
   ```env
   PGHOST=localhost
   PGUSER=your_user
   PGPORT=5432
   PGDATABASE=your_database
   PGPASSWORD=your_password
   ```

3. **Initialize database**:
   ```bash
   python apps/db/scripts/etl_loader.py
   ```

4. **Run the backend server**:
   ```bash
   python -m uvicorn eagle_hackathon.apps.backend.src.main:app --host 0.0.0.0 --port 8000
   ```

The API will be available at `http://localhost:8000`

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 📚 API Endpoints

### Protocol Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search-protocols` | Search similar protocols with text and therapeutic area filters |
| GET | `/api/protocol/{protocol_id}` | Retrieve full protocol dashboard with KPIs and sites |

### Study Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/study-protocol/studies` | Paginated study list with filtering and sorting |
| GET | `/api/study-protocol/` | Alias for study list endpoint |

### Study Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/study-protocol/active-count` | Count of active studies |
| GET | `/api/study-protocol/on-track` | Percentage of on-track studies |
| GET | `/api/study-protocol/off-track-or-at-risk` | Percentage of at-risk studies |
| GET | `/api/study-protocol/enrollment-vs-target` | Enrollment metrics |
| GET | `/api/study-protocol/velocity-vs-plan` | Average enrollment velocity |
| GET | `/api/study-protocol/kpi-details` | Combined KPI payload |

### Protocol Summary & Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/protocols/summary` | Total protocol and therapeutic area counts |
| GET | `/api/health` | Database connectivity check |
| GET | `/api/db/version` | PostgreSQL version information |

## 📖 Detailed Documentation

- **Backend Setup & APIs**: `apps/backend/README.md`
- **Database Management**: `apps/db/README.md`
- **API Schema Relations**: `apps/backend/API-SCHEMA-RELATION.md`
- **API Versioning**: `apps/backend/API-VERSIONING.md`

## 🧪 Testing

Run backend tests with pytest:

```bash
pytest eagle_hackathon/apps/backend/tests -q
```

## 🔗 API Versioning

- Legacy routes: `/api/...` (backward compatible)
- Versioned routes: `/api/v1/...` (recommended for new clients)

## 🛠️ Database Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PGHOST` | Database host | `localhost` |
| `PGUSER` | Database user | — |
| `PGPORT` | Database port | `5432` |
| `PGDATABASE` | Database name | — |
| `PGPASSWORD` | Database password | — |

### Configuration Locations (order of precedence)

1. `apps/db/.env`
2. `apps/database/.env` (legacy fallback)
3. `apps/.env`
4. `.env` (project root)

Template available at: `apps/db/.env.example`

## 📊 Schema Diagrams

Generate API schema diagrams:

```bash
cd apps/backend
python tools/export_api_schema_diagrams.py
```

Output:

- Rendered images: `diagrams/api-schema-relations/`
- Mermaid files: `diagrams/api-schema-relations/mmd/`

Options:

- `--format png` — Export as PNG instead of SVG
- `--extract-only` — Only extract Mermaid files without rendering

## 🔍 Key Features

- ✅ **Full-Text Protocol Search** — Find similar protocols using TF-IDF similarity
- ✅ **Real-time KPIs** — Track enrollment, velocity, and study status
- ✅ **Therapeutic Area Filtering** — Filter protocols by therapeutic domain
- ✅ **Paginated Results** — Efficient data retrieval with sorting and filtering
- ✅ **Health Checks** — Built-in database connectivity diagnostics
- ✅ **REST API** — RESTful endpoints with comprehensive documentation
- ✅ **Backward Compatibility** — Support for both legacy and versioned API routes

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request with a clear description

## 📧 Support

For issues or questions:

1. Check existing documentation in `apps/backend/README.md`
2. Review API schema relations in `apps/backend/API-SCHEMA-RELATION.md`
3. Inspect logs at `apps/db/data/etl_loader.log`

## 📝 License

This project is part of the Eagle Hackathon initiative.

---

**Last Updated:** 2026-05-29 | **Language:** Python | **Main Dependencies:** FastAPI, PostgreSQL, pytest
