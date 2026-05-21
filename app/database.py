from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from pathlib import Path
from urllib.parse import quote_plus
import os

# =========================================
# Locate project root
# =========================================

BASE_DIR = Path(__file__).resolve().parent.parent

# =========================================
# Load .env file
# =========================================

env_path = BASE_DIR / ".env"

print("LOOKING FOR ENV FILE:")
print(env_path)

load_dotenv(dotenv_path=env_path)

# =========================================
# Debug Environment Variables
# =========================================

print("\nLOADING ENV VARIABLES...\n")

print("PGHOST:", os.getenv("PGHOST"))
print("PGPORT:", os.getenv("PGPORT"))

# =========================================
# Read Environment Variables
# =========================================

PGHOST = os.getenv("PGHOST")
PGUSER = os.getenv("PGUSER")
PGPORT = os.getenv("PGPORT")
PGDATABASE = os.getenv("PGDATABASE")
PGPASSWORD = os.getenv("PGPASSWORD")

# =========================================
# Encode Password
# Handles special characters like @
# =========================================

encoded_password = quote_plus(PGPASSWORD)

# =========================================
# Database URL
# =========================================

DATABASE_URL = (
    f"postgresql+psycopg2://{PGUSER}:{encoded_password}"
    f"@{PGHOST}:{PGPORT}/{PGDATABASE}"
)

# =========================================
# Create SQLAlchemy Engine
# =========================================

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

# =========================================
# Session Factory
# =========================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# =========================================
# Dependency for FastAPI
# =========================================

def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()