
# Load environment variables from eagle_hackathon/apps/.env before importing routers.
from eagle_hackathon.apps.backend.src.load_env import load_backend_env
from eagle_hackathon.apps.backend.src.core.config import get_settings
from eagle_hackathon.apps.backend.src.core.logging_config import configure_logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

load_backend_env()
configure_logging()
settings = get_settings()

from eagle_hackathon.apps.backend.src.routers.fd_study_protocol import router as study_protocol_router
from eagle_hackathon.apps.backend.src.routers.fd_protocol_similarity import router as protocol_similarity_router
from eagle_hackathon.apps.backend.src.routers.fd_study_overview import router as study_overview_router
from eagle_hackathon.apps.backend.src.routers.fd_admin_config import router as admin_config_router

app = FastAPI(title=settings.app_name, version=settings.app_version)

app.add_middleware(
	CORSMiddleware,
	allow_origins=settings.allowed_origins,
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

# Backward-compatible unversioned endpoints.
app.include_router(study_protocol_router, prefix=settings.api_prefix)
app.include_router(protocol_similarity_router, prefix=settings.api_prefix)
app.include_router(study_overview_router, prefix=settings.api_prefix)
app.include_router(admin_config_router, prefix=settings.api_prefix)

# Versioned endpoints for future migrations.
app.include_router(study_protocol_router, prefix=settings.api_version_prefix)
app.include_router(protocol_similarity_router, prefix=settings.api_version_prefix)
app.include_router(study_overview_router, prefix=settings.api_version_prefix)
app.include_router(admin_config_router, prefix=settings.api_version_prefix)


if __name__ == "__main__":
    uvicorn.run("eagle_hackathon.apps.backend.src.main:app", host="0.0.0.0", port=8000, reload=True)