import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.db import get_db_connection

def save_ai_analysis(filename, mime_type, analysis, threat_level, recommended_action, confidence):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO ai_analyses (filename, mime_type, analysis, threat_level, recommended_action, confidence)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (filename, mime_type, analysis, threat_level, recommended_action, confidence)
    )
    conn.commit()
    analysis_id = cursor.lastrowid
    conn.close()
    return analysis_id

def get_ai_analysis_by_id(analysis_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ai_analyses WHERE id = ?", (analysis_id,))
    record = cursor.fetchone()
    conn.close()
    return dict(record) if record else None
