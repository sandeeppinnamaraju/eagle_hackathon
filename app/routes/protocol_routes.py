from fastapi import APIRouter

from app.models.protocol_model import (
    ProtocolSearchRequest
)

from app.similarity_engine import (
    search_similar_protocols
)

from app.services.protocol_service import (
    get_protocol_details
)

# =========================================
# CREATE ROUTER
# =========================================

router = APIRouter()


# =========================================
# SEARCH PROTOCOLS API
# =========================================

@router.post("/search-protocols")

def search_protocols(
    request: ProtocolSearchRequest
):

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

    results = search_similar_protocols(

        query=full_query,

        therapeutic_areas=(
            request.therapeutic_areas
        ),

        top_k=request.top_k

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

    dashboard = get_protocol_details(
        protocol_id
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