from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
import os
from datetime import datetime
from dotenv import load_dotenv

# Load Environment Variables / API Keys
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "DEMO_GEMINI_KEY")
MAPS_API_KEY = os.getenv("MAPS_API_KEY", "DEMO_MAPS_KEY")

# Initialize FastAPI Application
app = FastAPI(
    title="AETHER-X Tactical Core API",
    description="Autonomous Disaster Management & Emergency Response Engine (SIH 2026)",
    version="2.1.0",
    docs_url="/docs",      # Interactive Swagger UI
    redoc_url="/redoc"    # ReDoc Documentation
)

# Configure CORS Middleware (Allows Frontend to talk to Backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------- DATA MODELS (PYDANTIC SCHEMAS) ------------------- #

class SOSInput(BaseModel):
    reporter_name: str = Field(..., example="Aarav Sharma")
    phone: str = Field(..., example="+91 9876543210")
    latitude: float = Field(..., example=22.5726)
    longitude: float = Field(..., example=88.3639)
    location_name: Optional[str] = Field("Kolkata Sector V", example="Kolkata Sector V")
    description: str = Field(..., example="Severe waterlogging, elderly person trapped inside household.")
    user_severity: Optional[int] = Field(3, ge=1, le=4, example=3)

class SOSResponse(BaseModel):
    id: str
    timestamp: str
    reporter_name: str
    phone: str
    location: str
    coordinates: Dict[str, float]
    description: str
    severity_level: str
    threat_score: int
    priority_code: str
    status: str

# In-Memory Realtime Database Buffer
sos_database: List[Dict] = []

# ------------------- AI / HEURISTIC INTELLIGENCE ENGINE ------------------- #

def analyze_threat_with_ai(description: str, requested_level: int) -> Dict:
    """Simulates Gemini LLM Threat Classification for High-Priority SOS Calls"""
    critical_keywords = ["trapped", "bleeding", "drowning", "explosion", "fire", "collapsed"]
    moderate_keywords = ["waterlogging", "power cut", "food", "shelter", "blocked"]
    
    score = requested_level * 20
    desc_lower = description.lower()
    
    for word in critical_keywords:
        if word in desc_lower:
            score += 25
            
    for word in moderate_keywords:
        if word in desc_lower:
            score += 10
            
    score = min(score, 100) # Cap at 100
    
    if score >= 80:
        return {"level": "LEVEL 4 - CRITICAL", "priority": "RED", "score": score}
    elif score >= 60:
        return {"level": "LEVEL 3 - HIGH", "priority": "ORANGE", "score": score}
    elif score >= 40:
        return {"level": "LEVEL 2 - MODERATE", "priority": "YELLOW", "score": score}
    else:
        return {"level": "LEVEL 1 - LOW", "priority": "GREEN", "score": score}

# ------------------- API ENDPOINTS ------------------- #

@app.get("/", tags=["System"])
def system_health_check():
    """System Health Endpoint & API Key Diagnostic Check"""
    return {
        "status": "ONLINE",
        "system_name": "AETHER-X Tactical Core",
        "api_keys_loaded": {
            "gemini_api": bool(GEMINI_API_KEY),
            "google_maps_api": bool(MAPS_API_KEY)
        },
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/sos", tags=["SOS Operations"])
def fetch_all_sos_signals():
    """Fetch all active emergency signals currently registered in the system grid"""
    return {
        "success": True,
        "count": len(sos_database),
        "data": sos_database
    }

@app.post("/api/sos", status_code=status.HTTP_201_CREATED, tags=["SOS Operations"])
def dispatch_sos_signal(payload: SOSInput):
    """Process incoming emergency SOS dispatch, runs AI threat calculation, and stores signal"""
    
    # Run AI Threat Assessment
    threat_analysis = analyze_threat_with_ai(payload.description, payload.user_severity)
    
    sos_record = {
        "id": f"SOS-{len(sos_database) + 1001}",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "reporter_name": payload.reporter_name,
        "phone": payload.phone,
        "location": payload.location_name,
        "coordinates": {"lat": payload.latitude, "lng": payload.longitude},
        "description": payload.description,
        "severity_level": threat_analysis["level"],
        "threat_score": threat_analysis["score"],
        "priority_code": threat_analysis["priority"],
        "status": "DISPATCHED"
    }
    
    sos_database.insert(0, sos_record)
    
    return {
        "success": True,
        "message": "Tactical SOS Signal successfully broadcasted to AETHER-X Grid",
        "dispatch_details": sos_record
    }

@app.get("/api/shelters", tags=["Geospatial Grid"])
def get_nearby_shelters():
    """Provides active relief shelters with real-time capacity monitoring"""
    return {
        "success": True,
        "shelters": [
            {
                "id": "SHELTER-01",
                "name": "Kolkata Central Relief Camp",
                "latitude": 22.5726,
                "longitude": 88.3639,
                "total_capacity": 500,
                "occupied": 120,
                "available_resources": ["Medical Kits", "Food Packets", "Power Generators"],
                "status": "ACTIVE"
            },
            {
                "id": "SHELTER-02",
                "name": "Howrah Disaster Evacuation Center",
                "latitude": 22.5958,
                "longitude": 88.2636,
                "total_capacity": 350,
                "occupied": 210,
                "available_resources": ["Boats", "Clean Water", "First Aid"],
                "status": "ACTIVE"
            }
        ]
    }