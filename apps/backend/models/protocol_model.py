from pydantic import BaseModel
from typing import Optional, List


# =========================================
# SEARCH REQUEST MODEL
# =========================================

class ProtocolSearchRequest(BaseModel):

    # REQUIRED
    summary: str

    # OPTIONAL
    inclusion_criteria: Optional[str] = ""

    exclusion_criteria: Optional[str] = ""

    # MULTI-SELECT DROPDOWN
    therapeutic_areas: Optional[List[str]] = []

    # RESULT COUNT
    top_k: int = 10