import math


def get_shelters():

    return [
        {
            "id": "SHELTER-01",
            "name": "Kolkata Central Relief Camp",
            "latitude": 22.5726,
            "longitude": 88.3639,
            "total_capacity": 500,
            "occupied": 120,
            "available_resources": [
                "Medical Kits",
                "Food Packets",
                "Power Generators"
            ],
            "status": "ACTIVE"
        },

        {
            "id": "SHELTER-02",
            "name": "Howrah Disaster Evacuation Center",
            "latitude": 22.5958,
            "longitude": 88.2636,
            "total_capacity": 350,
            "occupied": 210,
            "available_resources": [
                "Boats",
                "Clean Water",
                "First Aid"
            ],
            "status": "ACTIVE"
        }
    ]


def calculate_distance(
    lat1,
    lon1,
    lat2,
    lon2
):

    return math.sqrt(
        (lat2 - lat1) ** 2 +
        (lon2 - lon1) ** 2
    )


def get_nearest_shelter(
    latitude,
    longitude
):

    shelters = get_shelters()

    nearest = min(
        shelters,
        key=lambda shelter:
        calculate_distance(
            latitude,
            longitude,
            shelter["latitude"],
            shelter["longitude"]
        )
    )

    return nearest