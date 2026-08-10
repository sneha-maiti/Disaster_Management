from fastapi import APIRouter


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)


@router.get("/summary")
def dashboard_summary():

    return {
        "success": True,

        "system": "AETHER-X",

        "active_sos": 0,

        "active_disasters": 0,

        "available_shelters": 2,

        "system_status": "ONLINE"
    }