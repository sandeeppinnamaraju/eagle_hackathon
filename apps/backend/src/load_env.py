from pathlib import Path
from dotenv import load_dotenv


def load_backend_env() -> Path:
    """Load backend environment from eagle_hackathon/apps/.env."""
    apps_dir = Path(__file__).resolve().parents[2]
    env_path = apps_dir / ".env"

    # Force values from .env to avoid stale shell overrides.
    if env_path.exists():
        load_dotenv(env_path, override=True)

    return env_path
