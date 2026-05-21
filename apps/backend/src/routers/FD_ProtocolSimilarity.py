from fastapi import APIRouter


router = APIRouter()


@router.get("/protocol-similarity/health")
def protocol_similarity_health():
	return {"status": "ok"}
