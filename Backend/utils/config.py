import os
from dotenv import load_dotenv

# Load Environment Variables from .env file if available
load_dotenv()

# Application Info & Deployment Settings
APP_NAME = os.getenv("APP_NAME", "AETHER-X Tactical Core API")
APP_VERSION = os.getenv("APP_VERSION", "2.1.0")
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")

# CORS Settings (Allows configurable origin list or default wildcard for local dev)
raw_cors = os.getenv("CORS_ORIGINS", "*")
CORS_ORIGINS = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]

# External API Keys (Safe retrieval with fallbacks)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_GEMINI_API_KEY") or "DEMO_GEMINI_KEY"
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY") or os.getenv("MAPS_API_KEY") or "DEMO_MAPS_KEY"
MAPS_API_KEY = GOOGLE_MAPS_API_KEY
