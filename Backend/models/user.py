import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.db import get_db_connection

def create_user(name,email,password,role="citizen"):
    conn=get_db_connection()
    cursor=conn.cursor()
    cursor.execute(
        "INSERT INTO users(name,email,password,role) VALUES (?,?,?,?)",
        (name,email,password,role),)
    conn.commit()
    user_id=cursor.lastrowid
    conn.close()
    return user_id

def get_user_by_email(email):
    conn=get_db_connection()
    cursor=conn.cursor()
    cursor.execute("SELECT* FROM users WHERE email=?",(email,))
    user=cursor.fetchone()
    conn.close()
    return user

def get_user_by_id(user_id):
    conn=get_db_connection()
    cursor=conn.cursor()
    cursor.execute("SELECT* FROM users WHERE id=?",(user_id,))
    user=cursor.fetchone()
    conn.close()
    return user

def get_all_users():
    conn=get_db_connection()
    cursor=conn.cursor()
    cursor.execute("SELECT* FROM users")
    user=cursor.fetchall()
    conn.close()
    return user



    
