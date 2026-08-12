import os
import sqlite3 as sql

DB_DIR=os.path.dirname(os.path.abspath(__file__))
DB_PATH=os.path.join(DB_DIR,"disaster_management.db")
SCHEMA_PATH=os.path.join(DB_DIR,"schema.sql")

def get_db_connection():
    conn=sql.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys=ON;")
    conn.row_factory=sql.Row
    return conn

def init_db():
    conn=get_db_connection()
    with open(SCHEMA_PATH,"r") as f:
        schema_sql=f.read()

    conn.executescript(schema_sql)
    conn.commit()

    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM shelters")
    if cursor.fetchone()[0] == 0:
        cursor.executemany(
            "INSERT INTO shelters(name, location, latitude, longitude, capacity, available_space, resources) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
                ("Kolkata Central Relief Camp", "Kolkata Sector V", 22.5726, 88.3639, 500, 380, "Medical Kits, Food Packets, Power Generators"),
                ("Howrah Disaster Evacuation Center", "Howrah", 22.5958, 88.2636, 350, 140, "Boats, Clean Water, First Aid")
            ]
        )
        conn.commit()

    cursor.execute("SELECT COUNT(*) FROM rescue_teams")
    if cursor.fetchone()[0] == 0:
        cursor.executemany(
            "INSERT INTO rescue_teams(name, members_count, current_location, status) VALUES (?, ?, ?, ?)",
            [
                ("Alpha Tactical Unit", 12, "Sector V HQ", "available"),
                ("Bravo Aquatic Rescue", 8, "Howrah Outpost", "available")
            ]
        )
        conn.commit()

    conn.close()

    print(f"Database successfully initialized at:{DB_PATH}")

if __name__=="__main__":
    init_db()
