import logging
import calendar
import re
from datetime import date
from enum import Enum
from functools import lru_cache
from typing import List, Optional

import psycopg2
from fastapi import APIRouter, HTTPException, Request
from fastapi import Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from eagle_hackathon.apps.backend.src.db.connection import get_conn_params
from eagle_hackathon.apps.backend.src.core.performance_thresholds import (
    PerformanceThresholds,
    classify_performance,
    get_performance_thresholds,
)


logger = logging.getLogger(__name__)

router = APIRouter()


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


PERCENT_VS_PLAN_SQL = (
    "CASE "
    "WHEN COALESCE(target_enrollment, 0) > 0 "
    "THEN ((COALESCE(actual_enrollment, 0)::numeric / NULLIF(target_enrollment::numeric, 0)) * 100) "
    "ELSE 0 "
    "END"
)


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
    SortBy.PERCENT_VS_PLAN.value: PERCENT_VS_PLAN_SQL,
    SortBy.COUNTRIES.value: "countries_count",
    SortBy.SITES.value: "sites_count",
    SortBy.PERFORMANCE.value: f"CASE WHEN ({PERCENT_VS_PLAN_SQL}) > 95 THEN 3 WHEN ({PERCENT_VS_PLAN_SQL}) >= 80 AND ({PERCENT_VS_PLAN_SQL}) <= 94 THEN 2 ELSE 1 END",
}


def _clean_optional_text(raw_value: object) -> Optional[str]:
    if raw_value is None:
        return None
    if not isinstance(raw_value, str):
        raise ValueError("Invalid query parameter")

    cleaned = raw_value.strip()
    return cleaned or None


def _clean_required_text(raw_value: object) -> str:
    cleaned = _clean_optional_text(raw_value)
    if not cleaned:
        raise ValueError("Invalid query parameter")
    return cleaned


def _clean_optional_text_list(raw_value: object) -> Optional[List[str]]:
    if raw_value is None:
        return None
    if not isinstance(raw_value, list):
        raise ValueError("Invalid query parameter")

    cleaned_values: List[str] = []
    for item in raw_value:
        if not isinstance(item, str):
            raise ValueError("Invalid query parameter")
        cleaned_item = item.strip()
        if not cleaned_item:
            raise ValueError("Invalid query parameter")
        cleaned_values.append(cleaned_item)

    return cleaned_values or None


def _validate_date_range(start_date: Optional[date], end_date: Optional[date]) -> None:
    if start_date and end_date and start_date > end_date:
        raise ValueError("Invalid query parameter")


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


# Maps normalized phase labels to DB values
_PHASE_TO_DB = {
    "Ph I": "PHASE_I",
    "Ph II": "PHASE_II",
    "Ph III": "PHASE_III",
    "Ph IV": "PHASE_IV",
}


def _normalize_phase_label(phase: Optional[str]) -> Optional[str]:
    normalized = " ".join(
        (phase or "")
        .strip()
        .upper()
        .replace("_", " ")
        .replace("-", " ")
        .replace("PHASE", "PH")
        .split()
    )

    if normalized in {"PH I", "PH 1"}:
        return StudyPhase.PH_I.value
    if normalized in {"PH II", "PH 2"}:
        return StudyPhase.PH_II.value
    if normalized in {"PH III", "PH 3"}:
        return StudyPhase.PH_III.value
    if normalized in {"PH IV", "PH 4"}:
        return StudyPhase.PH_IV.value
    return None


def _phase_to_db_value(phase: Optional[str]) -> Optional[str]:
    normalized_label = _normalize_phase_label(phase)
    if not normalized_label:
        return None
    return _PHASE_TO_DB[normalized_label]


def _normalize_phase(phase: Optional[str]) -> StudyPhase:
    normalized_label = _normalize_phase_label(phase)
    if normalized_label == StudyPhase.PH_I.value:
        return StudyPhase.PH_I
    if normalized_label == StudyPhase.PH_II.value:
        return StudyPhase.PH_II
    if normalized_label == StudyPhase.PH_III.value:
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


def _performance_from_percent(
    value: Optional[float],
    thresholds: Optional[PerformanceThresholds] = None,
) -> StudyPerformance:
    status = classify_performance(value, thresholds)
    if status == "ON_TRACK":
        return StudyPerformance.ON_TRACK
    if status == "OFF_TRACK":
        return StudyPerformance.OFF_TRACK
    return StudyPerformance.AT_RISK


def _count_performance_groups(values: List[float], thresholds: PerformanceThresholds) -> tuple[int, int, int]:
    on_track = 0
    at_risk = 0
    off_track = 0
    for value in values:
        status = classify_performance(value, thresholds)
        if status == "ON_TRACK":
            on_track += 1
        elif status == "OFF_TRACK":
            off_track += 1
        else:
            at_risk += 1
    return on_track, at_risk, off_track


def _build_trend(actual: Optional[float], target: Optional[float]) -> List[float]:
    anchor = float(actual or 0)
    if anchor <= 0:
        anchor = float(target or 0)
    if anchor <= 0:
        return [0, 0, 0, 0, 0, 0]
    return [round(anchor * ratio, 2) for ratio in [0.15, 0.3, 0.5, 0.7, 0.85, 1.0]]


def _apply_fpi_lpo_date_filters(
    where_clauses: List[str],
    params: List,
    fpi_start_date: Optional[date],
    fpi_end_date: Optional[date],
    lpo_start_date: Optional[date],
    lpo_end_date: Optional[date],
    fpi_actual_column: Optional[str],
    fpi_planned_column: Optional[str],
    lpo_actual_column: Optional[str],
    lpo_planned_column: Optional[str],
) -> None:
    if fpi_start_date and fpi_actual_column:
        where_clauses.append(f"{fpi_actual_column} >= %s")
        params.append(fpi_start_date)

    if fpi_end_date:
        if fpi_actual_column:
            where_clauses.append(f"{fpi_actual_column} <= %s")
            params.append(fpi_end_date)
        if fpi_planned_column and fpi_planned_column != fpi_actual_column:
            where_clauses.append(f"{fpi_planned_column} <= %s")
            params.append(fpi_end_date)

    if lpo_start_date and lpo_actual_column:
        where_clauses.append(f"{lpo_actual_column} >= %s")
        params.append(lpo_start_date)

    if lpo_end_date and lpo_planned_column:
        where_clauses.append(f"{lpo_planned_column} <= %s")
        params.append(lpo_end_date)


def _parse_month_year(year: int, month: int, *, is_end: bool) -> date:
    if not (1900 <= year <= 2100 and 1 <= month <= 12):
        raise ValueError("Invalid date format")
    if is_end:
        return date(year, month, calendar.monthrange(year, month)[1])
    return date(year, month, 1)


def _parse_flexible_date(raw_value: object, *, is_end: bool) -> Optional[date]:
    if raw_value is None:
        return None

    if not isinstance(raw_value, str):
        raise ValueError("Invalid date format")

    raw = raw_value.strip()
    if not raw:
        return None

    normalized = raw.split("T", 1)[0].split(" ", 1)[0].strip()
    if not normalized:
        return None

    # Keep ISO format support for existing clients.
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", normalized):
        return date.fromisoformat(normalized)

    if re.fullmatch(r"\d{4}[/.]\d{1,2}[/.]\d{1,2}", normalized):
        year_text, month_text, day_text = re.split(r"[/.]", normalized)
        return date(int(year_text), int(month_text), int(day_text))

    delimited_parts = re.split(r"[-/.]", normalized)
    if len(delimited_parts) == 2 and all(part.isdigit() for part in delimited_parts):
        first, second = delimited_parts
        if len(first) == 4:
            return _parse_month_year(int(first), int(second), is_end=is_end)
        if len(second) == 4:
            return _parse_month_year(int(second), int(first), is_end=is_end)

    if len(delimited_parts) == 3 and all(part.isdigit() for part in delimited_parts):
        first, second, third = [int(part) for part in delimited_parts]
        if len(delimited_parts[0]) == 4:
            return date(first, second, third)
        if len(delimited_parts[2]) == 4:
            # When ambiguous, prefer day-first to match the historical UI behavior.
            if first > 12:
                day, month = first, second
            elif second > 12:
                month, day = first, second
            else:
                day, month = first, second
            return date(third, month, day)

    # YYYY -> first or last day of year
    if re.fullmatch(r"\d{4}", normalized):
        year = int(normalized)
        return date(year, 12, 31) if is_end else date(year, 1, 1)

    compact = re.sub(r"[-/.]", "", normalized)

    # YYYYMMDD -> exact day
    if re.fullmatch(r"\d{8}", compact):
        leading_year = int(compact[:4])
        trailing_year = int(compact[4:])
        if 1900 <= leading_year <= 2100:
            return date(leading_year, int(compact[4:6]), int(compact[6:8]))
        if 1900 <= trailing_year <= 2100:
            return date(trailing_year, int(compact[2:4]), int(compact[:2]))

    # MMYYYY -> first or last day of month
    if re.fullmatch(r"\d{2}\d{4}", compact):
        month = int(compact[:2])
        year = int(compact[2:])
        if 1 <= month <= 12 and 1900 <= year <= 2100:
            return _parse_month_year(year, month, is_end=is_end)

    # DDMMYY -> exact day, year interpreted as 20YY
    if re.fullmatch(r"\d{6}", compact):
        day = int(compact[:2])
        month = int(compact[2:4])
        yy = int(compact[4:])
        year = 2000 + yy
        return date(year, month, day)

    raise ValueError("Invalid date format")


@lru_cache(maxsize=1)
def _get_studies_column_names() -> set[str]:
    conn_params = get_conn_params()
    with psycopg2.connect(**conn_params) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'studies'
                """
            )
            return {row[0] for row in cursor.fetchall()}


def _resolve_date_filter_columns() -> tuple[Optional[str], Optional[str], Optional[str], Optional[str]]:
    columns = _get_studies_column_names()

    fpi_planned = "planned_fpi_date" if "planned_fpi_date" in columns else None
    lpo_planned = "planned_lpo_date" if "planned_lpo_date" in columns else None

    fpi_actual = "actual_fpi_date" if "actual_fpi_date" in columns else fpi_planned
    lpo_actual = "actual_lpo_date" if "actual_lpo_date" in columns else lpo_planned

    return fpi_actual, fpi_planned, lpo_actual, lpo_planned


def _build_common_study_filters(
    search: Optional[str],
    therapeutic_area: Optional[List[str]],
    phase: Optional[str],
    status: Optional[str],
    portfolio: Optional[str],
    program: Optional[str],
    region: Optional[str],
    fpi_start_date: Optional[date],
    fpi_end_date: Optional[date],
    lpo_start_date: Optional[date],
    lpo_end_date: Optional[date],
) -> tuple[List[str], List]:
    where_clauses: List[str] = []
    params: List = []

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

    if therapeutic_area:
        normalized_values = [value.strip().lower() for value in therapeutic_area if value.strip()]
        if normalized_values:
            where_clauses.append("LOWER(therapeutic_area) = ANY(%s)")
            params.append(normalized_values)

    if phase:
        db_phase = _phase_to_db_value(phase)
        if not db_phase:
            raise ValueError("Invalid query parameter")
        where_clauses.append("phase = %s")
        params.append(db_phase)

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

    if any([fpi_start_date, fpi_end_date, lpo_start_date, lpo_end_date]):
        fpi_actual_column, fpi_planned_column, lpo_actual_column, lpo_planned_column = _resolve_date_filter_columns()
    else:
        fpi_actual_column = None
        fpi_planned_column = None
        lpo_actual_column = None
        lpo_planned_column = None

    _apply_fpi_lpo_date_filters(
        where_clauses,
        params,
        fpi_start_date,
        fpi_end_date,
        lpo_start_date,
        lpo_end_date,
        fpi_actual_column,
        fpi_planned_column,
        lpo_actual_column,
        lpo_planned_column,
    )

    return where_clauses, params


@router.get(
    "/study-protocol/studies",
    response_model=StudiesPage,
    operation_id="getStudies",
    summary="Get paginated studies",
    responses={
        400: {"model": ErrorResponse, "description": "Invalid query parameters"},
        500: {"model": ErrorResponse, "description": "Unexpected server error"},
    },
)
@router.get(
    "/study-protocol/",
    response_model=StudiesPage,
    operation_id="getStudiesTrailingSlash",
    summary="Get paginated studies",
    include_in_schema=False,
)
def get_studies(
    page: str = Query(..., description="1-based page index"),
    limit: str = Query(..., description="Number of records per page"),
    search: Optional[str] = Query(None, description="Free-text search across study fields"),
    therapeutic_area: Optional[List[str]] = Query(
        None,
        alias="therapeuticArea",
        description="Repeat this query param for multi-select values.",
    ),
    phase: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    portfolio: Optional[str] = Query(None),
    program: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    fpi_start_date_raw: Optional[str] = Query(None, alias="fpiStartDate", description="Apply on actual_fpi_date >= value. Supports YYYY-MM-DD, DDMMYY, MMYYYY, YYYY"),
    fpi_end_date_raw: Optional[str] = Query(None, alias="fpiEndDate", description="Apply on actual_fpi_date <= value and planned_fpi_date <= value. Supports YYYY-MM-DD, DDMMYY, MMYYYY, YYYY"),
    lpo_start_date_raw: Optional[str] = Query(None, alias="lpoStartDate", description="Apply on actual_lpo_date >= value. Supports YYYY-MM-DD, DDMMYY, MMYYYY, YYYY"),
    lpo_end_date_raw: Optional[str] = Query(None, alias="lpoEndDate", description="Apply on planned_lpo_date <= value. Supports YYYY-MM-DD, DDMMYY, MMYYYY, YYYY"),
    sort_by: Optional[str] = Query(SortBy.ID.value, alias="sortBy"),
    sort_order: Optional[str] = Query(SortOrder.ASC.value, alias="sortOrder"),
    include_total: bool = Query(True, alias="includeTotal", description="When true (default), runs an exact COUNT(*) query so the UI shows the correct total. Pass false to skip the count query for faster lazy-loading pages where the total is already known."),
):
    try:
        page = _clean_required_text(page)
        limit = _clean_required_text(limit)
        search = _clean_optional_text(search)
        therapeutic_area = _clean_optional_text_list(therapeutic_area)
        phase = _clean_optional_text(phase)
        status = _clean_optional_text(status)
        portfolio = _clean_optional_text(portfolio)
        program = _clean_optional_text(program)
        region = _clean_optional_text(region)
        fpi_start_date_raw = _clean_optional_text(fpi_start_date_raw)
        fpi_end_date_raw = _clean_optional_text(fpi_end_date_raw)
        lpo_start_date_raw = _clean_optional_text(lpo_start_date_raw)
        lpo_end_date_raw = _clean_optional_text(lpo_end_date_raw)
        sort_by = _clean_required_text(sort_by)
        sort_order = _clean_required_text(sort_order)
    except ValueError:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    parsed_page = _parse_positive_int(page)
    parsed_limit = _parse_positive_int(limit)
    if not parsed_page or not parsed_limit:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    allowed_statuses = {item.value for item in StudyStatus}
    allowed_sort_by = set(SORT_COLUMN_MAP.keys())
    allowed_sort_order = {item.value for item in SortOrder}

    if status and status not in allowed_statuses:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})
    if sort_by not in allowed_sort_by or sort_order not in allowed_sort_order:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    try:
        parsed_fpi_start_date = _parse_flexible_date(fpi_start_date_raw, is_end=False)
        parsed_fpi_end_date = _parse_flexible_date(fpi_end_date_raw, is_end=True)
        parsed_lpo_start_date = _parse_flexible_date(lpo_start_date_raw, is_end=False)
        parsed_lpo_end_date = _parse_flexible_date(lpo_end_date_raw, is_end=True)
        _validate_date_range(parsed_fpi_start_date, parsed_fpi_end_date)
        _validate_date_range(parsed_lpo_start_date, parsed_lpo_end_date)
    except ValueError:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    try:
        where_clauses, params = _build_common_study_filters(
            search=search,
            therapeutic_area=therapeutic_area,
            phase=phase,
            status=status,
            portfolio=portfolio,
            program=program,
            region=region,
            fpi_start_date=parsed_fpi_start_date,
            fpi_end_date=parsed_fpi_end_date,
            lpo_start_date=parsed_lpo_start_date,
            lpo_end_date=parsed_lpo_end_date,
        )
    except ValueError:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})
    except Exception:
        logger.exception("Failed to build study filters")
        return JSONResponse(status_code=500, content={"message": "Internal server error"})

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
    sort_sql = SORT_COLUMN_MAP[sort_by]
    order_sql = sort_order.upper()
    offset = (parsed_page - 1) * parsed_limit

    # Always add study_id as a secondary sort key for deterministic ordering
    order_by_clause = f"{sort_sql} {order_sql}, study_id ASC"

    count_query = f"SELECT COUNT(*) FROM public.studies {where_sql}"
    data_query = f"""
        SELECT
            study_id, phase, therapeutic_area, indication, title, portfolio, program,
            study_status, project_priority, target_enrollment, actual_enrollment,
            {PERCENT_VS_PLAN_SQL} AS enrollment_plan_percent,
            countries_count, sites_count
        FROM public.studies
        {where_sql}
        ORDER BY {order_by_clause}
        LIMIT %s OFFSET %s
    """

    conn_params = get_conn_params()
    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                cursor.execute(data_query, params + [parsed_limit + 1, offset])
                rows = cursor.fetchall()

                has_more = len(rows) > parsed_limit
                if has_more:
                    rows = rows[:parsed_limit]

                if include_total:
                    cursor.execute(count_query, params)
                    total = int(cursor.fetchone()[0])
                else:
                    total = offset + len(rows) + (1 if has_more else 0)

        thresholds = get_performance_thresholds()
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
                    performance=_performance_from_percent(db_percent_vs_plan, thresholds),
                    trend=_build_trend(db_actual, db_target),
                )
            )

        return StudiesPage(
            items=items,
            page=parsed_page,
            limit=parsed_limit,
            total=total,
            hasMore=has_more,
        )
    except ValueError:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})
    except Exception:
        logger.exception("Failed to fetch studies")
        return JSONResponse(status_code=500, content={"message": "Internal server error"})


@router.get("/health")
def health():
    try:
        conn_params = get_conn_params()
        if not conn_params["password"]:
            raise ValueError("PGPASSWORD is not set.")
        with psycopg2.connect(**conn_params):
            pass
        return {"status": "ok"}
    except Exception:
        logger.exception("Database health check failed")
        raise HTTPException(status_code=500, detail="Database health check failed")


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
    except Exception:
        logger.exception("Failed to fetch DB version")
        raise HTTPException(status_code=500, detail="Failed to fetch DB version")

@router.get("/study-protocol/active-count")
def get_active_studies_count():
    conn_params = get_conn_params()
    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT COUNT(*) FROM public.studies
                    WHERE study_status IN ('Active','RECRUITING','follow up')
                """)
                count = cursor.fetchone()[0]
                return {"active_studies_count": count}
    except Exception:
        logger.exception("Failed to fetch active studies count")
        raise HTTPException(status_code=500, detail="Failed to fetch active studies count")


@router.get("/study-protocol/on-track")
def get_on_track_percentage():
    conn_params = get_conn_params()
    try:
        thresholds = get_performance_thresholds()
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    f"""
                    SELECT
                        {PERCENT_VS_PLAN_SQL}
                    FROM public.studies
                    WHERE UPPER(COALESCE(study_status, '')) IN ('RECRUITING', 'FOLLOW UP')
                    """
                )
                percent_values = [float(row[0] or 0) for row in cursor.fetchall()]
                total_active_studies = len(percent_values)
                on_track_studies_count, _, _ = _count_performance_groups(percent_values, thresholds)
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
    except Exception:
        logger.exception("Failed to fetch on-track percentage")
        raise HTTPException(status_code=500, detail="Failed to fetch on-track percentage")


@router.get("/study-protocol/off-track-or-at-risk")
def get_off_track_or_at_risk_percentage():
    conn_params = get_conn_params()
    try:
        thresholds = get_performance_thresholds()
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    f"""
                    SELECT
                        {PERCENT_VS_PLAN_SQL}
                    FROM public.studies
                    WHERE UPPER(COALESCE(study_status, '')) IN ('RECRUITING', 'FOLLOW UP')
                    """
                )
                percent_values = [float(row[0] or 0) for row in cursor.fetchall()]
                total_active_studies = len(percent_values)
                _, at_risk_count, off_track_count = _count_performance_groups(percent_values, thresholds)
                off_track_or_at_risk_studies_count = at_risk_count + off_track_count
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
    except Exception:
        logger.exception("Failed to fetch off-track or at-risk percentage")
        raise HTTPException(status_code=500, detail="Failed to fetch off-track or at-risk percentage")


@router.get("/study-protocol/enrollment-vs-target")
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
                    FROM public.studies
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
    except Exception:
        logger.exception("Failed to fetch enrollment vs target")
        raise HTTPException(status_code=500, detail="Failed to fetch enrollment vs target")


@router.get("/study-protocol/velocity-vs-plan")
def get_average_velocity_vs_plan():
    conn_params = get_conn_params()
    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    f"""
                    SELECT
                        COALESCE(
                            AVG({PERCENT_VS_PLAN_SQL}) FILTER (
                                WHERE UPPER(COALESCE(study_status, '')) IN ('ACTIVE', 'RECRUITING', 'FOLLOW UP')
                            ),
                            0
                        ) AS average_velocity_vs_plan
                    FROM public.studies
                    """
                )

                average_velocity_vs_plan = round(float(cursor.fetchone()[0]), 2)
                return {"average_velocity_vs_plan": average_velocity_vs_plan}
    except Exception:
        logger.exception("Failed to fetch average velocity vs plan")
        raise HTTPException(status_code=500, detail="Failed to fetch average velocity vs plan")

@router.get("/study-protocol/kpi-details")
def get_kpi_details(
    request: Request = None,
    search: Optional[str] = Query(None),
    therapeutic_area: Optional[List[str]] = Query(None, alias="therapeuticArea"),
    phase: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    portfolio: Optional[str] = Query(None),
    program: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    fpi_start_date_raw: Optional[str] = Query(None, alias="fpiStartDate", description="Apply on actual_fpi_date >= value. Supports YYYY-MM-DD, DDMMYY, MMYYYY, YYYY"),
    fpi_end_date_raw: Optional[str] = Query(None, alias="fpiEndDate", description="Apply on actual_fpi_date <= value and planned_fpi_date <= value. Supports YYYY-MM-DD, DDMMYY, MMYYYY, YYYY"),
    lpo_start_date_raw: Optional[str] = Query(None, alias="lpoStartDate", description="Apply on actual_lpo_date >= value. Supports YYYY-MM-DD, DDMMYY, MMYYYY, YYYY"),
    lpo_end_date_raw: Optional[str] = Query(None, alias="lpoEndDate", description="Apply on planned_lpo_date <= value. Supports YYYY-MM-DD, DDMMYY, MMYYYY, YYYY"),
):
    if request is not None and request.method.upper() != "GET":
        return JSONResponse(status_code=405, content={"detail": "Method Not Allowed"})

    try:
        search = _clean_optional_text(search)
        therapeutic_area = _clean_optional_text_list(therapeutic_area)
        phase = _clean_optional_text(phase)
        status = _clean_optional_text(status)
        portfolio = _clean_optional_text(portfolio)
        program = _clean_optional_text(program)
        region = _clean_optional_text(region)
        fpi_start_date_raw = _clean_optional_text(fpi_start_date_raw)
        fpi_end_date_raw = _clean_optional_text(fpi_end_date_raw)
        lpo_start_date_raw = _clean_optional_text(lpo_start_date_raw)
        lpo_end_date_raw = _clean_optional_text(lpo_end_date_raw)
        parsed_fpi_start_date = _parse_flexible_date(fpi_start_date_raw, is_end=False)
        parsed_fpi_end_date = _parse_flexible_date(fpi_end_date_raw, is_end=True)
        parsed_lpo_start_date = _parse_flexible_date(lpo_start_date_raw, is_end=False)
        parsed_lpo_end_date = _parse_flexible_date(lpo_end_date_raw, is_end=True)
        _validate_date_range(parsed_fpi_start_date, parsed_fpi_end_date)
        _validate_date_range(parsed_lpo_start_date, parsed_lpo_end_date)
    except ValueError:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    allowed_statuses = {item.value for item in StudyStatus}
    if status and status not in allowed_statuses:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    try:
        where_clauses, params = _build_common_study_filters(
            search=search,
            therapeutic_area=therapeutic_area,
            phase=phase,
            status=status,
            portfolio=portfolio,
            program=program,
            region=region,
            fpi_start_date=parsed_fpi_start_date,
            fpi_end_date=parsed_fpi_end_date,
            lpo_start_date=parsed_lpo_start_date,
            lpo_end_date=parsed_lpo_end_date,
        )
    except ValueError:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})
    except Exception:
        logger.exception("Failed to build KPI filters")
        raise HTTPException(status_code=500, detail="Failed to build KPI filters")

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    conn_params = get_conn_params()
    try:
        thresholds = get_performance_thresholds()
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    f"""
                    SELECT
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
                            AVG({PERCENT_VS_PLAN_SQL}) FILTER (
                                WHERE UPPER(COALESCE(study_status, '')) IN ('ACTIVE', 'RECRUITING', 'FOLLOW UP')
                            ), 0
                        ) AS average_velocity_vs_plan

                    FROM public.studies
                    {where_sql}
                    """,
                    params,
                )

                (
                    total_actual_enrollment,
                    total_target_enrollment,
                    average_velocity_vs_plan,
                ) = cursor.fetchone()

                active_where_sql = f"{where_sql} AND UPPER(COALESCE(study_status, '')) IN ('ACTIVE', 'RECRUITING', 'FOLLOW UP')" if where_sql else "WHERE UPPER(COALESCE(study_status, '')) IN ('ACTIVE', 'RECRUITING', 'FOLLOW UP')"
                cursor.execute(
                    f"""
                    SELECT
                        {PERCENT_VS_PLAN_SQL}
                    FROM public.studies
                    {active_where_sql}
                    """,
                    params,
                )
                percent_values = [float(row[0] or 0) for row in cursor.fetchall()]
                active_studies_count = len(percent_values)
                on_track_count, at_risk_count, off_track_count = _count_performance_groups(percent_values, thresholds)
                off_track_or_at_risk_count = at_risk_count + off_track_count

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
                    "schedule_adherence": {
                        "percentage": enrollment_percentage,
                        "actual_enrollment": total_actual_enrollment,
                        "planned_enrollment": total_target_enrollment,
                    },
                    "velocity_vs_plan": {
                        "average": round(float(average_velocity_vs_plan), 2),
                    },
                }
    except Exception:
        logger.exception("Failed to fetch KPI details")
        raise HTTPException(status_code=500, detail="Failed to fetch KPI details")