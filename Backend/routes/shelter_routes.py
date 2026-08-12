from fastapi import APIRouter, Query
from models.shelter import get_all_shelters
import math

router = APIRouter(
    prefix="/api/shelters",
    tags=["Geospatial Grid"]
)


def calculate_distance(lat1, lon1, lat2, lon2):
    return math.sqrt((lat2 - lat1) ** 2 + (lon2 - lon1) ** 2)


@router.get("")
@router.get("/")
def shelters():
    db_shelters = get_all_shelters()
    shelter_list = []
    for s in db_shelters:
        resources_list = [r.strip() for r in str(s["resources"]).split(",") if r.strip()] if s["resources"] else []
        occupied = s["capacity"] - s["available_space"]
        shelter_list.append({
            "id": f"SHELTER-{s['id']:02d}",
            "name": s["name"],
            "location": s["location"],
            "latitude": s["latitude"],
            "longitude": s["longitude"],
            "total_capacity": s["capacity"],
            "available_space": s["available_space"],
            "occupied": occupied if occupied >= 0 else 0,
            "available_resources": resources_list,
            "status": "ACTIVE"
        })

    return {
        "success": True,
        "shelters": shelter_list,
    }


@router.get("/nearest")
def nearest_shelter(
    latitude: float = Query(...),
    longitude: float = Query(...)
):
    all_res = shelters()["shelters"]
    if not all_res:
        return {"success": False, "message": "No active shelters found."}

    nearest = min(
        all_res,
        key=lambda s: calculate_distance(latitude, longitude, s["latitude"], s["longitude"])
    )

    return {
        "success": True,
        "shelter": nearest,
    }