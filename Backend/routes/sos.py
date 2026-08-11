from fastapi import APIRouter, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from services.ai_service import analyze_threat_with_ai

router = APIRouter(prefix="/api/sos", tags=["SOS Operations"])

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

@router.get("")
@router.get("/")
def fetch_all_sos_signals():
    """Fetch all active emergency signals currently registered in the system grid"""
    urgency_weights = {"RED": 1, "ORANGE": 2, "YELLOW": 3, "GREEN": 4}
    sorted_signals = sorted(
        sos_database,
        key=lambda x: urgency_weights.get(x.get("priority_code", "GREEN"), 5)
    )
    return {
        "success": True,
        "count": len(sorted_signals),
        "data": sorted_signals
    }

@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
def dispatch_sos_signal(payload: SOSInput):
    """Process incoming emergency SOS dispatch, runs AI threat calculation, and stores signal"""
    user_sev = payload.user_severity if payload.user_severity is not None else 3
    threat_analysis = analyze_threat_with_ai(payload.description, user_sev)
    
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
