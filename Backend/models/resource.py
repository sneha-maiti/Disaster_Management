import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.db import get_db_connection

def create_resource(type_,quantity,location,assigned_to=None,status="available"):
    conn=get_db_connection()
    cursor=conn.cursor()
    cursor.execute(
        """INSERT INTO resources(type,quantity,location,assigned_to,status)
        VALUES (?,?,?,?,?)""",
        (type_,quantity,location,assigned_to,status))
    conn.commit()
    resource_id=cursor.lastrowid
    conn.close()
    return resource_id

def get_all_resources():
    conn=get_db_connection()
    cursor=conn.cursor()
    cursor.execute("SELECT* FROM resources")
    resources=cursor.fetchall()
    conn.close()
    return resources

def get_resources_by_shelter(shelter_id):
    conn=get_db_connection()
    cursor=conn.cursor()
    cursor.execute("SELECT* FROM resources WHERE assigned_to=?",(shelter_id,))
    resources=cursor.fetchall()
    conn.close()
    return resources

def update_resource_quantity(resource_id,new_quantity):
    conn=get_db_connection()
    cursor=conn.cursor()
    status="depleted" if new_quantity <=0 else "available"
    cursor.execute(
        "UPDATE resources SET quantity=?,status=? WHERE id=?",
        (new_quantity,status,resource_id))
    conn.commit()
    conn.close()






