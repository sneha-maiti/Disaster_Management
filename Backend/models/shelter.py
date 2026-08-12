import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.db import get_db_connection

def create_shelter(name,location,latitude,longitude,capacity,available_space,resources):
    conn=get_db_connection()
    cursor=conn.cursor()
    cursor.execute(
        """INSERT INTO shelters(name,location,latitude,longitude,capacity,available_space,resources)
         VALUES (?,?,?,?,?,?,?)""",
        (name,location,latitude,longitude,capacity,available_space,resources))
    conn.commit()
    shelter_id=cursor.lastrowid
    conn.close()
    return shelter_id

def get_all_shelters():
    conn=get_db_connection()
    cursor=conn.cursor()
    cursor.execute("SELECT* FROM shelters")
    shelters=cursor.fetchall()
    conn.close()
    return shelters

def get_shelter_by_id(shelter_id):
    conn=get_db_connection()
    cursor=conn.cursor()
    cursor.execute("SELECT* FROM shelters WHERE id=?",(shelter_id,))
    shelter=cursor.fetchone()
    conn.close()
    return shelter

def update_shelter_space(shelter_id,new_available_space):
    conn=get_db_connection()
    cursor=conn.cursor()
    cursor.execute(
        "UPDATE shelters SET available_space=? WHERE id=?",
        (new_available_space,shelter_id))
    conn.commit()
    conn.close()



    
