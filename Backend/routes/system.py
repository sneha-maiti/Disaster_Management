from fastapi import APIRouter
from datetime import datetime
from utils.config import GEMINI_API_KEY, MAPS_API_KEY, APP_NAME, APP_VERSION

router = APIRouter(tags=["System"])

@router.get("/", summary="System Health & Diagnostic Check")
def system_root_check():
    """System Health Endpoint & API Key Diagnostic Check"""
    return {
        "status": "ONLINE",
        "system_name": APP_NAME,
        "version": APP_VERSION,
        "api_keys_loaded": {
            "gemini_api": bool(GEMINI_API_KEY and GEMINI_API_KEY != "DEMO_GEMINI_KEY"),
            "google_maps_api": bool(MAPS_API_KEY and MAPS_API_KEY != "DEMO_MAPS_KEY")
        },
        "timestamp": datetime.now().isoformat()
    }

@router.get("/health", summary="Lightweight Deployment Health Probe")
def health_check():
    """Deployment readiness health probe for load balancers and container monitoring"""
    return {
        "status": "UP",
        "timestamp": datetime.now().isoformat()
    }
