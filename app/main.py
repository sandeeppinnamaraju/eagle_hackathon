from fastapi import FastAPI
from app.routes.protocol_routes import router

app = FastAPI(
    title="FlightDeck Protocol Search API"
)

# =========================================
# REGISTER ROUTES
# =========================================

app.include_router(router)

# =========================================
# HEALTH CHECK
# =========================================

@app.get("/")

def home():

    return {
        "message": "FlightDeck API Running"
    }