import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.db import get_db_connection

def create_disaster(type_,location,latitude,longitude,severity="medium",status="active"):
    conn=get_db_connection()
    cursor=conn.cursor()
    cursor.execute(
        """INSERT INTO disasters(type,location,latitude,longitude,severity,status)
        VALUES (?,?,?,?,?,?)""",
        (type_,location,latitude,longitude,severity,status))
    conn.commit()
    disaster_id=cursor.lastrowid
    conn.close()
    return disaster_id

def get_active_disasters():
    conn=get_db_connection()
    cursor=conn.cursor()
    cursor.execute("SELECT* FROM disasters WHERE status='active' ORDER BY created_at DESC")
    disasters=cursor.fetchall()
    conn.close()
    return disasters

def get_all_disasters():
    conn=get_db_connection()
    cursor=conn.cursor()
    cursor.execute("SELECT* FROM disasters ORDER BY created_at DESC")
    disasters=cursor.fetchall()
    conn.close()
    return disasters

def update_disaster_status(disaster_id,status):
    conn=get_db_connection()
    cursor=conn.cursor()
    cursor.execute(
        "UPDATE disasters SET status=? WHERE id=?",
        (status,disaster_id))
    conn.commit()
    conn.close()
    




    
