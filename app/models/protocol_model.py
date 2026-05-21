from pydantic import BaseModel
from typing import Optional

class ProtocolSearchRequest(BaseModel):

    summary: str

    inclusion_criteria: Optional[str] = ""

    exclusion_criteria: Optional[str] = ""

    therapeutic_area: Optional[str] = None

    top_k: Optional[int] = 10