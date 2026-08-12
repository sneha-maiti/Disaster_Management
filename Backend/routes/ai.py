from fastapi import APIRouter, status, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from typing import Optional
from services.ai_service import analyze_disaster_with_gemini

router = APIRouter(prefix="/api/ai", tags=["AI Intelligence"])

class AIAnalysisInput(BaseModel):
    description: str = Field(..., example="Severe flooding and people trapped inside a building")
    location: Optional[str] = Field("Kolkata", example="Kolkata")
    severity: Optional[int] = Field(4, ge=1, le=4, example=4)

class AIAnalysisResponse(BaseModel):
    analysis: str
    threat_level: str
    recommended_action: str
    confidence: str

class ImageUploadVerifyResponse(BaseModel):
    filename: str
    content_type: str
    message: str

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/jpg"}

@router.post("/analyze", response_model=AIAnalysisResponse, status_code=status.HTTP_200_OK)
def analyze_disaster_incident(payload: AIAnalysisInput):
    """
    Sends disaster details to Google Gemini LLM API (gemini-1.5-flash) and returns structured JSON analysis:
    - analysis
    - threat_level
    - recommended_action
    - confidence
    """
    if not payload.description or not payload.description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Description field cannot be empty."
        )
    
    result = analyze_disaster_with_gemini(
        description=payload.description,
        location=payload.location,
        severity=payload.severity or 3
    )
    
    return result

@router.post("/analyze-image", response_model=ImageUploadVerifyResponse, status_code=status.HTTP_200_OK)
async def analyze_disaster_image(image: UploadFile = File(...)):
    """
    Verifies receipt of an uploaded incident evidence image (JPEG, PNG, WebP, HEIC).
    Returns file metadata and confirmation message.
    """
    content_type = (image.content_type or "").lower()
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG, PNG, WebP, and HEIC images are allowed."
        )
    
    return {
        "filename": image.filename or "unknown",
        "content_type": image.content_type or "unknown",
        "message": "Image received successfully"
    }

