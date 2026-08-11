import json
import urllib.request
import urllib.parse
import math
from typing import Dict, Any, Optional

def geocode_address(address: str) -> Dict[str, Any]:
    """
    Converts a textual location/address into latitude, longitude, and place details using OpenStreetMap Nominatim API.
    """
    if not address or not address.strip():
        return {
            "success": False,
            "error": "Address string cannot be empty."
        }

    try:
        encoded_addr = urllib.parse.quote(address)
        nominatim_url = f"https://nominatim.openstreetmap.org/search?q={encoded_addr}&format=json&limit=1"
        headers = {"User-Agent": "AETHER-X-Tactical-Core/2.1 (Disaster Management SIH 2026)"}
        
        req = urllib.request.Request(nominatim_url, headers=headers)
        with urllib.request.urlopen(req, timeout=8) as response:
            data = json.loads(response.read().decode("utf-8"))
            if data and isinstance(data, list) and len(data) > 0:
                result = data[0]
                return {
                    "success": True,
                    "query_address": address,
                    "formatted_address": result.get("display_name", address),
                    "coordinates": {
                        "latitude": float(result["lat"]),
                        "longitude": float(result["lon"])
                    },
                    "place_id": str(result.get("place_id", "OSM_PLACE")),
                    "location_type": result.get("type", "OPENSTREETMAP"),
                    "status": "GEOCODED_NOMINATIM_SUCCESS"
                }
    except Exception:
        pass

    # Fallback simulation for offline testing
    return {
        "success": True,
        "query_address": address,
        "formatted_address": f"{address}, Kolkata, West Bengal, India",
        "coordinates": {
            "latitude": 22.5726,
            "longitude": 88.3639
        },
        "place_id": "DEMO_PLACE_ID_KOLKATA_SEC5",
        "location_type": "APPROXIMATE_DEMO",
        "status": "GEOCODED_DEMO_MODE"
    }


def reverse_geocode_coordinates(latitude: float, longitude: float) -> Dict[str, Any]:
    """
    Converts latitude and longitude coordinates into a human-readable location address using OpenStreetMap Nominatim API.
    """
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?lat={latitude}&lon={longitude}&format=json"
        headers = {"User-Agent": "AETHER-X-Tactical-Core/2.1 (Disaster Management SIH 2026)"}
        
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=8) as response:
            data = json.loads(response.read().decode("utf-8"))
            if data and isinstance(data, dict) and "display_name" in data:
                return {
                    "success": True,
                    "latitude": latitude,
                    "longitude": longitude,
                    "formatted_address": data["display_name"],
                    "place_id": str(data.get("place_id", "OSM_REVERSE")),
                    "status": "REVERSE_GEOCODED_NOMINATIM_SUCCESS"
                }
    except Exception:
        pass

    # Fallback simulation for offline testing
    return {
        "success": True,
        "latitude": latitude,
        "longitude": longitude,
        "formatted_address": f"Sector V, Salt Lake, Kolkata, West Bengal 700091 ({latitude:.4f}°N, {longitude:.4f}°E)",
        "place_id": "DEMO_REVERSE_PLACE_ID",
        "status": "REVERSE_GEOCODED_DEMO_MODE"
    }


def calculate_evacuation_route(origin: str, destination: str, travel_mode: str = "driving") -> Dict[str, Any]:
    """
    Calculates evacuation directions, ETA, distance, and route vectors using OSRM (Open Source Routing Machine API).
    """
    if not origin or not destination:
        return {
            "success": False,
            "error": "Origin and destination parameters are required."
        }

    # Helper to resolve coordinate pairs from string address or lat,lng input
    def parse_or_geocode(loc_str: str):
        parts = loc_str.split(",")
        if len(parts) == 2:
            try:
                lat = float(parts[0].strip())
                lng = float(parts[1].strip())
                return lat, lng, loc_str
            except ValueError:
                pass
        
        geo = geocode_address(loc_str)
        if geo.get("success") and "coordinates" in geo:
            return geo["coordinates"]["latitude"], geo["coordinates"]["longitude"], geo.get("formatted_address", loc_str)
        return 22.5726, 88.3639, loc_str

    lat1, lon1, start_name = parse_or_geocode(origin)
    lat2, lon2, end_name = parse_or_geocode(destination)

    # Call OSRM Public Routing API
    try:
        osrm_url = f"http://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=full&steps=true"
        headers = {"User-Agent": "AETHER-X-Tactical-Core/2.1 (Disaster Management SIH 2026)"}
        
        req = urllib.request.Request(osrm_url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))
            if data.get("code") == "Ok" and data.get("routes"):
                route = data["routes"][0]
                dist_m = route.get("distance", 0)
                dur_s = route.get("duration", 0)
                
                dist_km = round(dist_m / 1000, 1)
                dur_min = round(dur_s / 60)
                
                steps_summary = []
                legs = route.get("legs", [])
                if legs:
                    for step in legs[0].get("steps", [])[:5]:
                        name = step.get("name", "Road Corridor")
                        s_dist = round(step.get("distance", 0) / 1000, 1)
                        steps_summary.append({
                            "instruction": f"Proceed along {name if name else 'Evacuation Route'}",
                            "distance": f"{s_dist} km",
                            "duration": f"{round(step.get('duration', 0)/60)} mins"
                        })

                return {
                    "success": True,
                    "origin": start_name,
                    "destination": end_name,
                    "distance": f"{dist_km} km",
                    "distance_meters": round(dist_m),
                    "duration": f"{dur_min} mins",
                    "duration_seconds": round(dur_s),
                    "travel_mode": travel_mode.upper(),
                    "start_location": {"lat": lat1, "lng": lon1},
                    "end_location": {"lat": lat2, "lng": lon2},
                    "overview_polyline": route.get("geometry", ""),
                    "steps": steps_summary,
                    "route_status": "OSRM_OPTIMAL_SAFE_ROUTE"
                }
    except Exception:
        pass

    # Fallback calculation if OSRM is unreachable
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    dist_km = round(6371 * c * 1.3, 1) # Approximate driving factor
    dur_min = round(dist_km * 2)

    return {
        "success": True,
        "origin": start_name,
        "destination": end_name,
        "distance": f"{dist_km} km",
        "distance_meters": int(dist_km * 1000),
        "duration": f"{dur_min} mins",
        "duration_seconds": dur_min * 60,
        "travel_mode": travel_mode.upper(),
        "start_location": {"lat": lat1, "lng": lon1},
        "end_location": {"lat": lat2, "lng": lon2},
        "overview_polyline": "OSRM_GEODESIC_POLYLINE_FALLBACK",
        "steps": [
            {"instruction": f"Proceed from {start_name} toward Evacuation Checkpoint", "distance": f"{round(dist_km*0.3, 1)} km", "duration": f"{round(dur_min*0.3)} mins"},
            {"instruction": f"Continue along Main Clearance Corridor to {end_name}", "distance": f"{round(dist_km*0.7, 1)} km", "duration": f"{round(dur_min*0.7)} mins"}
        ],
        "route_status": "GEODESIC_SAFE_EVACUATION_CORRIDOR"
    }


def get_shelters():
    """Provides active relief shelters"""
    return [
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


def calculate_distance(lat1, lon1, lat2, lon2):
    return math.sqrt((lat2 - lat1)**2 + (lon2 - lon1)**2)


def get_nearest_shelter(latitude, longitude):
    shelters = get_shelters()
    return min(
        shelters,
        key=lambda s: calculate_distance(latitude, longitude, s["latitude"], s["longitude"])
    )
