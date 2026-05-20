import os
import psycopg2
from fastapi import FastAPI, HTTPException


app = FastAPI(title="PostgreSQL API", version="1.0.0")

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



from fastapi import Query

@app.get("/study-summary")
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
    
@app.get("/health")
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


@app.get("/db/version")
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
@app.get("/study/summary/all")
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

@app.get("/db/schema")
def db_schema():
    try:
        return get_database_schema()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch schema: {e}")
    
@app.get("/studies/active/count")
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


@app.get("/studies/on-track")
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


@app.get("/studies/off-track-or-at-risk")
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


@app.get("/studies/enrollment-vs-target")
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


@app.get("/studies/velocity-vs-plan")
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
                return {"average_velocity_vs_plan": average_velocity_vs_plan}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch average velocity vs plan: {e}")


@app.get("/studies/kpi-details")
def get_kpi_details():
    conn_params = get_conn_params()
    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                        -- Active studies count
                        COUNT(*) FILTER (
                            WHERE UPPER(COALESCE(study_status, '')) IN ('ACTIVE', 'RECRUITING', 'FOLLOW UP')
                        ) AS active_studies_count,

                        -- On-track count
                        COUNT(*) FILTER (
                            WHERE UPPER(COALESCE(study_status, '')) IN ('ACTIVE', 'RECRUITING', 'FOLLOW UP')
                              AND UPPER(COALESCE(performance_status, '')) = 'ON_TRACK'
                        ) AS on_track_count,

                        -- Off-track or at-risk count
                        COUNT(*) FILTER (
                            WHERE UPPER(COALESCE(study_status, '')) IN ('ACTIVE', 'RECRUITING', 'FOLLOW UP')
                              AND UPPER(COALESCE(performance_status, '')) IN ('OFF_TRACK', 'AT_RISK')
                        ) AS off_track_or_at_risk_count,

                        -- Enrollment vs target
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

                        -- Velocity vs plan average
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

