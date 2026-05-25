import logging

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

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# =========================================
# SEARCH PROTOCOLS API
# =========================================

@router.post("/search-protocols")

def search_protocols(
    request: ProtocolSearchRequest
):

    logging.info("Received search-protocols request")

    # =====================================
    # BUILD FULL SEARCH QUERY
    # =====================================

    full_query = f"""

    {request.summary}

    {request.inclusion_criteria}

    {request.exclusion_criteria}

    """

    # =====================================
    # RUN SIMILARITY ENGINE
    # =====================================

    try:
        results = search_similar_protocols(

            query=full_query,

            therapeutic_areas=(
                request.therapeutic_areas
            ),

            top_k=request.top_k

        )
    except SQLAlchemyError:
        logging.exception("Database error while searching protocols")
        raise HTTPException(
            status_code=503,
            detail="Protocol search is temporarily unavailable due to a database connectivity issue."
        )
    except Exception:
        logging.exception("Unexpected error while searching protocols")
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

            "summary": request.summary,

            "therapeutic_areas": (
                request.therapeutic_areas
            )

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

    # =====================================
    # FETCH FULL DASHBOARD PAYLOAD
    # =====================================

    try:
        dashboard = get_protocol_details(
            protocol_id
        )
    except SQLAlchemyError:
        logging.exception("Database error while fetching protocol detail")
        raise HTTPException(
            status_code=503,
            detail="Protocol detail is temporarily unavailable due to a database connectivity issue."
        )
    except Exception:
        logging.exception("Unexpected error while fetching protocol detail")
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