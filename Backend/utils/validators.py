from fastapi import HTTPException, status

def validate_coordinates(
    latitude: float,
    longitude: float
) -> None:

    if not -90 <= latitude <= 90:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Latitude must be between -90 and 90."
        )

    if not -180 <= longitude <= 180:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Longitude must be between -180 and 180."
        )


def validate_severity(
    severity: int
) -> None:

    if severity < 1 or severity > 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Severity must be between 1 and 4."
        )