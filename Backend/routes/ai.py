from fastapi import APIRouter, status, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from typing import Optional
from services.ai_service import analyze_disaster_with_gemini, analyze_disaster_image_with_gemini
from models.ai_analysis import save_ai_analysis

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
    Sends disaster details to Google Gemini LLM API (gemini-2.5-flash) and returns structured JSON analysis:
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

@router.post("/analyze-image", response_model=AIAnalysisResponse, status_code=status.HTTP_200_OK)
async def analyze_disaster_image(image: UploadFile = File(...)):
    """
    Sends uploaded disaster scene incident image (JPEG, PNG, WebP, HEIC) to Google Gemini API,
    saves the AI analysis to SQLite database, and returns structured tactical analysis JSON.
    """
    content_type = (image.content_type or "").lower()
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG, PNG, WebP, and HEIC images are allowed."
        )
    
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    result = analyze_disaster_image_with_gemini(
        image_bytes=image_bytes,
        mime_type=content_type
    )

    save_ai_analysis(
        filename=image.filename,
        mime_type=content_type,
        analysis=result["analysis"],
        threat_level=result["threat_level"],
        recommended_action=result["recommended_action"],
        confidence=result["confidence"]
    )

    return result

