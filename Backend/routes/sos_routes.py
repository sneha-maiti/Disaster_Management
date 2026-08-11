from fastapi import APIRouter, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict

from services.ai_service import analyze_threat
from services.notification_service import send_sos_notification
from utils.helpers import generate_id, get_current_timestamp, clean_text
from utils.validators import validate_coordinates, validate_severity


router = APIRouter(
    prefix="/api/sos",
    tags=["SOS Operations"]
)


class SOSInput(BaseModel):
    reporter_name: str = Field(...)
    phone: str = Field(...)
    latitude: float = Field(...)
    longitude: float = Field(...)
    location_name: Optional[str] = None
    description: str = Field(...)
    user_severity: int = Field(default=3, ge=1, le=4)


sos_database: List[Dict] = []


@router.get("/")
def get_all_sos():

    return {
        "success": True,
        "count": len(sos_database),
        "data": sos_database,
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_sos(payload: SOSInput):

    # -----------------------------
    # 1. VALIDATION
    # -----------------------------

    validate_coordinates(
        payload.latitude,
        payload.longitude
    )

    validate_severity(
        payload.user_severity
    )

    # -----------------------------
    # 2. CLEAN USER INPUT
    # -----------------------------

    description = clean_text(
        payload.description
    )

    # -----------------------------
    # 3. AI THREAT ANALYSIS
    # -----------------------------

    threat_analysis = analyze_threat(
        description,
        payload.user_severity
    )

    # -----------------------------
    # 4. CREATE SOS RECORD
    # -----------------------------

    sos_record = {

        "id": generate_id("SOS"),

        "timestamp": get_current_timestamp(),

        "reporter_name": payload.reporter_name,

        "phone": payload.phone,

        "location": payload.location_name,

        "coordinates": {
            "lat": payload.latitude,
            "lng": payload.longitude,
        },

        "description": description,

        "severity_level": threat_analysis["level"],

        "threat_score": threat_analysis["score"],

        "priority_code": threat_analysis["priority"],

        "status": "DISPATCHED",
    }

    # -----------------------------
    # 5. STORE RECORD
    # -----------------------------

    sos_database.insert(
        0,
        sos_record
    )

    # -----------------------------
    # 6. SEND NOTIFICATION
    # -----------------------------

    notification = send_sos_notification(
        sos_record["id"],
        sos_record["priority_code"]
    )

    # -----------------------------
    # 7. RETURN RESPONSE
    # -----------------------------

    return {

        "success": True,

        "message": "SOS successfully dispatched.",

        "dispatch_details": sos_record,

        "notification": notification,
    }