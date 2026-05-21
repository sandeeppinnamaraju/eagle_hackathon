import os
from enum import Enum
from typing import List, Optional

import psycopg2
from fastapi import APIRouter, FastAPI, HTTPException
from fastapi import Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel


app = FastAPI(title="PostgreSQL API", version="1.0.0")
router = APIRouter()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import urllib.parse
encoded_password = urllib.parse.quote("FD_hack@357")
print(encoded_password)

def get_conn_params() -> dict:
    return {
        "host": os.getenv("PGHOST", "eagle-postgre-poc.postgres.database.azure.com"),
        "user": os.getenv("PGUSER", "eagle_admin"),  # or eagle_admin@eagle-postgre-poc
        "port": int(os.getenv("PGPORT", "5432")),
        "database": os.getenv("PGDATABASE", "postgres"),
        "password": os.getenv("PGPASSWORD"),  # keep in env var only
        "sslmode": "require",
    }


class StudyPhase(str, Enum):
    PH_I = "Ph I"
    PH_II = "Ph II"
    PH_III = "Ph III"
    PH_IV = "Ph IV"


class StudyStatus(str, Enum):
    RECRUITING = "Recruiting"
    PLANNED = "Planned"
    FOLLOW_UP = "Follow-up"


class StudyPriority(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class StudyPerformance(str, Enum):
    ON_TRACK = "On Track"
    AT_RISK = "At Risk"
    OFF_TRACK = "Off Track"
    UNSET = "\u2014"


class SortBy(str, Enum):
    ID = "id"
    PHASE = "phase"
    THERAPEUTIC_AREA = "therapeuticArea"
    INDICATION = "indication"
    PORTFOLIO_PROGRAM = "portfolioProgram"
    STATUS = "status"
    PRIORITY = "priority"
    TARGET = "target"
    ACTUAL = "actual"
    PERCENT_VS_PLAN = "percentVsPlan"
    COUNTRIES = "countries"
    SITES = "sites"
    PERFORMANCE = "performance"


class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


class ErrorResponse(BaseModel):
    message: str


class Study(BaseModel):
    id: str
    phase: StudyPhase
    therapeuticArea: str
    indication: str
    title: str
    portfolio: str
    program: str
    status: StudyStatus
    priority: StudyPriority
    target: float
    actual: float
    percentVsPlan: Optional[float]
    countries: int
    sites: int
    performance: StudyPerformance
    trend: List[float]


class StudiesPage(BaseModel):
    items: List[Study]
    page: int
    limit: int
    total: int
    hasMore: bool


SORT_COLUMN_MAP = {
    SortBy.ID.value: "study_id",
    SortBy.PHASE.value: "phase",
    SortBy.THERAPEUTIC_AREA.value: "therapeutic_area",
    SortBy.INDICATION.value: "indication",
    SortBy.PORTFOLIO_PROGRAM.value: "portfolio, program",
    SortBy.STATUS.value: "study_status",
    SortBy.PRIORITY.value: "project_priority",
    SortBy.TARGET.value: "target_enrollment",
    SortBy.ACTUAL.value: "actual_enrollment",
    SortBy.PERCENT_VS_PLAN.value: "enrollment_plan_percent",
    SortBy.COUNTRIES.value: "countries_count",
    SortBy.SITES.value: "sites_count",
    SortBy.PERFORMANCE.value: "performance_status",
}


def _parse_positive_int(raw_value: str) -> Optional[int]:
    try:
        parsed = int(raw_value)
    except (TypeError, ValueError):
        return None
    return parsed if parsed >= 1 else None


def _normalize_status(status: Optional[str]) -> StudyStatus:
    normalized = (status or "").strip().upper().replace("-", " ")
    if normalized == "RECRUITING":
        return StudyStatus.RECRUITING
    if normalized == "PLANNED":
        return StudyStatus.PLANNED
    return StudyStatus.FOLLOW_UP


def _normalize_phase(phase: Optional[str]) -> StudyPhase:
    normalized = (phase or "").strip().upper().replace("PHASE", "PH").replace("  ", " ")
    if normalized == "PH I":
        return StudyPhase.PH_I
    if normalized == "PH II":
        return StudyPhase.PH_II
    if normalized == "PH III":
        return StudyPhase.PH_III
    return StudyPhase.PH_IV


def _normalize_priority(priority: Optional[str]) -> StudyPriority:
    normalized = (priority or "").strip().upper()
    if normalized == "HIGH":
        return StudyPriority.HIGH
    if normalized == "LOW":
        return StudyPriority.LOW
    return StudyPriority.MEDIUM


def _normalize_performance(performance: Optional[str]) -> StudyPerformance:
    normalized = (performance or "").strip().upper().replace("_", " ")
    if normalized == "ON TRACK":
        return StudyPerformance.ON_TRACK
    if normalized == "AT RISK":
        return StudyPerformance.AT_RISK
    if normalized == "OFF TRACK":
        return StudyPerformance.OFF_TRACK
    return StudyPerformance.UNSET


def _build_trend(actual: Optional[float], target: Optional[float]) -> List[float]:
    anchor = float(actual or 0)
    if anchor <= 0:
        anchor = float(target or 0)
    if anchor <= 0:
        return [0, 0, 0, 0, 0, 0]
    return [round(anchor * ratio, 2) for ratio in [0.15, 0.3, 0.5, 0.7, 0.85, 1.0]]


@router.get(
    "/studies",
    response_model=StudiesPage,
    operation_id="getStudies",
    summary="Get paginated studies",
    responses={
        400: {"model": ErrorResponse, "description": "Invalid query parameters"},
        500: {"model": ErrorResponse, "description": "Unexpected server error"},
    },
)
@router.get(
    "/studies/",
    response_model=StudiesPage,
    operation_id="getStudiesTrailingSlash",
    summary="Get paginated studies",
    include_in_schema=False,
)
def get_studies(
    page: str = Query(..., description="1-based page index"),
    limit: str = Query(..., description="Number of records per page"),
    search: Optional[str] = Query(None, description="Free-text search across study fields"),
    therapeuticArea: Optional[List[str]] = Query(
        None,
        description="Repeat this query param for multi-select values.",
    ),
    phase: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    portfolio: Optional[str] = Query(None),
    program: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    sortBy: Optional[str] = Query(SortBy.ID.value),
    sortOrder: Optional[str] = Query(SortOrder.ASC.value),
):
    parsed_page = _parse_positive_int(page)
    parsed_limit = _parse_positive_int(limit)
    if not parsed_page or not parsed_limit:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    allowed_phases = {item.value for item in StudyPhase}
    allowed_statuses = {item.value for item in StudyStatus}
    allowed_sort_by = set(SORT_COLUMN_MAP.keys())
    allowed_sort_order = {item.value for item in SortOrder}

    if phase and phase not in allowed_phases:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})
    if status and status not in allowed_statuses:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})
    if sortBy not in allowed_sort_by or sortOrder not in allowed_sort_order:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    where_clauses = []
    params = []

    if search:
        search_param = f"%{search.strip()}%"
        where_clauses.append(
            "(" 
            "study_id ILIKE %s OR "
            "phase ILIKE %s OR "
            "therapeutic_area ILIKE %s OR "
            "indication ILIKE %s OR "
            "title ILIKE %s OR "
            "portfolio ILIKE %s OR "
            "program ILIKE %s OR "
            "study_status ILIKE %s OR "
            "project_priority ILIKE %s OR "
            "performance_status ILIKE %s"
            ")"
        )
        params.extend([search_param] * 10)

    if therapeuticArea:
        normalized_therapeutic_areas = [value.strip().lower() for value in therapeuticArea if value.strip()]
        if normalized_therapeutic_areas:
            where_clauses.append("LOWER(therapeutic_area) = ANY(%s)")
            params.append(normalized_therapeutic_areas)

    if phase:
        where_clauses.append("phase = %s")
        params.append(phase)

    if status:
        db_status = "FOLLOW UP" if status == StudyStatus.FOLLOW_UP.value else status
        where_clauses.append("UPPER(COALESCE(study_status, '')) = UPPER(%s)")
        params.append(db_status)

    if portfolio:
        where_clauses.append("portfolio ILIKE %s")
        params.append(f"%{portfolio.strip()}%")

    if program:
        where_clauses.append("program ILIKE %s")
        params.append(f"%{program.strip()}%")

    if region:
        where_clauses.append("COALESCE(region, '') ILIKE %s")
        params.append(f"%{region.strip()}%")

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
    sort_sql = SORT_COLUMN_MAP[sortBy]
    order_sql = sortOrder.upper()
    offset = (parsed_page - 1) * parsed_limit

    count_query = f"SELECT COUNT(*) FROM public.study_data {where_sql}"
    data_query = f"""
        SELECT
            study_id, phase, therapeutic_area, indication, title, portfolio, program,
            study_status, project_priority, target_enrollment, actual_enrollment,
            enrollment_plan_percent, countries_count, sites_count, performance_status
        FROM public.study_data
        {where_sql}
        ORDER BY {sort_sql} {order_sql}
        LIMIT %s OFFSET %s
    """

    conn_params = get_conn_params()
    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                cursor.execute(count_query, params)
                total = cursor.fetchone()[0]

                cursor.execute(data_query, params + [parsed_limit, offset])
                rows = cursor.fetchall()

        items = []
        for row in rows:
            (
                sid,
                db_phase,
                db_therapeutic_area,
                db_indication,
                db_title,
                db_portfolio,
                db_program,
                db_status,
                db_priority,
                db_target,
                db_actual,
                db_percent_vs_plan,
                db_countries,
                db_sites,
                db_performance,
            ) = row

            items.append(
                Study(
                    id=str(sid),
                    phase=_normalize_phase(db_phase),
                    therapeuticArea=str(db_therapeutic_area or ""),
                    indication=str(db_indication or ""),
                    title=str(db_title or ""),
                    portfolio=str(db_portfolio or ""),
                    program=str(db_program or ""),
                    status=_normalize_status(db_status),
                    priority=_normalize_priority(db_priority),
                    target=float(db_target or 0),
                    actual=float(db_actual or 0),
                    percentVsPlan=(float(db_percent_vs_plan) if db_percent_vs_plan is not None else None),
                    countries=int(db_countries or 0),
                    sites=int(db_sites or 0),
                    performance=_normalize_performance(db_performance),
                    trend=_build_trend(db_actual, db_target),
                )
            )

        return StudiesPage(
            items=items,
            page=parsed_page,
            limit=parsed_limit,
            total=total,
            hasMore=(parsed_page * parsed_limit) < total,
        )
    except ValueError:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})
    except Exception:
        return JSONResponse(status_code=500, content={"message": "Internal server error"})


def get_database_schema() -> dict:
    conn_params = get_conn_params()
    if not conn_params["password"]:
        raise ValueError("PGPASSWORD is not set.")

    schema_map = {}

    with psycopg2.connect(**conn_params) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    c.table_schema,
                    c.table_name,
                    c.column_name,
                    c.data_type,
                    c.is_nullable
                FROM information_schema.columns c
                JOIN information_schema.tables t
                  ON c.table_schema = t.table_schema
                 AND c.table_name = t.table_name
                WHERE t.table_type = 'BASE TABLE'
                  AND c.table_schema NOT IN ('pg_catalog', 'information_schema')
                ORDER BY c.table_schema, c.table_name, c.ordinal_position;
                """
            )

            for table_schema, table_name, column_name, data_type, is_nullable in cursor.fetchall():
                schema_map.setdefault(table_schema, {}).setdefault(table_name, []).append(
                    {
                        "column": column_name,
                        "data_type": data_type,
                        "nullable": (is_nullable == "YES"),
                    }
                )

    return schema_map

@router.get("/study-summary")
def get_study_summary(study_id: str = Query(..., description="Study ID")):
    conn_params = get_conn_params()
    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                # Fetch main study info
                cursor.execute("""
                    SELECT
                        study_id, phase, therapeutic_area, indication, title, portfolio, program,
                        study_status, project_priority, target_enrollment, actual_enrollment,
                        enrollment_plan_percent, countries_count, sites_count, performance_status
                    FROM public.study_data
                    WHERE study_id = %s
                """, (study_id,))
                row = cursor.fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="Study not found")
                (sid, phase, ta, indication, title, portfolio, program, status, priority,
                 target, actual, percent_vs_plan, countries, sites, performance) = row

                # Calculate trend (example: t(sites, actual_enrollment))
                trend = f"t({sites}, {actual})"

                return {
                    "id": sid,
                    "phase": phase,
                    "therapeuticArea": ta,
                    "indication": indication,
                    "title": title,
                    "portfolio": portfolio,
                    "program": program,
                    "status": status,
                    "priority": priority,
                    "target": target,
                    "actual": actual,
                    "percentVsPlan": percent_vs_plan,
                    "countries": countries,
                    "sites": sites,
                    "performance": performance,
                    "trend": trend
                }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch study summary: {e}")
    
@router.get("/health")
def health():
    try:
        conn_params = get_conn_params()
        if not conn_params["password"]:
            raise ValueError("PGPASSWORD is not set.")
        with psycopg2.connect(**conn_params):
            pass
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database health check failed: {e}")


@router.get("/db/version")
def db_version():
    try:
        conn_params = get_conn_params()
        if not conn_params["password"]:
            raise ValueError("PGPASSWORD is not set.")

        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT version();")
                version = cursor.fetchone()[0]
        return {"version": version}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch DB version: {e}")



# Endpoint to return summary details for all studies
@router.get("/study/summary/all")
def get_all_study_summaries():
    conn_params = get_conn_params()
    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT
                        study_id, phase, therapeutic_area, indication, title, portfolio, program,
                        study_status, project_priority, target_enrollment, actual_enrollment,
                        enrollment_plan_percent, countries_count, sites_count, performance_status
                    FROM public.study_data
                """)
                studies = []
                for row in cursor.fetchall():
                    (sid, phase, ta, indication, title, portfolio, program, status, priority,
                     target, actual, percent_vs_plan, countries, sites, performance) = row
                    trend = f"t({sites}, {actual})"
                    studies.append({
                        "id": sid,
                        "phase": phase,
                        "therapeuticArea": ta,
                        "indication": indication,
                        "title": title,
                        "portfolio": portfolio,
                        "program": program,
                        "status": status,
                        "priority": priority,
                        "target": target,
                        "actual": actual,
                        "percentVsPlan": percent_vs_plan,
                        "countries": countries,
                        "sites": sites,
                        "performance": performance,
                        "trend": trend
                    })
                return studies
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch study summaries: {e}")

@router.get("/db/schema")
def db_schema():
    try:
        return get_database_schema()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch schema: {e}")
    
@router.get("/studies/active/count")
def get_active_studies_count():
    conn_params = get_conn_params()
    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT COUNT(*) FROM public.study_data
                    WHERE study_status IN ('Active','RECRUITING','follow up')
                """)
                count = cursor.fetchone()[0]
                return {"active_studies_count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch active studies count: {e}")


@router.get("/studies/on-track")
def get_on_track_percentage():
    conn_params = get_conn_params()
    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                        COUNT(*) FILTER (
                            WHERE UPPER(COALESCE(study_status, '')) IN ('RECRUITING', 'FOLLOW UP')
                        ) AS total_active_studies,
                        COUNT(*) FILTER (
                            WHERE UPPER(COALESCE(study_status, '')) IN ('RECRUITING', 'FOLLOW UP')
                              AND UPPER(COALESCE(performance_status, '')) = 'ON_TRACK'
                        ) AS on_track_studies_count
                    FROM public.study_data
                    """
                )
                total_active_studies, on_track_studies_count = cursor.fetchone()
                percentage = (
                    round((on_track_studies_count / total_active_studies) * 100, 2)
                    if total_active_studies
                    else 0.0
                )

                return {
                    "percentage": percentage,
                    "total_active_studies": total_active_studies,
                    "on_track_studies_count": on_track_studies_count,
                }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch on-track percentage: {e}")


@router.get("/studies/off-track-or-at-risk")
def get_off_track_or_at_risk_percentage():
    conn_params = get_conn_params()
    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                        COUNT(*) FILTER (
                            WHERE UPPER(COALESCE(study_status, '')) IN ('RECRUITING', 'FOLLOW UP')
                        ) AS total_active_studies,
                        COUNT(*) FILTER (
                            WHERE UPPER(COALESCE(study_status, '')) IN ('RECRUITING', 'FOLLOW UP')
                              AND UPPER(COALESCE(performance_status, '')) IN ('OFF_TRACK', 'AT_RISK')
                        ) AS off_track_or_at_risk_studies_count
                    FROM public.study_data
                    """
                )
                total_active_studies, off_track_or_at_risk_studies_count = cursor.fetchone()
                percentage = (
                    round((off_track_or_at_risk_studies_count / total_active_studies) * 100, 2)
                    if total_active_studies
                    else 0.0
                )

                return {
                    "percentage": percentage,
                    "total_active_studies": total_active_studies,
                    "off_track_or_at_risk_studies_count": off_track_or_at_risk_studies_count,
                }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch off-track or at-risk percentage: {e}")


@router.get("/studies/enrollment-vs-target")
def get_enrollment_vs_target():
    conn_params = get_conn_params()
    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                        COALESCE(
                            SUM(actual_enrollment) FILTER (
                                WHERE UPPER(COALESCE(study_status, '')) IN ('ACTIVE', 'RECRUITING', 'FOLLOW UP')
                            ),
                            0
                        ) AS total_actual,
                        COALESCE(
                            SUM(target_enrollment) FILTER (
                                WHERE UPPER(COALESCE(study_status, '')) IN ('ACTIVE', 'RECRUITING', 'FOLLOW UP')
                            ),
                            0
                        ) AS total_target
                    FROM public.study_data
                    """
                )

                total_actual, total_target = cursor.fetchone()
                percentage = (
                    round((total_actual / total_target) * 100, 2)
                    if total_target
                    else 0.0
                )

                return {
                    "percentage": percentage,
                    "sum_actual": total_actual,
                    "sum_target": total_target,
                }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch enrollment vs target: {e}")


@router.get("/studies/velocity-vs-plan")
def get_average_velocity_vs_plan():
    conn_params = get_conn_params()
    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                        COALESCE(
                            AVG(enrollment_plan_percent) FILTER (
                                WHERE UPPER(COALESCE(study_status, '')) IN ('ACTIVE', 'RECRUITING', 'FOLLOW UP')
                            ),
                            0
                        ) AS average_velocity_vs_plan
                    FROM public.study_data
                    """
                )

                average_velocity_vs_plan = round(float(cursor.fetchone()[0]), 2)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch average velocity vs plan: {e}")

@router.get("/study/kpi-details")
def get_kpi_details():
    conn_params = get_conn_params()
    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                        COUNT(*) FILTER (
                            WHERE UPPER(COALESCE(study_status, '')) IN ('ACTIVE', 'RECRUITING', 'FOLLOW UP')
                        ) AS active_studies_count,

                        COUNT(*) FILTER (
                            WHERE UPPER(COALESCE(study_status, '')) IN ('ACTIVE', 'RECRUITING', 'FOLLOW UP')
                              AND UPPER(COALESCE(performance_status, '')) = 'ON_TRACK'
                        ) AS on_track_count,

                        COUNT(*) FILTER (
                            WHERE UPPER(COALESCE(study_status, '')) IN ('ACTIVE', 'RECRUITING', 'FOLLOW UP')
                              AND UPPER(COALESCE(performance_status, '')) IN ('OFF_TRACK', 'AT_RISK')
                        ) AS off_track_or_at_risk_count,

                        COALESCE(
                            SUM(actual_enrollment) FILTER (
                                WHERE UPPER(COALESCE(study_status, '')) IN ('ACTIVE', 'RECRUITING', 'FOLLOW UP')
                            ), 0
                        ) AS total_actual_enrollment,
                        COALESCE(
                            SUM(target_enrollment) FILTER (
                                WHERE UPPER(COALESCE(study_status, '')) IN ('ACTIVE', 'RECRUITING', 'FOLLOW UP')
                            ), 0
                        ) AS total_target_enrollment,

                        COALESCE(
                            AVG(enrollment_plan_percent) FILTER (
                                WHERE UPPER(COALESCE(study_status, '')) IN ('ACTIVE', 'RECRUITING', 'FOLLOW UP')
                            ), 0
                        ) AS average_velocity_vs_plan

                    FROM public.study_data
                    """
                )

                (
                    active_studies_count,
                    on_track_count,
                    off_track_or_at_risk_count,
                    total_actual_enrollment,
                    total_target_enrollment,
                    average_velocity_vs_plan,
                ) = cursor.fetchone()

                on_track_percentage = (
                    round((on_track_count / active_studies_count) * 100, 2)
                    if active_studies_count else 0.0
                )
                off_track_or_at_risk_percentage = (
                    round((off_track_or_at_risk_count / active_studies_count) * 100, 2)
                    if active_studies_count else 0.0
                )
                enrollment_percentage = (
                    round((total_actual_enrollment / total_target_enrollment) * 100, 2)
                    if total_target_enrollment else 0.0
                )

                return {
                    "active_studies": {
                        "count": active_studies_count,
                    },
                    "on_track": {
                        "percentage": on_track_percentage,
                        "count": on_track_count,
                    },
                    "off_track_or_at_risk": {
                        "percentage": off_track_or_at_risk_percentage,
                        "count": off_track_or_at_risk_count,
                    },
                    "enrollment_vs_target": {
                        "percentage": enrollment_percentage,
                        "sum_actual": total_actual_enrollment,
                        "sum_target": total_target_enrollment,
                    },
                    "velocity_vs_plan": {
                        "average": round(float(average_velocity_vs_plan), 2),
                    },
                }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch KPI details: {e}")


app.include_router(router, prefix="/api")