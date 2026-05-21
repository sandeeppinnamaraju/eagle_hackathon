from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from eagle_hackathon.apps.backend.src.routers.FD_StudyProtocol import router as studyProtocol_router
from eagle_hackathon.apps.backend.src.routers.FD_ProtocolSimilarity import router as protocolSimilarity_router

app = FastAPI(title="FlightDeck APIs", version="1.0.0")

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(studyProtocol_router, prefix="/api")
app.include_router(protocolSimilarity_router, prefix="/api")
app.include_router(studyProtocol_router)