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
    conn.close()

    print(f"Database successfully initialized at:{DB_PATH}")

if __name__=="__main__":
    init_db()
