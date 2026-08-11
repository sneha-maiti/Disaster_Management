import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.db import get_db_connection

#SOS REQUESTS

def create_sos_request(user_id,latitude,longitude,description=None,image_url=None,severity="medium"):
    conn=get_db_connection()
    cursor=conn.cursor()
    cursor.execute(
        """
        INSERT INTO sos_requests(user_id,latitude,longitude,description,image_url,severity)
        VALUES (?,?,?,?,?,?)""",
        (user_id,latitude,longitude,description,image_url,severity))
    conn.commit()
    sos_id=cursor.lastrowid
    conn.close()
    return sos_id


def get_all_sos_requests():
    conn=get_db_connection()
    cursor=conn.cursor()
    cursor.execute("SELECT* FROM sos_requests ORDER BY created_at DESC")
    requests=cursor.fetchall()
    conn.close()
    return requests


def update_sos_status(sos_id,status):
    conn=get_db_connection()
    cursor=conn.cursor()
    cursor.execute(
        "UPDATE sos_requests SET status=? WHERE id =?",
        (status,sos_id))
    conn.commit()
    conn.close()

#RESCUE TEAMS & ASSIGNMENTS

def get_available_teams():
    conn=get_db_connection()
    cursor=conn.cursor
    cursor.execute("SELECT* FROM rescue_teams WHERE status='available'")
    teams=cursor.fetchall()
    conn.close()
    return teams


def assign_team_to_sos(sos_id,team_id):
    conn=get_db_connection()
    cursor=conn.cursor

    cursor.execute(
        "INSERT INTO assignments(sos_id,team_id) VALUES (?,?)",
        (sos_id,team_id))

    cursor.execute(
        "UPDATE sos_requests SET status='in_progress' WHERE id=?",
        (sos_id,))
        
    cursor.execute(
        "UPDATE rescue_teams SET status='busy' WHERE id=?",
        (team_id,))

    conn.commit()
    conn.close()





        
