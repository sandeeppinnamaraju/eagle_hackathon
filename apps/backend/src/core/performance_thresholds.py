from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import psycopg2

from eagle_hackathon.apps.backend.src.db.connection import get_conn_params


@dataclass(frozen=True)
class PerformanceThresholds:
    on_track: float
    at_risk_start: float
    at_risk_end: float
    off_track: float


DEFAULT_THRESHOLDS = PerformanceThresholds(
    on_track=95.0,
    at_risk_start=0.0,
    at_risk_end=79.0,
    off_track=80.0,
)


def ensure_threshold_table(cursor) -> None:
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS public.performance_threshold (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            on_track DOUBLE PRECISION NOT NULL,
            at_risk_start DOUBLE PRECISION NOT NULL,
            at_risk_end DOUBLE PRECISION NOT NULL,
            off_track DOUBLE PRECISION NOT NULL,
            updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
        )
        """
    )


def upsert_global_thresholds(
    *,
    on_track: float,
    at_risk_start: float,
    at_risk_end: float,
    off_track: float,
) -> None:
    conn_params = get_conn_params()
    with psycopg2.connect(**conn_params) as conn:
        with conn.cursor() as cursor:
            ensure_threshold_table(cursor)
            cursor.execute(
                """
                INSERT INTO public.performance_threshold (
                    id, on_track, at_risk_start, at_risk_end, off_track, updated_at
                )
                VALUES (1, %s, %s, %s, %s, NOW())
                ON CONFLICT (id)
                DO UPDATE SET
                    on_track = EXCLUDED.on_track,
                    at_risk_start = EXCLUDED.at_risk_start,
                    at_risk_end = EXCLUDED.at_risk_end,
                    off_track = EXCLUDED.off_track,
                    updated_at = NOW()
                """,
                [on_track, at_risk_start, at_risk_end, off_track],
            )


def get_performance_thresholds() -> PerformanceThresholds:
    conn_params = get_conn_params()
    try:
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT on_track, at_risk_start, at_risk_end, off_track
                    FROM public.performance_threshold
                    WHERE id = 1
                    """
                )
                row = cursor.fetchone()
                if not row:
                    return DEFAULT_THRESHOLDS
                return PerformanceThresholds(
                    on_track=float(row[0]),
                    at_risk_start=float(row[1]),
                    at_risk_end=float(row[2]),
                    off_track=float(row[3]),
                )
    except Exception:
        return DEFAULT_THRESHOLDS


def classify_performance(
    value: Optional[float],
    thresholds: Optional[PerformanceThresholds] = None,
) -> str:
    thresholds = thresholds or get_performance_thresholds()
    percent = float(value or 0)

    if percent >= thresholds.on_track:
        return "ON_TRACK"
    if thresholds.at_risk_start <= percent <= thresholds.at_risk_end:
        return "AT_RISK"
    if percent <= thresholds.off_track:
        return "OFF_TRACK"

    # Gap fallback: values not in explicit ranges are treated as at-risk.
    return "AT_RISK"