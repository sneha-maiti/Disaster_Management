from fastapi import APIRouter
from pydantic import BaseModel

from services.ai_service import analyze_threat
from utils.helpers import clean_text


router = APIRouter(
    prefix="/api/disasters",
    tags=["Disaster Intelligence"]
)


class DisasterAnalysisRequest(BaseModel):

    description: str

    severity: int = 3


@router.post("/analyze")
def analyze_disaster(
    request: DisasterAnalysisRequest
):

    description = clean_text(
        request.description
    )

    analysis = analyze_threat(
        description,
        request.severity
    )

    return {

        "success": True,

        "input": {
            "description": description,
            "severity": request.severity
        },

        "analysis": analysis
    }