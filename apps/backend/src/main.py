
# Load environment variables from eagle_hackathon/apps/.env before importing routers.
from eagle_hackathon.apps.backend.src.load_env import load_backend_env
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_backend_env()

from eagle_hackathon.apps.backend.src.routers.fd_study_protocol import router as study_protocol_router
from eagle_hackathon.apps.backend.src.routers.fd_protocol_similarity import router as protocol_similarity_router

app = FastAPI(title="FlightDeck APIs", version="1.0.0")

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(study_protocol_router, prefix="/api")
app.include_router(protocol_similarity_router, prefix="/api")