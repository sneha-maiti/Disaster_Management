from datetime import datetime, timezone
import uuid


def generate_id(prefix: str) -> str:
    """
    Generate a unique ID.
    Example: SOS-A83F21C4
    """
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"


def get_current_timestamp() -> str:
    """
    Return the current UTC timestamp.
    """
    return datetime.now(timezone.utc).isoformat()


def clean_text(text: str) -> str:
    """
    Remove unnecessary spaces from text.
    """
    return " ".join(text.strip().split())