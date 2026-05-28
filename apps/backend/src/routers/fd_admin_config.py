import logging
import re
from typing import Any, Dict, Optional

import psycopg2
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from psycopg2 import sql

from eagle_hackathon.apps.backend.src.db.connection import get_conn_params
from eagle_hackathon.apps.backend.src.core.performance_thresholds import (
    get_performance_thresholds,
    upsert_global_thresholds,
)


logger = logging.getLogger(__name__)
router = APIRouter()

_IDENTIFIER_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


class LoginDetailsUpdateRequest(BaseModel):
    key_column: str = Field(default="id", alias="keyColumn")
    key_value: Any = Field(alias="keyValue")
    updates: Dict[str, Any]


class PerformanceThresholdUpdateRequest(BaseModel):
    on_track: float = Field(alias="onTrack")
    at_risk_start: float = Field(alias="atRiskStart")
    at_risk_end: float = Field(alias="atRiskEnd")
    off_track: float = Field(alias="offTrack")


def _is_valid_identifier(value: str) -> bool:
    return bool(_IDENTIFIER_RE.match(value or ""))


def _table_exists(cursor, table_name: str) -> bool:
    cursor.execute(
        """
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = %s
        LIMIT 1
        """,
        [table_name],
    )
    return bool(cursor.fetchone())


def _get_table_columns(cursor, table_name: str) -> set[str]:
    cursor.execute(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = %s
        """,
        [table_name],
    )
    return {row[0] for row in cursor.fetchall()}


def _update_single_row(table_name: str, key_column: str, key_value: Any, updates: Dict[str, Any]):
    if not _is_valid_identifier(table_name) or not _is_valid_identifier(key_column):
        return JSONResponse(status_code=400, content={"message": "Invalid table or column name"})

    if not updates:
        return JSONResponse(status_code=400, content={"message": "No updates supplied"})

    if any(not _is_valid_identifier(col) for col in updates):
        return JSONResponse(status_code=400, content={"message": "Invalid update column name"})

    conn_params = get_conn_params()
    if not conn_params.get("password"):
        return JSONResponse(status_code=500, content={"message": "Database credentials are not configured"})

    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                if not _table_exists(cursor, table_name):
                    return JSONResponse(status_code=404, content={"message": f"Table '{table_name}' not found"})

                valid_columns = _get_table_columns(cursor, table_name)
                required_columns = set(updates.keys()) | {key_column}
                missing = [col for col in required_columns if col not in valid_columns]
                if missing:
                    return JSONResponse(
                        status_code=400,
                        content={"message": f"Invalid column(s) for table '{table_name}'", "columns": missing},
                    )

                set_clause = sql.SQL(", ").join(
                    [sql.SQL("{} = %s").format(sql.Identifier(col)) for col in updates.keys()]
                )
                query = sql.SQL("UPDATE {} SET {} WHERE {} = %s").format(
                    sql.Identifier(table_name),
                    set_clause,
                    sql.Identifier(key_column),
                )
                params = list(updates.values()) + [key_value]
                cursor.execute(query, params)

                if cursor.rowcount == 0:
                    return JSONResponse(status_code=404, content={"message": "No matching record found"})

                return {
                    "message": "Update successful",
                    "table": table_name,
                    "updatedRows": cursor.rowcount,
                }
    except Exception:
        logger.exception("Failed updating table %s", table_name)
        return JSONResponse(status_code=500, content={"message": "Internal server error"})


@router.put("/admin/login-details")
def update_login_details(payload: LoginDetailsUpdateRequest):
    return _update_single_row(
        table_name="login_details",
        key_column=payload.key_column,
        key_value=payload.key_value,
        updates=payload.updates,
    )


@router.put("/admin/performance-threshold")
def update_performance_threshold(payload: PerformanceThresholdUpdateRequest):
    if payload.at_risk_start > payload.at_risk_end:
        return JSONResponse(
            status_code=400,
            content={"message": "Invalid threshold range: atRiskStart cannot be greater than atRiskEnd"},
        )

    try:
        upsert_global_thresholds(
            on_track=payload.on_track,
            at_risk_start=payload.at_risk_start,
            at_risk_end=payload.at_risk_end,
            off_track=payload.off_track,
        )
        return {
            "message": "Update successful",
            "table": "performance_threshold",
            "updatedRows": 1,
        }
    except Exception:
        logger.exception("Failed updating global performance thresholds")
        return JSONResponse(status_code=500, content={"message": "Internal server error"})


@router.get("/admin/performance-threshold")
def get_performance_threshold():
    try:
        thresholds = get_performance_thresholds()
        return {
            "onTrack": thresholds.on_track,
            "atRiskStart": thresholds.at_risk_start,
            "atRiskEnd": thresholds.at_risk_end,
            "offTrack": thresholds.off_track,
        }
    except Exception:
        logger.exception("Failed to fetch global performance thresholds")
        return JSONResponse(status_code=500, content={"message": "Internal server error"})
