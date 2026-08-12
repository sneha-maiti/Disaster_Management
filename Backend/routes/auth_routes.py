from fastapi import APIRouter
from pydantic import BaseModel
from models.user import get_user_by_email, create_user


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
    # Search for user in database by email/username
    user = get_user_by_email(request.username)

    if user and user["password"] == request.password:
        return {
            "success": True,
            "message": "Login successful",
            "role": str(user["role"]).upper()
        }

    # Admin default fallback authentication
    if request.username == "admin" and request.password == "admin123":
        if not user:
            create_user(name="Admin User", email="admin", password="admin123", role="admin")
        return {
            "success": True,
            "message": "Login successful",
            "role": "ADMIN"
        }

    return {
        "success": False,
        "message": "Invalid credentials"
    }