from __future__ import annotations

from typing import Any, Dict, List, Optional, Sequence, Tuple

from sqlalchemy import text

from app.database import engine


# ============================================================
# INTERNAL HELPERS
# ============================================================

def _row_to_dict(row: Any, columns: Sequence[str]) -> Dict[str, Any]:
    """
    Convert a SQLAlchemy row + column names into a plain dictionary.
    """
    return dict(zip(columns, row))


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        if value is None:
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _split_criteria_to_bullets(text_value: Optional[str]) -> List[str]:
    """
    Convert raw multi-line criteria text into a clean bullet list.
    """

    if not text_value:
        return []

    lines = []

    for raw_line in text_value.splitlines():

        line = raw_line.strip()

        if not line:
            continue

        # Remove common bullet prefixes

        if line.startswith("* "):
            line = line[2:].strip()

        elif line.startswith("- "):
            line = line[2:].strip()

        elif line.startswith("• "):
            line = line[2:].strip()

        # Keep useful content only

        if len(line) >= 8:
            lines.append(line)

    return lines


# ============================================================
# GET PROTOCOL LIST
# ============================================================

def get_protocols() -> Tuple[List[Any], Sequence[str]]:
    """
    Return sample protocol rows and column names.
    Useful for debugging and search model builds.
    """

    query = text("""
        SELECT *
        FROM protocols
        LIMIT 5
    """)

    with engine.connect() as connection:

        result = connection.execute(query)

        rows = result.fetchall()

        columns = result.keys()

        return rows, columns


# ============================================================
# GET PROTOCOL BY ID
# ============================================================

def get_protocol_by_id(
    protocol_id: str
) -> Optional[Dict[str, Any]]:
    """
    Fetch one protocol record by protocol_id.
    Returns a JSON-friendly dictionary or None if not found.
    """

    query = text("""
        SELECT *
        FROM protocols
        WHERE protocol_id = :protocol_id
    """)

    with engine.connect() as connection:

        result = connection.execute(

            query,

            {
                "protocol_id": protocol_id
            }

        )

        row = result.fetchone()

        if not row:
            return None

        columns = result.keys()

        return _row_to_dict(
            row,
            columns
        )


# ============================================================
# GET PROTOCOL SITES
# ============================================================

def get_protocol_sites(
    protocol_id: str
) -> List[Dict[str, Any]]:
    """
    Fetch and transform protocol site rows
    for dashboard rendering.
    """

    query = text("""
        SELECT *
        FROM protocol_sites
        WHERE protocol_id = :protocol_id
        ORDER BY id ASC
    """)

    with engine.connect() as connection:

        result = connection.execute(

            query,

            {
                "protocol_id": protocol_id
            }

        )

        rows = result.fetchall()

        columns = result.keys()

        sites: List[Dict[str, Any]] = []

        for row in rows:

            site = _row_to_dict(
                row,
                columns
            )

            # =====================================
            # SAFE NUMERIC EXTRACTION
            # =====================================

            target_enrollment = _safe_float(
                site.get("target_enrollment"),
                0
            )

            actual_enrollment = _safe_float(
                site.get("actual_enrollment"),
                0
            )

            # =====================================
            # ACHIEVEMENT %
            # =====================================

            achievement_percent = 0.0

            if target_enrollment > 0:

                achievement_percent = round(

                    (
                        actual_enrollment
                        / target_enrollment
                    ) * 100,

                    1

                )

            # =====================================
            # ENROLLMENT GAP
            # =====================================

            enrollment_gap = round(

                target_enrollment
                - actual_enrollment,

                1

            )

            # =====================================
            # PERFORMANCE STATUS
            # =====================================

            if achievement_percent >= 80:

                performance_status = "On Track"

            elif achievement_percent >= 50:

                performance_status = "Moderate Risk"

            else:

                performance_status = "High Risk"

            # =====================================
            # ENRICH SITE OBJECT
            # =====================================

            site["achievement_percent"] = (
                achievement_percent
            )

            site["enrollment_gap"] = (
                enrollment_gap
            )

            site["performance_status"] = (
                performance_status
            )

            sites.append(site)

        return sites


# ============================================================
# GET PROTOCOL KPI SUMMARY
# ============================================================

def get_protocol_kpis(
    protocol: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Build dashboard KPI values from
    the protocol record.
    """

    target_enrollment = _safe_int(
        protocol.get("target_enrollment"),
        0
    )

    actual_enrollment = _safe_int(
        protocol.get("actual_enrollment"),
        0
    )

    planned_duration = _safe_int(
        protocol.get("planned_duration_months"),
        0
    )

    actual_duration = _safe_int(
        protocol.get("actual_duration_months"),
        0
    )

    enrollment_percent = 0.0

    if target_enrollment > 0:

        enrollment_percent = round(

            (
                actual_enrollment
                / target_enrollment
            ) * 100.0,

            1

        )

    if enrollment_percent >= 80:

        enrollment_status = "On Track"

    elif enrollment_percent >= 50:

        enrollment_status = "Moderate Risk"

    else:

        enrollment_status = "High Risk"

    return {

        "target_enrollment": (
            target_enrollment
        ),

        "actual_enrollment": (
            actual_enrollment
        ),

        "planned_duration_months": (
            planned_duration
        ),

        "actual_duration_months": (
            actual_duration
        ),

        "enrollment_percent": (
            enrollment_percent
        ),

        "enrollment_status": (
            enrollment_status
        ),

    }


# ============================================================
# GENERATE RULE-BASED INSIGHTS
# ============================================================

def generate_ai_insights(

    protocol: Dict[str, Any],

    kpis: Dict[str, Any],

    sites: List[Dict[str, Any]]

) -> List[Dict[str, Any]]:
    """
    Rule-based insights for dashboard display.
    This is intentionally deterministic
    and does not use AI.
    """

    insights: List[Dict[str, Any]] = []

    enrollment_percent = _safe_float(
        kpis.get("enrollment_percent"),
        0.0
    )

    actual_enrollment = _safe_int(
        kpis.get("actual_enrollment"),
        0
    )

    target_enrollment = _safe_int(
        kpis.get("target_enrollment"),
        0
    )

    # =====================================
    # ENROLLMENT RISK
    # =====================================

    if enrollment_percent < 50:

        insights.append({

            "type": "risk",

            "title": "Enrollment Risk",

            "message": (
                f"Enrollment is at "
                f"{enrollment_percent}% "
                f"of target "
                f"({actual_enrollment}/"
                f"{target_enrollment})."
            )

        })

    elif enrollment_percent < 80:

        insights.append({

            "type": "warning",

            "title": (
                "Enrollment Pace "
                "Needs Monitoring"
            ),

            "message": (
                f"Enrollment is below "
                f"target pace at "
                f"{enrollment_percent}%."
            )

        })

    else:

        insights.append({

            "type": "positive",

            "title": (
                "Enrollment Performance "
                "is Strong"
            ),

            "message": (
                f"Enrollment is tracking "
                f"well at "
                f"{enrollment_percent}% "
                f"of target."
            )

        })

    # =====================================
    # LOW PERFORMANCE SITES
    # =====================================

    low_sites = [

        s for s in sites

        if str(
            s.get("performance_tier", "")
        ).lower() == "low"

    ]

    if len(low_sites) >= 3:

        insights.append({

            "type": "warning",

            "title": (
                "Site Performance "
                "Concentration Risk"
            ),

            "message": (
                f"{len(low_sites)} "
                f"sites are currently "
                f"classified as "
                f"Low tier."
            )

        })

    # =====================================
    # LESSONS LEARNED AVAILABLE
    # =====================================

    if protocol.get("lessons_learned"):

        insights.append({

            "type": "info",

            "title": (
                "Historical Learning "
                "Available"
            ),

            "message": (
                "This protocol already "
                "has documented lessons "
                "learned that can be used "
                "to inform future planning."
            )

        })

    return insights


# ============================================================
# GET FULL PROTOCOL DASHBOARD PAYLOAD
# ============================================================

def get_protocol_details(
    protocol_id: str
) -> Optional[Dict[str, Any]]:
    """
    Aggregated detail payload
    for the dashboard page.
    """

    protocol = get_protocol_by_id(
        protocol_id
    )

    if not protocol:
        return None

    sites = get_protocol_sites(
        protocol_id
    )

    kpis = get_protocol_kpis(
        protocol
    )

    # =====================================
    # FULL CRITERIA ARRAYS
    # =====================================

    inclusion_criteria = (
        _split_criteria_to_bullets(
            protocol.get(
                "inclusion_criteria"
            )
        )
    )

    exclusion_criteria = (
        _split_criteria_to_bullets(
            protocol.get(
                "exclusion_criteria"
            )
        )
    )

    # =====================================
    # CRITERIA PREVIEWS
    # =====================================

    inclusion_preview = (
        inclusion_criteria[:5]
    )

    exclusion_preview = (
        exclusion_criteria[:5]
    )

    # =====================================
    # AI INSIGHTS
    # =====================================

    insights = generate_ai_insights(

        protocol,

        kpis,

        sites

    )

    # =====================================
    # RETURN DASHBOARD PAYLOAD
    # =====================================

    return {

        "protocol": protocol,

        "kpis": kpis,

        "sites": sites,

        "total_sites": len(sites),

        "criteria": {

            "inclusion": (
                inclusion_criteria
            ),

            "exclusion": (
                exclusion_criteria
            ),

            "inclusion_preview": (
                inclusion_preview
            ),

            "exclusion_preview": (
                exclusion_preview
            )

        },

        "lessons_learned": (
            protocol.get(
                "lessons_learned"
            )
        ),

        "ai_insights": insights

    }