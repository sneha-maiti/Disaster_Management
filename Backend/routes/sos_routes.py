from fastapi import APIRouter, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict

from services.ai_service import analyze_threat
from services.notification_service import send_sos_notification
from utils.helpers import generate_id, get_current_timestamp, clean_text
from utils.validators import validate_coordinates, validate_severity
from models.sos import create_sos_request, get_all_sos_requests


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


@router.get("")
@router.get("/")
def get_all_sos():
    db_records = get_all_sos_requests()
    formatted_data = []

    for req in db_records:
        formatted_data.append({
            "id": f"SOS-{req['id']}",
            "user_id": req["user_id"],
            "latitude": req["latitude"],
            "longitude": req["longitude"],
            "coordinates": {
                "lat": req["latitude"],
                "lng": req["longitude"]
            },
            "description": req["description"],
            "image_url": req["image_url"],
            "status": req["status"],
            "severity": req["severity"],
            "timestamp": req["created_at"]
        })

    return {
        "success": True,
        "count": len(formatted_data),
        "data": formatted_data,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
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
    # 4. STORE IN DATABASE
    # -----------------------------
    db_severity_map = {
        "RED": "high",
        "ORANGE": "high",
        "YELLOW": "medium",
        "GREEN": "low"
    }
    db_severity = db_severity_map.get(threat_analysis.get("priority"), "medium")

    sos_id_num = create_sos_request(
        user_id=None,
        latitude=payload.latitude,
        longitude=payload.longitude,
        description=description,
        image_url=None,
        severity=db_severity
    )

    sos_record = {
        "id": f"SOS-{sos_id_num}",
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
    # 5. SEND NOTIFICATION
    # -----------------------------

    notification = send_sos_notification(
        sos_record["id"],
        sos_record["priority_code"]
    )

    # -----------------------------
    # 6. RETURN RESPONSE
    # -----------------------------

    return {
        "success": True,
        "message": "SOS successfully dispatched.",
        "dispatch_details": sos_record,
        "notification": notification,
    }