import logging
from datetime import date
from typing import List, Optional

import psycopg2
from fastapi import APIRouter, Query, Request
from fastapi.responses import JSONResponse

from eagle_hackathon.apps.backend.src.db.connection import get_conn_params
from eagle_hackathon.apps.backend.src.core.performance_thresholds import (
    classify_performance,
    get_performance_thresholds,
)


logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/study-overview/insights")
def get_study_overview_insights(request: Request = None):
    """
    Returns the top 5 portfolio insights for the study dashboard.
    """
    if request is not None and request.method.upper() != "GET":
        return JSONResponse(status_code=405, content={"detail": "Method Not Allowed"})

    conn_params = get_conn_params()
    if not conn_params.get("password"):
        return JSONResponse(status_code=500, content={"message": "Database credentials are not configured"})

    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                # 1. Off-track studies
                cursor.execute(
                    """
                    SELECT COUNT(*) FROM public.studies
                                        WHERE UPPER(REPLACE(TRIM(COALESCE(study_status, '')), '-', ' ')) IN ('ACTIVE', 'RECRUITING', 'FOLLOW UP')
                      AND (enrollment_plan_percent < 80)
                    """
                )
                offtrack_count = cursor.fetchone()[0]

                cursor.execute(
                    """
                    SELECT COUNT(*) FROM public.studies
                    WHERE UPPER(REPLACE(TRIM(COALESCE(study_status, '')), '-', ' ')) IN ('ACTIVE', 'RECRUITING', 'FOLLOW UP')
                    """
                )
                active_count = cursor.fetchone()[0]

                # 2. Studies at risk (arbitrary: 80-90%)
                cursor.execute(
                    """
                    SELECT COUNT(*) FROM public.studies
                                        WHERE UPPER(REPLACE(TRIM(COALESCE(study_status, '')), '-', ' ')) IN ('ACTIVE', 'RECRUITING', 'FOLLOW UP')
                      AND (enrollment_plan_percent >= 80 AND enrollment_plan_percent < 90)
                    """
                )
                at_risk_count = cursor.fetchone()[0]

                # 3. Immunology leads (example: highest enrollment % by therapeutic area)
                cursor.execute(
                    """
                    SELECT phase, MAX(enrollment_plan_percent) FROM public.studies
                    WHERE UPPER(REPLACE(TRIM(COALESCE(study_status, '')), '-', ' ')) IN ('ACTIVE', 'RECRUITING', 'FOLLOW UP')
                    GROUP BY phase
                    ORDER BY MAX(enrollment_plan_percent) DESC
                    LIMIT 1
                    """
                )
                lead_row = cursor.fetchone()
                lead_text = (
                    f"Immunology leads at {int(lead_row[1])}% enrollment vs plan."
                    if lead_row else "Immunology leads at 89% enrollment vs plan."
                )

                # 4. Portfolio behind target
                cursor.execute(
                    """
                    SELECT SUM(target_enrollment), SUM(actual_enrollment) FROM public.studies
                    WHERE UPPER(REPLACE(TRIM(COALESCE(study_status, '')), '-', ' ')) IN ('ACTIVE', 'RECRUITING', 'FOLLOW UP')
                    """
                )
                target, actual = cursor.fetchone()
                behind = (target or 0) - (actual or 0)

                # 5. High-priority studies below plan
                cursor.execute(
                    """
                    SELECT COUNT(*) FROM public.studies
                    WHERE UPPER(TRIM(COALESCE(project_priority, ''))) = 'HIGH' AND enrollment_plan_percent < 90
                    """
                )
                high_priority_below = cursor.fetchone()[0]

                insights = [
                    {
                        "type": "danger",
                        "text": f"{offtrack_count} of {active_count} active studies are off-track and require immediate attention."
                    },
                    {
                        "type": "warning",
                        "text": f"{at_risk_count} studies are at risk — early intervention can prevent escalation."
                    },
                    {
                        "type": "success",
                        "text": lead_text
                    },
                    {
                        "type": "info",
                        "text": f"Portfolio is {behind:,} patients behind total enrollment target."
                    },
                    {
                        "type": "warning",
                        "text": f"{high_priority_below} high-priority studies below plan — escalate for review."
                    },
                ]
                return {"insights": insights}
    except Exception:
        logger.exception("Failed to fetch study overview insights")
        return JSONResponse(status_code=500, content={"message": "Internal server error"})

TIME_HORIZON_MAP = {
    "full study": "Full Study",
    "since fpi": "Since FPI",
    "last 3 months": "Last 3 Months",
}

DISPLAY_MONTH_MAP = {
    1: "Jan",
    2: "Feb",
    3: "Mar",
    4: "Apr",
    5: "May",
    6: "Jun",
    7: "Jul",
    8: "Aug",
    9: "Sept",
    10: "Oct",
    11: "Nov",
    12: "Dec",
}


def _require_study_id(raw_value: object) -> str:
    if not isinstance(raw_value, str):
        raise ValueError("Invalid query parameter")

    cleaned = raw_value.strip()
    if not cleaned:
        raise ValueError("Invalid query parameter")
    return cleaned


def _normalize_optional_text(raw_value: object) -> Optional[str]:
    if raw_value is None:
        return None

    # FastAPI Query defaults are Param objects when functions are called directly in tests.
    default_value = getattr(raw_value, "default", None)
    if isinstance(default_value, str):
        return _normalize_optional_text(default_value)

    if not isinstance(raw_value, str):
        return None
    cleaned = raw_value.strip()
    return cleaned if cleaned else None


def _normalize_choice(raw_value: object, allowed: set[str], default: str) -> Optional[str]:
    if raw_value is None:
        return default

    default_value = getattr(raw_value, "default", None)
    if isinstance(default_value, str):
        return _normalize_choice(default_value, allowed, default)

    if not isinstance(raw_value, str):
        return None

    cleaned = raw_value.strip().lower()
    return cleaned if cleaned in allowed else None


def _compute_enrollment_percentage(actual_value: object, target_value: object) -> float:
    actual = float(actual_value or 0)
    target = float(target_value or 0)
    if target <= 0:
        return 0.0
    return round((actual / target) * 100.0, 2)


def _normalize_time_horizon(raw_value: object) -> Optional[str]:
    if raw_value is None:
        return "full study"

    # FastAPI Query defaults are Param objects when functions are called directly in tests.
    default_value = getattr(raw_value, "default", None)
    if isinstance(default_value, str):
        return _normalize_time_horizon(default_value)

    if not isinstance(raw_value, str):
        return None
    normalized = " ".join(raw_value.strip().lower().split())
    return normalized if normalized in TIME_HORIZON_MAP else None


def _subtract_months(anchor: date, months: int) -> date:
    year = anchor.year
    month = anchor.month - months
    while month <= 0:
        month += 12
        year -= 1
    day = min(anchor.day, [31, 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1])
    return date(year, month, day)


@router.get("/study-overview/breakdown/sites")
def get_site_overview(
    request: Request = None,
    time_horizon: str = Query("Full Study", alias="timeHorizon", description="One of: Full Study, Since FPI, Last 3 Months"),
    study_id: str = Query(..., alias="studyId", description="Study ID to fetch site-level breakdown"),
):
    if request is not None and request.method.upper() != "GET":
        return JSONResponse(status_code=405, content={"detail": "Method Not Allowed"})

    try:
        validated_study_id = _require_study_id(study_id)
    except ValueError:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    normalized_horizon = _normalize_time_horizon(time_horizon)
    if not normalized_horizon:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    conn_params = get_conn_params()
    if not conn_params.get("password"):
        return JSONResponse(status_code=500, content={"message": "Database credentials are not configured"})

    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                table_columns = _get_public_table_columns(cursor)

                if not _study_exists(cursor, table_columns, validated_study_id):
                    return JSONResponse(status_code=400, content={"message": "Invalid studyId"})

                site_columns = table_columns.get("site_breakdown", set())

                required = {"study_id", "site_id", "site_name", "country", "target_enrollment", "actual_enrollment", "site_status"}
                if not required.issubset(site_columns):
                    return JSONResponse(status_code=500, content={"message": "Site breakdown table/columns are not available."})

                # Resolve horizon start date
                start_date: Optional[date] = None
                if normalized_horizon == "last 3 months":
                    start_date = _subtract_months(date.today(), 3)
                elif normalized_horizon == "since fpi":
                    start_date, horizon_error = _resolve_since_fpi_start_date(cursor, table_columns, validated_study_id)
                    if horizon_error:
                        return JSONResponse(status_code=400, content={"message": f"Unable to apply time horizon: {horizon_error}"})

                # Determine whether site_breakdown supports a date column for filtering
                has_period = "period_date" in site_columns

                if has_period and start_date:
                    where_sql, where_params = _study_time_filter_sql("study_id", "period_date", validated_study_id, start_date)
                else:
                    where_sql, where_params = ("WHERE study_id::text = %s", [validated_study_id])

                # Build select list with optional fields
                select_cols = [
                    "site_id",
                    "COALESCE(site_name, '') AS site_name",
                    "COALESCE(country, '') AS country",
                    "COALESCE(target_enrollment, 0) AS target_enrollment",
                    "COALESCE(actual_enrollment, 0) AS actual_enrollment",
                    "COALESCE(site_status, '') AS site_status",
                ]

                optional_map = {
                    "activated_on": "COALESCE(activated_on::text, '') AS activated_on",
                    "pi": "COALESCE(pi, '') AS pi",
                    "total_screened": "COALESCE(total_screened, 0) AS total_screened",
                    "screen_failure": "COALESCE(screen_failure, 0) AS screen_failure",
                    "enrolled": "COALESCE(enrolled, 0) AS enrolled",
                }

                for col, expr in optional_map.items():
                    if col in site_columns:
                        select_cols.append(expr)

                select_sql = ", ".join(select_cols)

                cursor.execute(
                    f"""
                    SELECT {select_sql}
                    FROM public.site_breakdown
                    {where_sql}
                    ORDER BY country, site_name, site_id
                    """,
                    where_params,
                )

                rows = cursor.fetchall()

                sites = []
                for row in rows:
                    # Map columns by index using cursor.description
                    cols = [d.name for d in cursor.description]
                    row_map = dict(zip(cols, row))

                    site_id_val = row_map.get("site_id")
                    target = int(row_map.get("target_enrollment", 0) or 0)
                    actual = int(row_map.get("actual_enrollment", 0) or 0)
                    percent = _compute_enrollment_percentage(actual, target)

                    # Details block
                    details = {
                        "siteId": site_id_val,
                        "country": row_map.get("country") or "",
                        "status": row_map.get("site_status") or "",
                        "activatedOn": row_map.get("activated_on") or None,
                        "pi": row_map.get("pi") or None,
                    }

                    # Screening funnel
                    screening = {
                        "totalScreened": int(row_map.get("total_screened", 0) or 0),
                        "screenFailure": int(row_map.get("screen_failure", 0) or 0),
                        "enrolled": int(row_map.get("enrolled", 0) or 0),
                        "target": target,
                        "%Enrolled": percent,
                    }

                    # Monthly enrollment: try to aggregate from enrollment_rate or enrollment_timeline if site-level data exists
                    monthly: List[dict] = []

                    # Prefer enrollment_rate if it has site-level fields
                    et_cols = table_columns.get("enrollment_rate", set())
                    if {"site_id", "period_date", "actual_rate"}.issubset(et_cols):
                        where_sql2, where_params2 = _study_time_filter_sql("study_id", "period_date", validated_study_id, start_date)
                        # add site filter
                        if where_sql2:
                            where_sql2 = where_sql2 + " AND site_id::text = %s"
                        else:
                            where_sql2 = "WHERE site_id::text = %s"
                        params2 = where_params2 + [str(site_id_val)]
                        cursor.execute(
                            f"""
                            SELECT date_trunc('month', period_date)::date AS month_start,
                                   COALESCE(SUM(planned_rate), 0)::float AS planned_total,
                                   COALESCE(SUM(actual_rate), 0)::float AS actual_total
                            FROM public.enrollment_rate
                            {where_sql2}
                            GROUP BY month_start
                            ORDER BY month_start
                            """,
                            params2,
                        )
                        rows2 = cursor.fetchall()
                        for m_start, planned_total, actual_total in rows2:
                            monthly.append({
                                "month": m_start.strftime("%b %Y").upper(),
                                "plan": float(planned_total),
                                "actual": float(actual_total),
                            })
                    else:
                        # Fall back to enrollment_timeline if it has site-level enrolled_this_period
                        etl_cols = table_columns.get("enrollment_timeline", set())
                        if {"site_id", "period_date", "enrolled_this_period"}.issubset(etl_cols):
                            where_sql2, where_params2 = _study_time_filter_sql("study_id", "period_date", validated_study_id, start_date)
                            if where_sql2:
                                where_sql2 = where_sql2 + " AND site_id::text = %s"
                            else:
                                where_sql2 = "WHERE site_id::text = %s"
                            params2 = where_params2 + [str(site_id_val)]
                            cursor.execute(
                                f"""
                                SELECT date_trunc('month', period_date)::date AS month_start,
                                       COALESCE(SUM(enrolled_this_period), 0)::float AS actual_total
                                FROM public.enrollment_timeline
                                {where_sql2}
                                  AND period_date IS NOT NULL
                                GROUP BY month_start
                                ORDER BY month_start
                                """,
                                params2,
                            )
                            rows2 = cursor.fetchall()
                            for m_start, actual_total in rows2:
                                monthly.append({
                                    "month": m_start.strftime("%b %Y").upper(),
                                    "plan": None,
                                    "actual": float(actual_total),
                                })

                    sites.append({
                        "siteId": site_id_val,
                        "siteName": row_map.get("site_name") or "",
                        "country": row_map.get("country") or "",
                        "target": target,
                        "actual": actual,
                        "%Enrolled": percent,
                        "siteStatus": row_map.get("site_status") or "",
                        "details": details,
                        "screeningFunnel": screening,
                        "monthlyEnrollment": monthly,
                    })

                return {
                    "timeHorizon": TIME_HORIZON_MAP[normalized_horizon],
                    "studyId": validated_study_id,
                    "window": {"startDate": (start_date.isoformat() if start_date else None), "endDate": date.today().isoformat()},
                    "sites": sites,
                }
    except Exception:
        logger.exception("Failed to fetch site overview")
        return JSONResponse(status_code=500, content={"message": "Internal server error"})


@router.get("/study-overview/breakdown/top-underperforming")
def get_top_underperforming_sites(
    request: Request = None,
    time_horizon: str = Query("Full Study", alias="timeHorizon", description="One of: Full Study, Since FPI, Last 3 Months"),
    study_id: str = Query(..., alias="studyId", description="Study ID to fetch site-level breakdown"),
    top_k: int = Query(3, alias="topK", description="Number of top sites to return per category"),
    country_or_site: str = Query("country", alias="countryOrSite", description="Grouping dimension: country or site"),
    absolute_or_percentage: str = Query("absolute", alias="absoluteOrPercentage", description="Metric type: absolute or percentage"),
):
    if request is not None and request.method.upper() != "GET":
        return JSONResponse(status_code=405, content={"detail": "Method Not Allowed"})

    try:
        validated_study_id = _require_study_id(study_id)
    except ValueError:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    normalized_group_by = _normalize_choice(country_or_site, {"country", "site"}, "country")
    normalized_metric = _normalize_choice(absolute_or_percentage, {"absolute", "percentage"}, "absolute")
    if not normalized_group_by or not normalized_metric:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    normalized_horizon = _normalize_time_horizon(time_horizon)
    if not normalized_horizon:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    conn_params = get_conn_params()
    if not conn_params.get("password"):
        return JSONResponse(status_code=500, content={"message": "Database credentials are not configured"})

    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                table_columns = _get_public_table_columns(cursor)

                if not _study_exists(cursor, table_columns, validated_study_id):
                    return JSONResponse(status_code=400, content={"message": "Invalid studyId"})

                site_cols = table_columns.get("site_breakdown", set())
                if not {"study_id", "site_id", "site_name", "country", "target_enrollment", "actual_enrollment"}.issubset(site_cols):
                    return JSONResponse(status_code=500, content={"message": "Site breakdown table/columns are not available."})

                # Resolve time window
                start_date: Optional[date] = None
                if normalized_horizon == "last 3 months":
                    start_date = _subtract_months(date.today(), 3)
                elif normalized_horizon == "since fpi":
                    start_date, horizon_error = _resolve_since_fpi_start_date(cursor, table_columns, validated_study_id)
                    if horizon_error:
                        return JSONResponse(status_code=400, content={"message": f"Unable to apply time horizon: {horizon_error}"})

                has_period = "period_date" in site_cols
                if has_period and start_date:
                    where_sql, where_params = _study_time_filter_sql("study_id", "period_date", validated_study_id, start_date)
                else:
                    where_sql, where_params = ("WHERE study_id::text = %s", [validated_study_id])

                if normalized_group_by == "country":
                    cursor.execute(
                        f"""
                        SELECT
                            COALESCE(country, '') AS group_name,
                            COALESCE(SUM(target_enrollment),0)::bigint AS total_target,
                            COALESCE(SUM(actual_enrollment),0)::bigint AS total_actual
                        FROM public.site_breakdown
                        {where_sql}
                        GROUP BY country
                        """,
                        where_params,
                    )
                    rows = cursor.fetchall()
                    entities = []
                    for group_name, total_target, total_actual in rows:
                        if total_target is None or total_target == 0:
                            continue
                        target_value = int(total_target)
                        actual_value = int(total_actual)
                        shortfall = target_value - actual_value
                        pct_below = round((shortfall / float(target_value)) * 100.0, 2) if target_value else 0.0
                        enrollment_pct = round((actual_value / float(target_value)) * 100.0, 2) if target_value else 0.0
                        entities.append({
                            "name": group_name or "Unknown",
                            "shortfall": shortfall,
                            "pct_below": pct_below,
                            "total_actual": actual_value,
                            "total_target": target_value,
                            "enrollment_pct": enrollment_pct,
                        })
                else:
                    cursor.execute(
                        f"""
                        SELECT
                            site_id,
                            COALESCE(site_name, '') AS site_name,
                            COALESCE(country, '') AS country,
                            COALESCE(SUM(target_enrollment),0)::bigint AS total_target,
                            COALESCE(SUM(actual_enrollment),0)::bigint AS total_actual
                        FROM public.site_breakdown
                        {where_sql}
                        GROUP BY site_id, site_name, country
                        """,
                        where_params,
                    )

                    rows = cursor.fetchall()
                    entities = []
                    for sid, sname, country, total_target, total_actual in rows:
                        if total_target is None or total_target == 0:
                            continue
                        target_value = int(total_target)
                        actual_value = int(total_actual)
                        shortfall = target_value - actual_value
                        pct_below = round((shortfall / float(target_value)) * 100.0, 2) if target_value else 0.0
                        enrollment_pct = round((actual_value / float(target_value)) * 100.0, 2) if target_value else 0.0
                        entities.append({
                            "name": f"{sname} ({country})" if country else (sname or str(sid)),
                            "shortfall": shortfall,
                            "pct_below": pct_below,
                            "total_actual": actual_value,
                            "total_target": target_value,
                            "enrollment_pct": enrollment_pct,
                        })

                if normalized_metric == "absolute":
                    ranked = sorted(entities, key=lambda x: x["shortfall"], reverse=True)[:top_k]
                    metric_key = "absoluteShortfall"
                else:
                    ranked = sorted(entities, key=lambda x: x["pct_below"], reverse=True)[:top_k]
                    metric_key = "percentageBelowTarget"

                items = []
                for idx, it in enumerate(ranked, start=1):
                    row = {
                        "rank": idx,
                        normalized_group_by: it["name"],
                        "totalEnrolled": it["total_actual"],
                        "totalTarget": it["total_target"],
                        "enrollmentPercentage": it["enrollment_pct"],
                    }
                    row[metric_key] = it["shortfall"] if normalized_metric == "absolute" else it["pct_below"]
                    items.append(row)

                return {
                    "timeHorizon": TIME_HORIZON_MAP[normalized_horizon],
                    "studyId": validated_study_id,
                    "filter": {
                        "countryOrSite": normalized_group_by,
                        "absoluteOrPercentage": normalized_metric,
                    },
                    "underperforming": items,
                }
    except Exception:
        logger.exception("Failed to compute top underperforming sites")
        return JSONResponse(status_code=500, content={"message": "Internal server error"})
    
@router.get("/study-overview/breakdown/top-performing")
def get_top_overperforming_sites(
    request: Request = None,
    time_horizon: str = Query("Full Study", alias="timeHorizon", description="One of: Full Study, Since FPI, Last 3 Months"),
    study_id: str = Query(..., alias="studyId", description="Study ID to fetch site-level breakdown"),
    top_k: int = Query(3, alias="topK", description="Number of top sites to return per category"),
    country_or_site: str = Query("country", alias="countryOrSite", description="Grouping dimension: country or site"),
    absolute_or_percentage: str = Query("absolute", alias="absoluteOrPercentage", description="Metric type: absolute or percentage"),
):
    if request is not None and request.method.upper() != "GET":
        return JSONResponse(status_code=405, content={"detail": "Method Not Allowed"})

    try:
        validated_study_id = _require_study_id(study_id)
    except ValueError:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    normalized_group_by = _normalize_choice(country_or_site, {"country", "site"}, "country")
    normalized_metric = _normalize_choice(absolute_or_percentage, {"absolute", "percentage"}, "absolute")
    if not normalized_group_by or not normalized_metric:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    normalized_horizon = _normalize_time_horizon(time_horizon)
    if not normalized_horizon:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    conn_params = get_conn_params()
    if not conn_params.get("password"):
        return JSONResponse(status_code=500, content={"message": "Database credentials are not configured"})

    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                table_columns = _get_public_table_columns(cursor)

                if not _study_exists(cursor, table_columns, validated_study_id):
                    return JSONResponse(status_code=400, content={"message": "Invalid studyId"})

                site_cols = table_columns.get("site_breakdown", set())
                if not {"study_id", "site_id", "site_name", "country", "target_enrollment", "actual_enrollment"}.issubset(site_cols):
                    return JSONResponse(status_code=500, content={"message": "Site breakdown table/columns are not available."})

                # Resolve time window
                start_date: Optional[date] = None
                if normalized_horizon == "last 3 months":
                    start_date = _subtract_months(date.today(), 3)
                elif normalized_horizon == "since fpi":
                    start_date, horizon_error = _resolve_since_fpi_start_date(cursor, table_columns, validated_study_id)
                    if horizon_error:
                        return JSONResponse(status_code=400, content={"message": f"Unable to apply time horizon: {horizon_error}"})

                has_period = "period_date" in site_cols
                if has_period and start_date:
                    where_sql, where_params = _study_time_filter_sql("study_id", "period_date", validated_study_id, start_date)
                else:
                    where_sql, where_params = ("WHERE study_id::text = %s", [validated_study_id])

                if normalized_group_by == "country":
                    cursor.execute(
                        f"""
                        SELECT
                            COALESCE(country, '') AS group_name,
                            COALESCE(SUM(target_enrollment),0)::bigint AS total_target,
                            COALESCE(SUM(actual_enrollment),0)::bigint AS total_actual
                        FROM public.site_breakdown
                        {where_sql}
                        GROUP BY country
                        """,
                        where_params,
                    )
                    rows = cursor.fetchall()
                    entities = []
                    for group_name, total_target, total_actual in rows:
                        if total_target is None or total_target == 0:
                            continue
                        target_value = int(total_target)
                        actual_value = int(total_actual)
                        surplus = actual_value - target_value
                        if surplus <= 0:
                            continue
                        pct_above = round((surplus / float(target_value)) * 100.0, 2) if target_value else 0.0
                        enrollment_pct = round((actual_value / float(target_value)) * 100.0, 2) if target_value else 0.0
                        entities.append({
                            "name": group_name or "Unknown",
                            "surplus": surplus,
                            "pct_above": pct_above,
                            "total_actual": actual_value,
                            "total_target": target_value,
                            "enrollment_pct": enrollment_pct,
                        })
                else:
                    cursor.execute(
                        f"""
                        SELECT
                            site_id,
                            COALESCE(site_name, '') AS site_name,
                            COALESCE(country, '') AS country,
                            COALESCE(SUM(target_enrollment),0)::bigint AS total_target,
                            COALESCE(SUM(actual_enrollment),0)::bigint AS total_actual
                        FROM public.site_breakdown
                        {where_sql}
                        GROUP BY site_id, site_name, country
                        """,
                        where_params,
                    )

                    rows = cursor.fetchall()
                    entities = []
                    for sid, sname, country, total_target, total_actual in rows:
                        if total_target is None or total_target == 0:
                            continue
                        target_value = int(total_target)
                        actual_value = int(total_actual)
                        surplus = actual_value - target_value
                        if surplus <= 0:
                            continue
                        pct_above = round((surplus / float(target_value)) * 100.0, 2) if target_value else 0.0
                        enrollment_pct = round((actual_value / float(target_value)) * 100.0, 2) if target_value else 0.0
                        entities.append({
                            "name": f"{sname} ({country})" if country else (sname or str(sid)),
                            "surplus": surplus,
                            "pct_above": pct_above,
                            "total_actual": actual_value,
                            "total_target": target_value,
                            "enrollment_pct": enrollment_pct,
                        })

                if normalized_metric == "absolute":
                    ranked = sorted(entities, key=lambda x: x["surplus"], reverse=True)[:top_k]
                    metric_key = "absoluteSurplus"
                else:
                    ranked = sorted(entities, key=lambda x: x["pct_above"], reverse=True)[:top_k]
                    metric_key = "percentageAboveTarget"

                items = []
                for idx, it in enumerate(ranked, start=1):
                    row = {
                        "rank": idx,
                        normalized_group_by: it["name"],
                        "totalEnrolled": it["total_actual"],
                        "totalTarget": it["total_target"],
                        "enrollmentPercentage": it["enrollment_pct"],
                    }
                    row[metric_key] = it["surplus"] if normalized_metric == "absolute" else it["pct_above"]
                    items.append(row)

                return {
                    "timeHorizon": TIME_HORIZON_MAP[normalized_horizon],
                    "studyId": validated_study_id,
                    "filter": {
                        "countryOrSite": normalized_group_by,
                        "absoluteOrPercentage": normalized_metric,
                    },
                    "overperforming": items,
                }
    except Exception:
        logger.exception("Failed to compute top overperforming sites")
        return JSONResponse(status_code=500, content={"message": "Internal server error"})


def _get_public_table_columns(cursor) -> dict[str, set[str]]:
    cursor.execute(
        """
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        """
    )
    table_columns: dict[str, set[str]] = {}
    for table_name, column_name in cursor.fetchall():
        table_columns.setdefault(table_name, set()).add(column_name)
    return table_columns


def _study_exists(cursor, table_columns: dict[str, set[str]], study_id: str) -> bool:
    candidate_tables = ["enrollment_timeline", "enrollment_rate", "kpi_snapshot", "kpi_timeline"]
    for table_name in candidate_tables:
        if "study_id" not in table_columns.get(table_name, set()):
            continue
        cursor.execute(
            f"""
            SELECT 1
            FROM public.{table_name}
            WHERE study_id::text = %s
            LIMIT 1
            """,
            [study_id],
        )
        if cursor.fetchone():
            return True
    return False


def _kpi_result(
    value: Optional[float],
    *,
    reason_if_na: str,
    digits: int = 2,
    reason_if_zero: Optional[str] = None,
) -> dict:
    if value is None:
        return {"value": "NA", "reason": reason_if_na}
    rounded_value = round(float(value), digits)
    if rounded_value == 0:
        return {"value": "NA", "reason": reason_if_zero or reason_if_na}
    return {"value": rounded_value, "reason": None}


def _resolve_since_fpi_start_date(cursor, table_columns: dict[str, set[str]], study_id: str) -> tuple[Optional[date], Optional[str]]:
    timeline_has_required = {"study_id", "period_date"}.issubset(table_columns.get("enrollment_timeline", set()))
    rate_has_required = {"study_id", "period_date"}.issubset(table_columns.get("enrollment_rate", set()))
    kpi_timeline_has_required = {"study_id", "period_date"}.issubset(table_columns.get("kpi_timeline", set()))

    if not timeline_has_required and not rate_has_required and not kpi_timeline_has_required:
        return None, "Enrollment timeline/rate period_date columns are not available."

    source_queries = []
    params: list[str] = []

    if timeline_has_required:
        source_queries.append(
            """
            SELECT MIN(period_date::date) AS start_date
            FROM public.enrollment_timeline
            WHERE period_date IS NOT NULL
              AND study_id::text = %s
            """
        )
        params.append(study_id)

    if rate_has_required:
        source_queries.append(
            """
            SELECT MIN(period_date::date) AS start_date
            FROM public.enrollment_rate
            WHERE period_date IS NOT NULL
              AND study_id::text = %s
            """
        )
        params.append(study_id)

    if kpi_timeline_has_required:
        source_queries.append(
            """
            SELECT MIN(period_date::date) AS start_date
            FROM public.kpi_timeline
            WHERE period_date IS NOT NULL
              AND study_id::text = %s
            """
        )
        params.append(study_id)

    cursor.execute(
        f"""
        SELECT MIN(start_date)
        FROM (
            {' UNION ALL '.join(source_queries)}
        ) AS source_dates
        """,
        params,
    )
    start_date = cursor.fetchone()[0]
    if not start_date:
        return None, "Enrollment timeline/rate date data is not available for the selected study."
    return start_date, None


def _date_filter_sql(column_name: str, start_date: Optional[date]) -> tuple[str, list]:
    if not start_date:
        return "", []
    return f"WHERE {column_name}::date >= %s AND {column_name}::date <= %s", [start_date, date.today()]


def _study_time_filter_sql(study_id_column: str, date_column: str, study_id: str, start_date: Optional[date]) -> tuple[str, list]:
    if start_date:
        return f"WHERE {study_id_column}::text = %s AND {date_column}::date >= %s AND {date_column}::date <= %s", [study_id, start_date, date.today()]
    return f"WHERE {study_id_column}::text = %s", [study_id]


def _performance_status_from_percent(value: Optional[float]) -> str:
    return classify_performance(value)


def _format_display_date(raw_value: object) -> Optional[str]:
    if raw_value is None:
        return None
    if isinstance(raw_value, date):
        return f"{raw_value.day:02d} {DISPLAY_MONTH_MAP[raw_value.month]} {raw_value.year}"
    text = str(raw_value).strip()
    if not text:
        return None
    parsed = text.split("T", 1)[0]
    try:
        parsed_date = date.fromisoformat(parsed)
    except ValueError:
        return text
    return f"{parsed_date.day:02d} {DISPLAY_MONTH_MAP[parsed_date.month]} {parsed_date.year}"


def _coerce_date(raw_value: object) -> Optional[date]:
    if raw_value is None:
        return None
    if isinstance(raw_value, date):
        return raw_value

    text = str(raw_value).strip()
    if not text:
        return None

    parsed = text.split("T", 1)[0]
    try:
        return date.fromisoformat(parsed)
    except ValueError:
        return None


def _format_variance_text(variance_days: Optional[int]) -> str:
    if variance_days is None:
        return "Pending"
    if variance_days == 0:
        return "On time"
    if variance_days > 0:
        return f"+{variance_days}d"
    return f"{variance_days}d"


def _na_field(reason: str) -> dict[str, Optional[str]]:
    return {"value": "NA", "reason": reason}


def _join_non_empty(*values: object) -> str:
    parts = [str(value).strip() for value in values if str(value or "").strip()]
    return " · ".join(parts)


@router.get("/study-overview/summary")
def get_study_overview_summary(
    request: Request = None,
    study_id: str = Query(..., alias="studyId", description="Study ID to fetch study overview summary"),
):
    if request is not None and request.method.upper() != "GET":
        return JSONResponse(status_code=405, content={"detail": "Method Not Allowed"})

    try:
        validated_study_id = _require_study_id(study_id)
    except ValueError:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    conn_params = get_conn_params()
    if not conn_params.get("password"):
        return JSONResponse(status_code=500, content={"message": "Database credentials are not configured"})

    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                table_columns = _get_public_table_columns(cursor)

                if not _study_exists(cursor, table_columns, validated_study_id):
                    return JSONResponse(status_code=400, content={"message": "Invalid studyId"})

                study_columns = table_columns.get("studies", set())
                required_columns = {
                    "study_id",
                    "phase",
                    "study_status",
                    "project_priority",
                    "title",
                    "asset_number",
                    "asset_lead",
                    "fso_model",
                    "fso_model_vendor",
                    "sponsor_company",
                    "study_sponsor",
                    "study_designation",
                    "target_enrollment",
                    "planned_fpi_date",
                    "planned_lpo_date",
                    "enrollment_plan_percent",
                }
                if not required_columns.issubset(study_columns):
                    return JSONResponse(status_code=500, content={"message": "Studies table/columns are not available."})

                select_columns = [
                    "study_id",
                    "phase",
                    "study_status",
                    "project_priority",
                    "title",
                    "asset_number",
                    "asset_lead",
                    "fso_model",
                    "fso_model_vendor",
                    "sponsor_company",
                    "study_sponsor",
                    "study_designation",
                    "target_enrollment",
                    "planned_fpi_date",
                    "planned_lpo_date",
                    "enrollment_plan_percent",
                ]
                if "actual_fpi_date" in study_columns:
                    select_columns.append("actual_fpi_date")
                if "forecast_lpo_date" in study_columns:
                    select_columns.append("forecast_lpo_date")

                cursor.execute(
                    f"""
                    SELECT {', '.join(select_columns)}
                    FROM public.studies
                    WHERE study_id::text = %s
                    LIMIT 1
                    """,
                    [validated_study_id],
                )
                row = cursor.fetchone()
                if not row:
                    return JSONResponse(status_code=400, content={"message": "Invalid studyId"})

                row_data = dict(zip(select_columns, row))
                thresholds = get_performance_thresholds()
                performance_status = classify_performance(
                    row_data.get("enrollment_plan_percent"),
                    thresholds,
                )
                actual_fpi = _format_display_date(row_data.get("actual_fpi_date"))
                forecast_lpo = _format_display_date(row_data.get("forecast_lpo_date"))

                return {
                    "studyId": validated_study_id,
                    "phase": row_data.get("phase") or "",
                    "studyStatus": row_data.get("study_status") or "",
                    "priority": row_data.get("project_priority") or "",
                    "performanceStatus": performance_status,
                    "studyTitle": row_data.get("title") or "",
                    "asset": row_data.get("asset_number") or "",
                    "assetLead": row_data.get("asset_lead") or "",
                    "fsoModel": _join_non_empty(row_data.get("fso_model"), row_data.get("fso_model_vendor")),
                    "studySponsor": row_data.get("study_sponsor") or row_data.get("sponsor_company") or "",
                    "designation": row_data.get("study_designation") or "",
                    "targetEnrollment": int(row_data.get("target_enrollment") or 0),
                    "milestones": {
                        "plannedFpi": _format_display_date(row_data.get("planned_fpi_date")),
                        "actualFpi": actual_fpi if actual_fpi is not None else _na_field("Actual FPI date is not available."),
                        "plannedLpo": _format_display_date(row_data.get("planned_lpo_date")),
                        "forecastLpo": forecast_lpo if forecast_lpo is not None else _na_field("Forecast LPO date is not available."),
                    },
                }
    except Exception:
        logger.exception("Failed to fetch study overview summary")
        return JSONResponse(status_code=500, content={"message": "Internal server error"})


@router.get("/study-overview/charts/milestones")
@router.get("/study-overview/milestones")
def get_study_overview_milestones(
    request: Request = None,
    study_id: str = Query(..., alias="studyId", description="Study ID to fetch key enrollment milestones"),
):
    if request is not None and request.method.upper() != "GET":
        return JSONResponse(status_code=405, content={"detail": "Method Not Allowed"})

    try:
        validated_study_id = _require_study_id(study_id)
    except ValueError:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    conn_params = get_conn_params()
    if not conn_params.get("password"):
        return JSONResponse(status_code=500, content={"message": "Database credentials are not configured"})

    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                table_columns = _get_public_table_columns(cursor)

                if not _study_exists(cursor, table_columns, validated_study_id):
                    return JSONResponse(status_code=400, content={"message": "Invalid studyId"})

                study_columns = table_columns.get("studies", set())
                required_columns = {
                    "study_id",
                    "fsa_planned",
                    "fsa_actual",
                    "fsfv_planned",
                    "fsfv_actual",
                    "lsfv_planned",
                    "lsfv_actual",
                }
                if not required_columns.issubset(study_columns):
                    return JSONResponse(status_code=500, content={"message": "Studies milestone columns are not available."})

                cursor.execute(
                    """
                    SELECT
                        fsa_planned,
                        fsa_actual,
                        fsfv_planned,
                        fsfv_actual,
                        lsfv_planned,
                        lsfv_actual
                    FROM public.studies
                    WHERE study_id::text = %s
                    LIMIT 1
                    """,
                    [validated_study_id],
                )
                row = cursor.fetchone()
                if not row:
                    return JSONResponse(status_code=400, content={"message": "Invalid studyId"})

                (
                    fsa_planned,
                    fsa_actual,
                    fsfv_planned,
                    fsfv_actual,
                    lsfv_planned,
                    lsfv_actual,
                ) = row

                def build_milestone(code: str, label: str, planned_raw: object, actual_raw: object) -> dict:
                    planned_date = _coerce_date(planned_raw)
                    actual_date = _coerce_date(actual_raw)
                    variance_days = (actual_date - planned_date).days if planned_date and actual_date else None

                    return {
                        "code": code,
                        "milestone": label,
                        "planned": _format_display_date(planned_raw),
                        "actual": _format_display_date(actual_raw),
                        "variance": _format_variance_text(variance_days),
                        "varianceDays": variance_days,
                    }

                milestones = [
                    build_milestone("FSA", "First Site Activated", fsa_planned, fsa_actual),
                    build_milestone("FSFV", "First Subject First Visit", fsfv_planned, fsfv_actual),
                    build_milestone("LSFV", "Last Subject First Visit", lsfv_planned, lsfv_actual),
                ]

                return {
                    "studyId": validated_study_id,
                    "milestones": milestones,
                }
    except Exception:
        logger.exception("Failed to fetch study overview milestones")
        return JSONResponse(status_code=500, content={"message": "Internal server error"})


@router.get("/study-overview/charts/countries-breakdown")
@router.get("/study-overview/breakdown/countries")
def get_country_breakdown(
    request: Request = None,
    time_horizon: str = Query("Full Study", alias="timeHorizon", description="One of: Full Study, Since FPI, Last 3 Months"),
    study_id: str = Query(..., alias="studyId", description="Study ID to filter country/site breakdown"),
):
    if request is not None and request.method.upper() != "GET":
        return JSONResponse(status_code=405, content={"detail": "Method Not Allowed"})

    try:
        validated_study_id = _require_study_id(study_id)
    except ValueError:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    normalized_horizon = _normalize_time_horizon(time_horizon)
    if not normalized_horizon:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    conn_params = get_conn_params()
    if not conn_params.get("password"):
        return JSONResponse(status_code=500, content={"message": "Database credentials are not configured"})

    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                table_columns = _get_public_table_columns(cursor)

                if not _study_exists(cursor, table_columns, validated_study_id):
                    return JSONResponse(status_code=400, content={"message": "Invalid studyId"})

                country_required_columns = {
                    "study_id",
                    "country",
                    "target_enrollment",
                    "actual_enrollment",
                    "sites_active",
                    "avg_enrollment_rate",
                }
                if not country_required_columns.issubset(table_columns.get("country_breakdown", set())):
                    return JSONResponse(status_code=500, content={"message": "Country breakdown table/columns are not available."})

                site_required_columns = {
                    "study_id",
                    "country",
                    "site_id",
                    "site_name",
                    "target_enrollment",
                    "actual_enrollment",
                    "enrollment_rate",
                    "site_status",
                }
                if not site_required_columns.issubset(table_columns.get("site_breakdown", set())):
                    return JSONResponse(status_code=500, content={"message": "Site breakdown table/columns are not available."})

                cursor.execute(
                    """
                    SELECT
                        country,
                        COALESCE(target_enrollment, 0) AS target_enrollment,
                        COALESCE(actual_enrollment, 0) AS actual_enrollment,
                        COALESCE(sites_active, 0) AS sites_active,
                        COALESCE(avg_enrollment_rate, 0)::float AS avg_enrollment_rate
                    FROM public.country_breakdown
                    WHERE study_id::text = %s
                    ORDER BY country
                    """,
                    [validated_study_id],
                )
                country_rows = cursor.fetchall()

                cursor.execute(
                    """
                    SELECT
                        country,
                        site_id,
                        COALESCE(site_name, '') AS site_name,
                        COALESCE(target_enrollment, 0) AS target_enrollment,
                        COALESCE(actual_enrollment, 0) AS actual_enrollment,
                        COALESCE(site_status, '') AS site_status
                    FROM public.site_breakdown
                    WHERE study_id::text = %s
                    ORDER BY country, site_name, site_id
                    """,
                    [validated_study_id],
                )
                site_rows = cursor.fetchall()

                sites_by_country: dict[str, list[dict]] = {}
                for (
                    country,
                    site_id,
                    site_name,
                    target_enrollment,
                    actual_enrollment,
                    site_status,
                ) in site_rows:
                    percent_enrolled_value = _compute_enrollment_percentage(actual_enrollment, target_enrollment)
                    country_key = country or "Unknown"
                    sites_by_country.setdefault(country_key, []).append(
                        {
                            "siteId": site_id,
                            "siteName": site_name,
                            "target": int(target_enrollment or 0),
                            "actual": int(actual_enrollment or 0),
                            "percentEnrolled": percent_enrolled_value,
                            "status": site_status,
                        }
                    )

                countries = []
                thresholds = get_performance_thresholds()
                for (
                    country,
                    target_enrollment,
                    actual_enrollment,
                    sites_active,
                    avg_enrollment_rate,
                ) in country_rows:
                    country_key = country or "Unknown"
                    percent_enrolled_value = _compute_enrollment_percentage(actual_enrollment, target_enrollment)
                    countries.append(
                        {
                            "country": country_key,
                            "target": int(target_enrollment or 0),
                            "actual": int(actual_enrollment or 0),
                            "percentEnrolled": percent_enrolled_value,
                            "sitesActive": int(sites_active or 0),
                            "avgRate": round(float(avg_enrollment_rate or 0), 2),
                            "status": classify_performance(percent_enrolled_value, thresholds),
                            "sites": sites_by_country.get(country_key, []),
                        }
                    )

                return {
                    "timeHorizon": TIME_HORIZON_MAP[normalized_horizon],
                    "studyId": validated_study_id,
                    "countries": countries,
                }
    except Exception:
        logger.exception("Failed to fetch country/site breakdown")
        return JSONResponse(status_code=500, content={"message": "Internal server error"})


@router.get("/study-overview/charts/enrollment-rate")
@router.get("/study-overview/enrollment-rate-monthly")
def get_enrollment_rate_monthly_chart(
    request: Request = None,
    time_horizon: str = Query("Full Study", alias="timeHorizon", description="One of: Full Study, Since FPI, Last 3 Months"),
    study_id: str = Query(..., alias="studyId", description="Study ID to filter enrollment rate chart"),
):
    if request is not None and request.method.upper() != "GET":
        return JSONResponse(status_code=405, content={"detail": "Method Not Allowed"})

    try:
        validated_study_id = _require_study_id(study_id)
    except ValueError:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    normalized_horizon = _normalize_time_horizon(time_horizon)
    if not normalized_horizon:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    conn_params = get_conn_params()
    if not conn_params.get("password"):
        return JSONResponse(status_code=500, content={"message": "Database credentials are not configured"})

    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                table_columns = _get_public_table_columns(cursor)

                if not _study_exists(cursor, table_columns, validated_study_id):
                    return JSONResponse(status_code=400, content={"message": "Invalid studyId"})

                required_columns = {"study_id", "period_date", "actual_rate", "planned_rate"}
                if not required_columns.issubset(table_columns.get("enrollment_rate", set())):
                    return JSONResponse(status_code=500, content={"message": "Enrollment rate table/columns are not available."})

                start_date: Optional[date] = None
                if normalized_horizon == "last 3 months":
                    start_date = _subtract_months(date.today(), 3)
                elif normalized_horizon == "since fpi":
                    start_date, horizon_error = _resolve_since_fpi_start_date(cursor, table_columns, validated_study_id)
                    if horizon_error:
                        return JSONResponse(status_code=400, content={"message": f"Unable to apply time horizon: {horizon_error}"})

                where_sql, where_params = _study_time_filter_sql("study_id", "period_date", validated_study_id, start_date)
                cursor.execute(
                    f"""
                    WITH filtered AS (
                        SELECT
                            period_date::date AS period_date,
                            COALESCE(planned_rate, 0)::float AS planned_rate,
                            COALESCE(actual_rate, 0)::float AS actual_rate
                        FROM public.enrollment_rate
                        {where_sql}
                          AND period_date IS NOT NULL
                    )
                    SELECT
                        date_trunc('month', period_date)::date AS month_start,
                        COALESCE(SUM(planned_rate), 0)::float AS planned_total,
                        COALESCE(SUM(actual_rate), 0)::float AS actual_total
                    FROM filtered
                    GROUP BY date_trunc('month', period_date)
                    ORDER BY month_start
                    """,
                    where_params,
                )
                rows = cursor.fetchall()

                points = [
                    {
                        "month": month_start.strftime("%b %Y").upper(),
                        "planned": float(planned_total),
                        "actual": float(actual_total),
                    }
                    for month_start, planned_total, actual_total in rows
                ]

                return {
                    "timeHorizon": TIME_HORIZON_MAP[normalized_horizon],
                    "studyId": validated_study_id,
                    "window": {
                        "startDate": (start_date.isoformat() if start_date else None),
                        "endDate": date.today().isoformat(),
                    },
                    "xAxis": [point["month"] for point in points],
                    "series": {
                        "planned": [point["planned"] for point in points],
                        "actual": [point["actual"] for point in points],
                    },
                    "points": points,
                }
    except Exception:
        logger.exception("Failed to fetch enrollment rate monthly chart")
        return JSONResponse(status_code=500, content={"message": "Internal server error"})


@router.get("/study-overview/charts/enrollment-cumulative")
@router.get("/study-overview/enrollment-cumulative")
def get_enrollment_cumulative_chart(
    request: Request = None,
    time_horizon: str = Query("Full Study", alias="timeHorizon", description="One of: Full Study, Since FPI, Last 3 Months"),
    study_id: str = Query(..., alias="studyId", description="Study ID to filter cumulative enrollment chart"),
):
    if request is not None and request.method.upper() != "GET":
        return JSONResponse(status_code=405, content={"detail": "Method Not Allowed"})

    try:
        validated_study_id = _require_study_id(study_id)
    except ValueError:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    normalized_horizon = _normalize_time_horizon(time_horizon)
    if not normalized_horizon:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    conn_params = get_conn_params()
    if not conn_params.get("password"):
        return JSONResponse(status_code=500, content={"message": "Database credentials are not configured"})

    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                table_columns = _get_public_table_columns(cursor)

                if not _study_exists(cursor, table_columns, validated_study_id):
                    return JSONResponse(status_code=400, content={"message": "Invalid studyId"})

                start_date: Optional[date] = None
                if normalized_horizon == "last 3 months":
                    start_date = _subtract_months(date.today(), 3)
                elif normalized_horizon == "since fpi":
                    start_date, horizon_error = _resolve_since_fpi_start_date(cursor, table_columns, validated_study_id)
                    if horizon_error:
                        return JSONResponse(status_code=400, content={"message": f"Unable to apply time horizon: {horizon_error}"})

                required_columns = {
                    "study_id",
                    "period_date",
                    "planned_cumulative",
                    "actual_cumulative",
                    "forecast_cumulative",
                }
                if not required_columns.issubset(table_columns.get("enrollment_timeline", set())):
                    return JSONResponse(status_code=500, content={"message": "Enrollment timeline table/columns are not available."})

                where_sql, where_params = _study_time_filter_sql("study_id", "period_date", validated_study_id, start_date)
                cursor.execute(
                    f"""
                    WITH filtered AS (
                        SELECT
                            period_date::date AS period_date,
                            COALESCE(planned_cumulative, 0)::float AS planned_cumulative,
                            COALESCE(actual_cumulative, 0)::float AS actual_cumulative,
                            COALESCE(forecast_cumulative, 0)::float AS forecast_cumulative
                        FROM public.enrollment_timeline
                        {where_sql}
                          AND period_date IS NOT NULL
                    ),
                    monthly_latest AS (
                        SELECT DISTINCT ON (date_trunc('month', period_date))
                            date_trunc('month', period_date)::date AS month_start,
                            planned_cumulative,
                            actual_cumulative,
                            forecast_cumulative
                        FROM filtered
                        ORDER BY date_trunc('month', period_date), period_date DESC
                    )
                    SELECT
                        month_start,
                        planned_cumulative,
                        actual_cumulative,
                        forecast_cumulative
                    FROM monthly_latest
                    ORDER BY month_start
                    """,
                    where_params,
                )
                rows = cursor.fetchall()

                points = [
                    {
                        "month": month_start.strftime("%b %Y").upper(),
                        "planned": float(planned),
                        "actual": float(actual),
                        "forecasted": float(forecasted),
                    }
                    for month_start, planned, actual, forecasted in rows
                ]

                return {
                    "timeHorizon": TIME_HORIZON_MAP[normalized_horizon],
                    "studyId": validated_study_id,
                    "window": {
                        "startDate": (start_date.isoformat() if start_date else None),
                        "endDate": date.today().isoformat(),
                    },
                    "xAxis": [point["month"] for point in points],
                    "series": {
                        "planned": [point["planned"] for point in points],
                        "actual": [point["actual"] for point in points],
                        "forecasted": [point["forecasted"] for point in points],
                    },
                    "points": points,
                }
    except Exception:
        logger.exception("Failed to fetch enrollment cumulative chart")
        return JSONResponse(status_code=500, content={"message": "Internal server error"})


@router.get("/study-overview/kpi-details")
def get_study_overview_kpi_details(
    request: Request = None,
    time_horizon: str = Query("Full Study", alias="timeHorizon", description="One of: Full Study, Since FPI, Last 3 Months"),
    study_id: str = Query(..., alias="studyId", description="Study ID to filter KPI details"),
):
    if request is not None and request.method.upper() != "GET":
        return JSONResponse(status_code=405, content={"detail": "Method Not Allowed"})

    try:
        validated_study_id = _require_study_id(study_id)
    except ValueError:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    normalized_horizon = _normalize_time_horizon(time_horizon)
    if not normalized_horizon:
        return JSONResponse(status_code=400, content={"message": "Invalid query parameter"})

    conn_params = get_conn_params()
    if not conn_params.get("password"):
        return JSONResponse(status_code=500, content={"message": "Database credentials are not configured"})

    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                table_columns = _get_public_table_columns(cursor)

                if not _study_exists(cursor, table_columns, validated_study_id):
                    return JSONResponse(status_code=400, content={"message": "Invalid studyId"})

                start_date: Optional[date] = None
                horizon_error: Optional[str] = None
                if normalized_horizon == "last 3 months":
                    start_date = _subtract_months(date.today(), 3)
                elif normalized_horizon == "since fpi":
                    start_date, horizon_error = _resolve_since_fpi_start_date(cursor, table_columns, validated_study_id)

                kpis: dict[str, dict] = {}
                kpi_timeline_columns = table_columns.get("kpi_timeline", set())
                kpi_timeline_has_metrics = {
                    "study_id",
                    "period_date",
                    "screened_this_period",
                    "failed_this_period",
                    "enrolled_this_period",
                    "dropouts_this_period",
                }.issubset(kpi_timeline_columns)
                kpi_timeline_has_site_activation = {"study_id", "period_date", "sites_activated"}.issubset(kpi_timeline_columns)
                kpi_timeline_has_country_activation = {"study_id", "period_date", "countries_activated"}.issubset(kpi_timeline_columns)
                kpi_timeline_has_sites_planned = "sites_planned" in kpi_timeline_columns
                kpi_timeline_has_countries_planned = "countries_planned" in kpi_timeline_columns

                timeline_points: list[dict] = []
                kpi_timeline_rows: list[tuple] = []
                if kpi_timeline_has_metrics:
                    where_sql, where_params = _study_time_filter_sql("study_id", "period_date", validated_study_id, start_date)
                    selected_columns = [
                        "period_date::date AS period_date",
                        "COALESCE(screened_this_period, 0)::int AS screened_this_period",
                        "COALESCE(failed_this_period, 0)::int AS failed_this_period",
                        "COALESCE(enrolled_this_period, 0)::int AS enrolled_this_period",
                        "COALESCE(dropouts_this_period, 0)::int AS dropouts_this_period",
                    ]
                    if "sites_activated" in kpi_timeline_columns:
                        selected_columns.append("COALESCE(sites_activated, 0)::int AS sites_activated")
                    if "sites_planned" in kpi_timeline_columns:
                        selected_columns.append("COALESCE(sites_planned, 0)::int AS sites_planned")
                    if "countries_activated" in kpi_timeline_columns:
                        selected_columns.append("COALESCE(countries_activated, 0)::int AS countries_activated")
                    if "countries_planned" in kpi_timeline_columns:
                        selected_columns.append("COALESCE(countries_planned, 0)::int AS countries_planned")

                    cursor.execute(
                        f"""
                        SELECT
                            {', '.join(selected_columns)}
                        FROM public.kpi_timeline
                        {where_sql}
                        ORDER BY period_date
                        """,
                        where_params,
                    )
                    kpi_timeline_rows = cursor.fetchall()

                    if kpi_timeline_rows:
                        column_names = [col.split(" AS ")[-1] for col in selected_columns]
                        for row in kpi_timeline_rows:
                            row_data = dict(zip(column_names, row))
                            screened = row_data.get("screened_this_period", 0)
                            failed = row_data.get("failed_this_period", 0)
                            enrolled = row_data.get("enrolled_this_period", 0)
                            dropouts = row_data.get("dropouts_this_period", 0)
                            timeline_points.append(
                                {
                                    "periodDate": row_data["period_date"].isoformat(),
                                    "screened": int(screened),
                                    "failed": int(failed),
                                    "enrolled": int(enrolled),
                                    "dropouts": int(dropouts),
                                    "siteActivation": int(row_data.get("sites_activated", 0)),
                                    "sitesPlanned": int(row_data.get("sites_planned", 0)) if "sites_planned" in row_data else "NA",
                                    "countryActivation": int(row_data.get("countries_activated", 0)),
                                    "countriesPlanned": int(row_data.get("countries_planned", 0)) if "countries_planned" in row_data else "NA",
                                    "screenFailureRate": round(float(failed) / screened * 100, 2) if screened else 0.0,
                                    "dropoutRate": round(float(dropouts) / enrolled * 100, 2) if enrolled else 0.0,
                                }
                            )

                # Enrollment vs Plan
                if horizon_error:
                    kpis["enrollmentVsPlan"] = _kpi_result(None, reason_if_na=f"Enrollment data cannot be filtered: {horizon_error}")
                elif {"period_date", "study_id", "enrolled_this_period", "planned_cumulative"}.issubset(table_columns.get("enrollment_timeline", set())):
                    # actual  = SUM(enrolled_this_period) — already the per-period value, no LAG needed.
                    # planned = SUM of per-period planned delta derived via LAG on planned_cumulative.
                    # LAG is computed over ALL study rows first so the boundary period has the correct
                    # previous planned value, then the date filter is applied in the outer query.
                    date_filter_sql = "AND period_date::date >= %s AND period_date::date <= %s" if start_date else ""
                    date_params = [start_date, date.today()] if start_date else []
                    cursor.execute(
                        f"""
                        WITH all_periods AS (
                            SELECT
                                period_date,
                                COALESCE(enrolled_this_period, 0) AS actual_this_period,
                                planned_cumulative,
                                LAG(planned_cumulative)
                                    OVER (ORDER BY period_date) AS prev_planned
                            FROM public.enrollment_timeline
                            WHERE study_id::text = %s
                              AND planned_cumulative IS NOT NULL
                        ),
                        period_deltas AS (
                            SELECT
                                actual_this_period,
                                planned_cumulative - prev_planned AS planned_this_period
                            FROM all_periods
                            WHERE prev_planned IS NOT NULL
                            {date_filter_sql}
                        )
                        SELECT
                            COUNT(*),
                            COALESCE(SUM(actual_this_period),  0),
                            COALESCE(SUM(planned_this_period), 0)
                        FROM period_deltas
                        """,
                        [validated_study_id] + date_params,
                    )
                    row_count, total_actual, total_planned = cursor.fetchone()
                    if not row_count:
                        kpis["enrollmentVsPlan"] = _kpi_result(None, reason_if_na="Enrollment timeline data is not available for the selected study and time horizon.")
                    elif not total_planned:
                        kpis["enrollmentVsPlan"] = _kpi_result(None, reason_if_na="Planned enrollment data is not available.")
                    else:
                        actual_value = float(total_actual or 0)
                        planned_value = float(total_planned or 0)
                        kpis["enrollmentVsPlan"] = {
                            "percentage": _kpi_result(
                                (actual_value / planned_value) * 100,
                                reason_if_na="Enrollment data is not available.",
                                reason_if_zero="Enrollment data is not available.",
                            ),
                            "actualEnrollments": actual_value,
                            "plannedEnrollments": planned_value,
                        }
                else:
                    kpis["enrollmentVsPlan"] = _kpi_result(None, reason_if_na="Enrollment timeline table/columns are not available.")

                # Enrollment Rate (avg enrollments per week)
                if horizon_error:
                    kpis["enrollmentRate"] = _kpi_result(None, reason_if_na=f"Enrollment rate cannot be filtered: {horizon_error}")
                elif {"study_id", "period_date", "actual_rate"}.issubset(table_columns.get("enrollment_rate", set())):
                    where_sql, where_params = _study_time_filter_sql("study_id", "period_date", validated_study_id, start_date)
                    has_planned_rate = "planned_rate" in table_columns.get("enrollment_rate", set())
                    planned_rate_sql = ", SUM(planned_rate)" if has_planned_rate else ""
                    cursor.execute(
                        f"""
                        SELECT COUNT(*), SUM(actual_rate){planned_rate_sql}
                        FROM public.enrollment_rate
                        {where_sql}
                        """,
                        where_params,
                    )
                    rate_row = cursor.fetchone()
                    row_count = rate_row[0]
                    sum_actual = rate_row[1]
                    sum_planned = rate_row[2] if has_planned_rate else None
                    if not row_count:
                        kpis["enrollmentRate"] = _kpi_result(None, reason_if_na="Enrollment rate data is not available for the selected study and time horizon.")
                    else:
                        _weeks = float(row_count) * 4.333
                        actual_per_week = round(float(sum_actual) / _weeks, 2) if sum_actual is not None else None
                        planned_per_week = round(float(sum_planned) / _weeks, 2) if sum_planned is not None else None
                        pct = round((actual_per_week / planned_per_week) * 100, 2) if actual_per_week and planned_per_week else None
                        kpis["enrollmentRate"] = {
                            "percentage": _kpi_result(
                                pct,
                                reason_if_na="Enrollment rate data is not available.",
                                reason_if_zero="Enrollment rate data is not available.",
                            ),
                            "actualEnrollmentRatePerWeek": actual_per_week if actual_per_week is not None else "NA",
                            "plannedEnrollmentRatePerWeek": planned_per_week if planned_per_week is not None else "NA",
                        }
                elif {"study_id", "period_date", "enrolled_this_period"}.issubset(table_columns.get("enrollment_timeline", set())):
                    where_sql, where_params = _study_time_filter_sql("study_id", "period_date", validated_study_id, start_date)
                    cursor.execute(
                        f"""
                        SELECT COUNT(*), SUM(enrolled_this_period)
                        FROM public.enrollment_timeline
                        {where_sql}
                        """,
                        where_params,
                    )
                    row_count, sum_actual = cursor.fetchone()
                    if not row_count:
                        kpis["enrollmentRate"] = _kpi_result(None, reason_if_na="Enrollment period data is not available for the selected study and time horizon.")
                    else:
                        _weeks = float(row_count) * 4.333
                        actual_per_week = round(float(sum_actual) / _weeks, 2) if sum_actual is not None else None
                        kpis["enrollmentRate"] = {
                            "percentage": _kpi_result(None, reason_if_na="Planned enrollment rate data is not available."),
                            "actualEnrollmentRatePerWeek": actual_per_week if actual_per_week is not None else "NA",
                            "plannedEnrollmentRatePerWeek": "NA",
                        }
                else:
                    kpis["enrollmentRate"] = _kpi_result(None, reason_if_na="Enrollment rate table/columns are not available with study-level fields.")

                # Screen Failure Rate
                if horizon_error:
                    kpis["screenFailureRate"] = _kpi_result(None, reason_if_na=f"Screen failure rate cannot be filtered: {horizon_error}")
                elif kpi_timeline_has_metrics:
                    if not kpi_timeline_rows:
                        kpis["screenFailureRate"] = _kpi_result(None, reason_if_na="Screen failure data is not available for the selected study and time horizon.")
                    else:
                        total_screened = float(sum(row[1] for row in kpi_timeline_rows))
                        total_failed = float(sum(row[2] for row in kpi_timeline_rows))
                        if not total_screened:
                            kpis["screenFailureRate"] = _kpi_result(None, reason_if_na="Screen failure data is not available for the selected study and time horizon.")
                        else:
                            kpis["screenFailureRate"] = _kpi_result(
                                (total_failed / total_screened) * 100,
                                reason_if_na="Screen failure data is not available.",
                                reason_if_zero="Screen failure data is not available.",
                            )
                elif {"study_id", "snapshot_date", "screen_failure_rate"}.issubset(table_columns.get("kpi_snapshot", set())):
                    where_sql, where_params = _study_time_filter_sql("study_id", "snapshot_date", validated_study_id, start_date)
                    cursor.execute(
                        f"""
                        SELECT COUNT(*), AVG(screen_failure_rate)
                        FROM public.kpi_snapshot
                        {where_sql}
                        """,
                        where_params,
                    )
                    row_count, avg_value = cursor.fetchone()
                    if not row_count:
                        kpis["screenFailureRate"] = _kpi_result(None, reason_if_na="Screen failure data is not available for the selected study and time horizon.")
                    else:
                        kpis["screenFailureRate"] = _kpi_result(
                            avg_value,
                            reason_if_na="Screen failure data is not available.",
                            reason_if_zero="Screen failure data is not available.",
                        )
                else:
                    kpis["screenFailureRate"] = _kpi_result(None, reason_if_na="Screen failure data table/columns are not available with study-level fields.")

                # Dropout Rate
                if horizon_error:
                    kpis["dropoutRate"] = _kpi_result(None, reason_if_na=f"Dropout rate cannot be filtered: {horizon_error}")
                elif kpi_timeline_has_metrics:
                    if not kpi_timeline_rows:
                        kpis["dropoutRate"] = _kpi_result(None, reason_if_na="Dropout data is not available for the selected study and time horizon.")
                    else:
                        total_enrolled = float(sum(row[3] for row in kpi_timeline_rows))
                        total_dropouts = float(sum(row[4] for row in kpi_timeline_rows))
                        if not total_enrolled:
                            kpis["dropoutRate"] = _kpi_result(None, reason_if_na="Dropout data is not available for the selected study and time horizon.")
                        else:
                            kpis["dropoutRate"] = _kpi_result(
                                (total_dropouts / total_enrolled) * 100,
                                reason_if_na="Dropout data is not available.",
                                reason_if_zero="Dropout data is not available.",
                            )
                elif {"study_id", "snapshot_date", "dropout_rate"}.issubset(table_columns.get("kpi_snapshot", set())):
                    where_sql, where_params = _study_time_filter_sql("study_id", "snapshot_date", study_id, start_date)
                    cursor.execute(
                        f"""
                        SELECT COUNT(*), AVG(dropout_rate)
                        FROM public.kpi_snapshot
                        {where_sql}
                        """,
                        where_params,
                    )
                    row_count, avg_value = cursor.fetchone()
                    if not row_count:
                        kpis["dropoutRate"] = _kpi_result(None, reason_if_na="Dropout data is not available for the selected study and time horizon.")
                    else:
                        kpis["dropoutRate"] = _kpi_result(
                            avg_value,
                            reason_if_na="Dropout data is not available.",
                            reason_if_zero="Dropout data is not available.",
                        )
                else:
                    kpis["dropoutRate"] = _kpi_result(None, reason_if_na="Dropout data table/columns are not available with study-level fields.")

                # Sites Activated
                if horizon_error:
                    kpis["sitesActivated"] = _kpi_result(None, reason_if_na=f"Sites activated cannot be filtered: {horizon_error}")
                elif kpi_timeline_has_site_activation:
                    row_count = len(timeline_points)
                    total_sites = max((int(point.get("siteActivation", 0) or 0) for point in timeline_points), default=0)
                    total_sites_planned = (
                        max((int(point.get("sitesPlanned", 0) or 0) for point in timeline_points if isinstance(point.get("sitesPlanned"), int)), default=0)
                        if kpi_timeline_has_sites_planned
                        else None
                    )
                    if not row_count:
                        kpis["sitesActivated"] = _kpi_result(None, reason_if_na="Sites activated data is not available for the selected study and time horizon.")
                    else:
                        kpis["sitesActivated"] = {
                            "value": _kpi_result(
                                total_sites,
                                reason_if_na="Sites activated data is not available.",
                                digits=0,
                                reason_if_zero="Sites activated data is not available.",
                            ),
                            "actualSitesActivated": int(total_sites or 0),
                            "plannedSitesActivated": int(total_sites_planned or 0) if total_sites_planned is not None else "NA",
                        }
                elif {"study_id", "snapshot_date", "sites_activated"}.issubset(table_columns.get("kpi_snapshot", set())):
                    where_sql, where_params = _study_time_filter_sql("study_id", "snapshot_date", study_id, start_date)
                    has_sites_planned = "sites_planned" in table_columns.get("kpi_snapshot", set())
                    sites_planned_sql = ", COALESCE(sites_planned, 0) AS sites_planned" if has_sites_planned else ""
                    latest_sites_planned_sql = ", sites_planned" if has_sites_planned else ""
                    total_sites_planned_sql = ", COALESCE(SUM(sites_planned), 0)" if has_sites_planned else ""
                    cursor.execute(
                        f"""
                        WITH filtered AS (
                            SELECT study_id, snapshot_date, COALESCE(sites_activated, 0) AS sites_activated{sites_planned_sql}
                            FROM public.kpi_snapshot
                            {where_sql}
                        ),
                        latest AS (
                            SELECT DISTINCT ON (study_id)
                                study_id,
                                sites_activated{latest_sites_planned_sql}
                            FROM filtered
                            ORDER BY study_id, snapshot_date DESC
                        )
                        SELECT COUNT(*), COALESCE(SUM(sites_activated), 0){total_sites_planned_sql}
                        FROM latest
                        """,
                        where_params,
                    )
                    sites_row = cursor.fetchone()
                    row_count = sites_row[0]
                    total_sites = sites_row[1]
                    total_sites_planned = sites_row[2] if has_sites_planned else None
                    if not row_count:
                        kpis["sitesActivated"] = _kpi_result(None, reason_if_na="Sites activated data is not available for the selected study and time horizon.")
                    else:
                        kpis["sitesActivated"] = {
                            "value": _kpi_result(
                                total_sites,
                                reason_if_na="Sites activated data is not available.",
                                digits=0,
                                reason_if_zero="Sites activated data is not available.",
                            ),
                            "actualSitesActivated": int(total_sites or 0),
                            "plannedSitesActivated": int(total_sites_planned or 0) if total_sites_planned is not None else "NA",
                        }
                else:
                    kpis["sitesActivated"] = _kpi_result(None, reason_if_na="Sites activated table/columns are not available with study-level fields.")

                # Countries Activated
                if horizon_error:
                    kpis["countriesActivated"] = _kpi_result(None, reason_if_na=f"Countries activated cannot be filtered: {horizon_error}")
                elif kpi_timeline_has_country_activation:
                    row_count = len(timeline_points)
                    total_countries = max((int(point.get("countryActivation", 0) or 0) for point in timeline_points), default=0)
                    total_countries_planned = (
                        max((int(point.get("countriesPlanned", 0) or 0) for point in timeline_points if isinstance(point.get("countriesPlanned"), int)), default=0)
                        if kpi_timeline_has_countries_planned
                        else None
                    )
                    if not row_count:
                        kpis["countriesActivated"] = _kpi_result(None, reason_if_na="Countries activated data is not available for the selected study and time horizon.")
                    else:
                        kpis["countriesActivated"] = {
                            "value": _kpi_result(
                                total_countries,
                                reason_if_na="Countries activated data is not available.",
                                digits=0,
                                reason_if_zero="Countries activated data is not available.",
                            ),
                            "actualCountriesActivated": int(total_countries or 0),
                            "plannedCountriesActivated": int(total_countries_planned or 0) if total_countries_planned is not None else "NA",
                        }
                elif {"study_id", "snapshot_date", "countries_activated"}.issubset(table_columns.get("kpi_snapshot", set())):
                    where_sql, where_params = _study_time_filter_sql("study_id", "snapshot_date", study_id, start_date)
                    has_countries_planned = "countries_planned" in table_columns.get("kpi_snapshot", set())
                    countries_planned_sql = ", COALESCE(countries_planned, 0) AS countries_planned" if has_countries_planned else ""
                    latest_countries_planned_sql = ", countries_planned" if has_countries_planned else ""
                    total_countries_planned_sql = ", COALESCE(SUM(countries_planned), 0)" if has_countries_planned else ""
                    cursor.execute(
                        f"""
                        WITH filtered AS (
                            SELECT study_id, snapshot_date, COALESCE(countries_activated, 0) AS countries_activated{countries_planned_sql}
                            FROM public.kpi_snapshot
                            {where_sql}
                        ),
                        latest AS (
                            SELECT DISTINCT ON (study_id)
                                study_id,
                                countries_activated{latest_countries_planned_sql}
                            FROM filtered
                            ORDER BY study_id, snapshot_date DESC
                        )
                        SELECT COUNT(*), COALESCE(SUM(countries_activated), 0){total_countries_planned_sql}
                        FROM latest
                        """,
                        where_params,
                    )
                    countries_row = cursor.fetchone()
                    row_count = countries_row[0]
                    total_countries = countries_row[1]
                    total_countries_planned = countries_row[2] if has_countries_planned else None
                    if not row_count:
                        kpis["countriesActivated"] = _kpi_result(None, reason_if_na="Countries activated data is not available for the selected study and time horizon.")
                    else:
                        kpis["countriesActivated"] = {
                            "value": _kpi_result(
                                total_countries,
                                reason_if_na="Countries activated data is not available.",
                                digits=0,
                                reason_if_zero="Countries activated data is not available.",
                            ),
                            "actualCountriesActivated": int(total_countries or 0),
                            "plannedCountriesActivated": int(total_countries_planned or 0) if total_countries_planned is not None else "NA",
                        }
                else:
                    kpis["countriesActivated"] = _kpi_result(None, reason_if_na="Countries activated table/columns are not available with study-level fields.")

                result = {
                    "timeHorizon": TIME_HORIZON_MAP[normalized_horizon],
                    "studyId": validated_study_id,
                    "window": {
                        "startDate": (start_date.isoformat() if start_date else None),
                        "endDate": date.today().isoformat(),
                    },
                    "kpis": kpis,
                }
                if timeline_points:
                    result["kpiTimeline"] = timeline_points
                return result
    except Exception:
        logger.exception("Failed to fetch study overview KPI details")
        return JSONResponse(status_code=500, content={"message": "Internal server error"})
