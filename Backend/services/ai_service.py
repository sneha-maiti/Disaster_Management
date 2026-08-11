import json
import urllib.request
import urllib.error
from typing import Dict, Optional
from fastapi import HTTPException, status
from utils.config import GEMINI_API_KEY

def analyze_threat(description: str, requested_level: int) -> Dict:
    """Heuristic Threat Classification used for SOS signals & disaster routes"""
    return analyze_threat_with_ai(description, requested_level)

def analyze_threat_with_ai(description: str, requested_level: int) -> Dict:
    """Heuristic Threat Classification used internally for SOS signals"""
    critical_keywords = ["trapped", "bleeding", "drowning", "explosion", "fire", "collapsed"]
    moderate_keywords = ["waterlogging", "power cut", "food", "shelter", "blocked"]
    
    score = requested_level * 20
    desc_lower = description.lower()
    
    for word in critical_keywords:
        if word in desc_lower:
            score += 25
            
    for word in moderate_keywords:
        if word in desc_lower:
            score += 10
            
    score = min(score, 100) # Cap at 100
    
    if score >= 80:
        return {"level": "LEVEL 4 - CRITICAL", "priority": "RED", "score": score}
    elif score >= 60:
        return {"level": "LEVEL 3 - HIGH", "priority": "ORANGE", "score": score}
    elif score >= 40:
        return {"level": "LEVEL 2 - MODERATE", "priority": "YELLOW", "score": score}
    else:
        return {"level": "LEVEL 1 - LOW", "priority": "GREEN", "score": score}


def analyze_disaster_with_gemini(description: str, location: Optional[str] = None, severity: int = 3) -> Dict:
    """
    Sends disaster details to Google Gemini LLM API (gemini-1.5-flash) and returns structured JSON analysis:
    - analysis
    - threat_level
    - recommended_action
    - confidence

    Raises explicit HTTP error codes for missing API key, authentication failure, network timeouts, or invalid model responses.
    """
    if not GEMINI_API_KEY or GEMINI_API_KEY.strip() in ["", "DEMO_GEMINI_KEY", "YOUR_GEMINI_API_KEY"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GEMINI_API_KEY is not configured in Backend/.env file."
        )

    loc_str = location if location else "Unspecified Location"
    model_identifier = "gemini-3.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_identifier}:generateContent?key={GEMINI_API_KEY}"
    
    prompt = (
        f"You are AETHER-X Disaster Response AI Engine. Analyze this incident report:\n"
        f"- Description: {description}\n"
        f"- Location: {loc_str}\n"
        f"- User Reported Severity Level: {severity}/4\n\n"
        f"Respond ONLY with a valid JSON object matching this exact schema (no markdown formatting, no text outside JSON):\n"
        f"{{\n"
        f'  "analysis": "Detailed tactical situation analysis",\n'
        f'  "threat_level": "LEVEL 4 - CRITICAL" or "LEVEL 3 - HIGH" or "LEVEL 2 - MODERATE" or "LEVEL 1 - LOW",\n'
        f'  "recommended_action": "Specific emergency tactical deployment steps",\n'
        f'  "confidence": "98.5%"\n'
        f"}}\n"
    )
    
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }
    
    try:
        req_data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=req_data, headers={"Content-Type": "application/json"})
        
        with urllib.request.urlopen(req, timeout=12) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            
            candidates = res_body.get("candidates", [])
            if not candidates:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Gemini API returned an empty response candidate."
                )
            
            parts = candidates[0].get("content", {}).get("parts", [])
            if not parts:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Gemini API returned response without text content."
                )
            
            raw_text = parts[0].get("text", "").strip()
            
            # Strip markdown codeblock backticks if present
            if raw_text.startswith("```"):
                lines = raw_text.splitlines()
                if lines and lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                raw_text = "\n".join(lines).strip()
            
            try:
                parsed = json.loads(raw_text)
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Gemini API returned response that failed JSON parsing."
                )
            
            # Validate required fields in parsed JSON
            for field in ["analysis", "threat_level", "recommended_action", "confidence"]:
                if field not in parsed or not str(parsed[field]).strip():
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"Gemini API JSON response missing required field: '{field}'."
                    )
            
            return {
                "analysis": str(parsed["analysis"]),
                "threat_level": str(parsed["threat_level"]),
                "recommended_action": str(parsed["recommended_action"]),
                "confidence": str(parsed["confidence"])
            }

    except urllib.error.HTTPError as http_err:
        error_code = http_err.code
        
        if error_code in [400, 401, 403]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Gemini API authentication failed (HTTP {error_code}). Check if GEMINI_API_KEY in Backend/.env is valid."
            )
        elif error_code == 429:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Gemini API rate limit or quota exceeded. Please try again shortly."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Gemini API server returned HTTP error {error_code}."
            )
            
    except urllib.error.URLError:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Network connection to Gemini API timed out or unreachable."
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error processing Gemini AI analysis: {str(e)}"
        )
