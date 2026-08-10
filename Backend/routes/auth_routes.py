from fastapi import APIRouter
from pydantic import BaseModel


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


class LoginRequest(BaseModel):

    username: str

    password: str


@router.post("/login")
def login(
    request: LoginRequest
):

    # Prototype authentication.
    # Replace this with database authentication later.

    if (
        request.username == "admin"
        and request.password == "admin123"
    ):

        return {
            "success": True,
            "message": "Login successful",
            "role": "ADMIN"
        }

    return {
        "success": False,
        "message": "Invalid credentials"
    }