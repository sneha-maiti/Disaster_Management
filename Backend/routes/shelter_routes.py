from fastapi import APIRouter, Query

from services.map_service import (
    get_shelters,
    get_nearest_shelter,
)


router = APIRouter(
    prefix="/api/shelters",
    tags=["Geospatial Grid"]
)


@router.get("/")
def shelters():

    return {
        "success": True,
        "shelters": get_shelters(),
    }


@router.get("/nearest")
def nearest_shelter(
    latitude: float = Query(...),
    longitude: float = Query(...)
):

    shelter = get_nearest_shelter(
        latitude,
        longitude
    )

    return {
        "success": True,
        "shelter": shelter,
    }