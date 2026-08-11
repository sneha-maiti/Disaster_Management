from fastapi import APIRouter, status, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from services.maps_service import geocode_address, reverse_geocode_coordinates, calculate_evacuation_route

router = APIRouter(tags=["Geospatial & Evacuation Matrix"])

# ------------------- REQUEST / RESPONSE MODELS ------------------- #

class GeocodeRequest(BaseModel):
    address: str = Field(..., example="Park Street, Kolkata, West Bengal")

class ReverseGeocodeRequest(BaseModel):
    latitude: float = Field(..., example=22.5539)
    longitude: float = Field(..., example=88.3518)

class RouteCalculationRequest(BaseModel):
    origin: str = Field(..., example="22.5539,88.3518")
    destination: str = Field(..., example="Salt Lake Community Relief Center, Kolkata")
    travel_mode: Optional[str] = Field("driving", example="driving")


# ------------------- API ENDPOINTS ------------------- #

@router.post("/api/maps/geocode", status_code=status.HTTP_200_OK, summary="Geocode Address to Coordinates")
def geocode_location(payload: GeocodeRequest):
    """
    Converts a location name or address into exact geographic latitude and longitude coordinates.
    """
    if not payload.address or not payload.address.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Address field cannot be empty."
        )
    
    result = geocode_address(payload.address)
    return result


@router.post("/api/maps/reverse-geocode", status_code=status.HTTP_200_OK, summary="Reverse Geocode Coordinates to Address")
def reverse_geocode_location(payload: ReverseGeocodeRequest):
    """
    Converts GPS latitude and longitude coordinates into a human-readable street address.
    """
    result = reverse_geocode_coordinates(payload.latitude, payload.longitude)
    return result


@router.post("/api/evacuation/calculate-route", status_code=status.HTTP_200_OK, summary="Calculate Evacuation Route & Transit ETA")
def calculate_route(payload: RouteCalculationRequest):
    """
    Calculates evacuation directions, distance, transit ETA, and overview polyline between origin and destination.
    """
    if not payload.origin or not payload.destination:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both origin and destination are required."
        )
    
    result = calculate_evacuation_route(
        origin=payload.origin,
        destination=payload.destination,
        travel_mode=payload.travel_mode or "driving"
    )
    return result
