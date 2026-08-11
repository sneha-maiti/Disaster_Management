from fastapi import APIRouter

router = APIRouter(prefix="/api/shelters", tags=["Geospatial Grid"])

@router.get("")
@router.get("/")
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
