from typing import Dict


CRITICAL_KEYWORDS = [
    "trapped",
    "bleeding",
    "drowning",
    "explosion",
    "fire",
    "collapsed"
]


MODERATE_KEYWORDS = [
    "waterlogging",
    "power cut",
    "food",
    "shelter",
    "blocked"
]


def analyze_threat(
    description: str,
    requested_level: int
) -> Dict:

    description = description.lower()

    score = requested_level * 20

    for keyword in CRITICAL_KEYWORDS:

        if keyword in description:
            score += 25

    for keyword in MODERATE_KEYWORDS:

        if keyword in description:
            score += 10

    score = min(score, 100)

    if score >= 80:

        return {
            "level": "LEVEL 4 - CRITICAL",
            "priority": "RED",
            "score": score
        }

    elif score >= 60:

        return {
            "level": "LEVEL 3 - HIGH",
            "priority": "ORANGE",
            "score": score
        }

    elif score >= 40:

        return {
            "level": "LEVEL 2 - MODERATE",
            "priority": "YELLOW",
            "score": score
        }

    else:

        return {
            "level": "LEVEL 1 - LOW",
            "priority": "GREEN",
            "score": score
        }