import sys
import os

# Add Backend root directory to python path for modular imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from utils.config import APP_NAME, APP_VERSION, CORS_ORIGINS, HOST, PORT, DEBUG

# -----------------------------------------
# IMPORT ALL ROUTERS (SYSTEM, AI, MAPS & TEAMMATE ROUTES)
# -----------------------------------------
from routes.system import router as system_router
from routes.ai import router as ai_router
from routes.maps import router as maps_router
from routes.dashboard_routes import router as dashboard_router
from routes.disaster_routes import router as disaster_router
from routes.auth_routes import router as auth_router
from routes.shelter_routes import router as shelter_router
from routes.sos_routes import router as sos_router

# Initialize FastAPI Application
app = FastAPI(
    title=APP_NAME,
    description="Autonomous Disaster Management & Emergency Response Engine (SIH 2026)",
    version=APP_VERSION,
    docs_url="/docs",      # Interactive Swagger UI
    redoc_url="/redoc"    # ReDoc Documentation
)

# Configure CORS Middleware (Supports environment-configured origin list or local dev wildcard)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------
# REGISTER ALL ROUTERS TO APPLICATION
# -----------------------------------------
app.include_router(system_router)
app.include_router(ai_router)
app.include_router(maps_router)
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(disaster_router)
app.include_router(shelter_router)
app.include_router(sos_router)

if __name__ == "__main__":
    uvicorn.run("app:app", host=HOST, port=PORT, reload=DEBUG)