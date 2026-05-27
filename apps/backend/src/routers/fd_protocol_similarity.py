import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from sqlalchemy.exc import SQLAlchemyError

from eagle_hackathon.apps.backend.models.protocol_model import (
    ProtocolSearchRequest
)

from eagle_hackathon.apps.backend.src.scripts.similarity_engine import (
    search_similar_protocols
)

from eagle_hackathon.apps.backend.services.protocol_service import get_protocol_details

# =========================================
# CREATE ROUTER
# =========================================

router = APIRouter()
logger = logging.getLogger(__name__)


def _require_non_empty_text(raw_value: object, *, field_name: str) -> str:
    if not isinstance(raw_value, str):
        raise HTTPException(status_code=400, detail=f"Invalid {field_name}")

    cleaned = raw_value.strip()
    if not cleaned:
        raise HTTPException(status_code=400, detail=f"Invalid {field_name}")
    return cleaned


def _normalize_optional_text(raw_value: object, *, field_name: str) -> str:
    if raw_value is None:
        return ""
    if not isinstance(raw_value, str):
        raise HTTPException(status_code=400, detail=f"Invalid {field_name}")
    return raw_value.strip()


def _normalize_therapeutic_areas(raw_value: object) -> Optional[list[str]]:
    if raw_value is None:
        return None
    if not isinstance(raw_value, list):
        raise HTTPException(status_code=400, detail="Invalid therapeutic_areas")

    cleaned_values: list[str] = []
    for item in raw_value:
        if not isinstance(item, str):
            raise HTTPException(status_code=400, detail="Invalid therapeutic_areas")
        cleaned_item = item.strip()
        if not cleaned_item:
            raise HTTPException(status_code=400, detail="Invalid therapeutic_areas")
        cleaned_values.append(cleaned_item)

    return cleaned_values or None


def _validate_search_request(request: ProtocolSearchRequest) -> tuple[str, str, str, Optional[list[str]], int]:
    if not isinstance(request, ProtocolSearchRequest):
        raise HTTPException(status_code=400, detail="Invalid request payload")

    summary = _require_non_empty_text(request.summary, field_name="summary")
    inclusion_criteria = _normalize_optional_text(request.inclusion_criteria, field_name="inclusion_criteria")
    exclusion_criteria = _normalize_optional_text(request.exclusion_criteria, field_name="exclusion_criteria")
    therapeutic_areas = _normalize_therapeutic_areas(request.therapeutic_areas)

    if not isinstance(request.top_k, int) or request.top_k < 1 or request.top_k > 100:
        raise HTTPException(status_code=400, detail="Invalid top_k")

    if not any([summary, inclusion_criteria, exclusion_criteria]):
        raise HTTPException(status_code=400, detail="At least one search field is required")

    return summary, inclusion_criteria, exclusion_criteria, therapeutic_areas, request.top_k

# =========================================
# SEARCH PROTOCOLS API
# =========================================

@router.post("/search-protocols")

def search_protocols(
    request: ProtocolSearchRequest
):

    logger.info("Received search-protocols request")
    summary, inclusion_criteria, exclusion_criteria, therapeutic_areas, top_k = _validate_search_request(request)

    # =====================================
    # BUILD FULL SEARCH QUERY
    # =====================================

    full_query = f"""

    {summary}

    {inclusion_criteria}

    {exclusion_criteria}

    """

    # =====================================
    # RUN SIMILARITY ENGINE
    # =====================================

    try:
        results = search_similar_protocols(

            query=full_query,

            therapeutic_areas=therapeutic_areas,

            top_k=top_k

        )
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc) or "Invalid search request") from exc
    except SQLAlchemyError:
        logger.exception("Database error while searching protocols")
        raise HTTPException(
            status_code=503,
            detail="Protocol search is temporarily unavailable due to a database connectivity issue."
        )
    except Exception:
        logger.exception("Unexpected error while searching protocols")
        raise HTTPException(
            status_code=500,
            detail="Unexpected server error while searching protocols."
        )

    # =====================================
    # RETURN FRONTEND CONTRACT
    # =====================================

    return {

        "success": True,

        "query": {

            "summary": summary,

            "therapeutic_areas": therapeutic_areas

        },

        "total_results": len(results),

        "results": results

    }


# =========================================
# GET PROTOCOL DETAIL DASHBOARD
# =========================================

@router.get("/protocol/{protocol_id}")

def get_protocol_detail(
    protocol_id: str
):
    protocol_id = _require_non_empty_text(protocol_id, field_name="protocol_id")

    # =====================================
    # FETCH FULL DASHBOARD PAYLOAD
    # =====================================

    try:
        dashboard = get_protocol_details(
            protocol_id
        )
    except SQLAlchemyError:
        logger.exception("Database error while fetching protocol detail")
        raise HTTPException(
            status_code=503,
            detail="Protocol detail is temporarily unavailable due to a database connectivity issue."
        )
    except Exception:
        logger.exception("Unexpected error while fetching protocol detail")
        raise HTTPException(
            status_code=500,
            detail="Unexpected server error while fetching protocol detail."
        )

    # =====================================
    # HANDLE NOT FOUND
    # =====================================

    if not dashboard:

        return {

            "success": False,

            "message": "Protocol not found"

        }

    # =====================================
    # RETURN DASHBOARD RESPONSE
    # =====================================

    return {

        "success": True,

        **dashboard

    }