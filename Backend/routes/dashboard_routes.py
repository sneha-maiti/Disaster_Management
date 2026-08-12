from fastapi import APIRouter
from models.sos import get_all_sos_requests
from models.disaster import get_active_disasters
from models.shelter import get_all_shelters


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)


@router.get("/summary")
def dashboard_summary():
    sos_count = len([s for s in get_all_sos_requests() if s["status"] != "resolved"])
    disaster_count = len(get_active_disasters())
    shelter_count = len(get_all_shelters())

    return {
        "success": True,
        "system": "AETHER-X",
        "active_sos": sos_count,
        "active_disasters": disaster_count,
        "available_shelters": shelter_count,
        "system_status": "ONLINE"
    }