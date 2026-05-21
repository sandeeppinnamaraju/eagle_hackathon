from fastapi import APIRouter

from app.models.protocol_model import (
    ProtocolSearchRequest
)

from app.similarity_engine import (
    search_similar_protocols
)

from app.services.protocol_service import (
    get_protocol_by_id,
    get_protocol_sites
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
    # RUN SEARCH ENGINE
    # =====================================

    results = search_similar_protocols(
        query=full_query,
        therapeutic_area=request.therapeutic_area,
        top_k=request.top_k
    )

    # =====================================
    # RETURN RESPONSE
    # =====================================

    return {
        "success": True,
        "total_results": len(results),
        "results": results
    }
# =========================================
# GET PROTOCOL DETAIL
# =========================================

@router.get("/protocol/{protocol_id}")

def get_protocol_detail(
    protocol_id: str
):

    # =====================================
    # FETCH MAIN PROTOCOL
    # =====================================

    protocol = get_protocol_by_id(
        protocol_id
    )

    # =====================================
    # HANDLE NOT FOUND
    # =====================================

    if not protocol:

        return {
            "success": False,
            "message": "Protocol not found"
        }

    # =====================================
    # FETCH SITES
    # =====================================

    sites = get_protocol_sites(
        protocol_id
    )

    # =====================================
    # RETURN AGGREGATED RESPONSE
    # =====================================

    return {
        "success": True,
        "protocol": protocol,
        "sites": sites,
        "total_sites": len(sites)
    }