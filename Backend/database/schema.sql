CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN("citizen","admin","rescuer"))DEFAULT "citizen",
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS sos_requests(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    description TEXT,
    image_url TEXT,
    status TEXT CHECK(status IN("pending","in_progress","resolved")) DEFAULT "pending",
    severity TEXT CHECK(severity IN("low","medium","high")),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);

CREATE TABLE IF NOT EXISTS disasters(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    severity TEXT CHECK(severity IN("low","medium","high")),
    status TEXT CHECK(status IN("active","controlled","resolved")),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS shelters(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    capacity INTEGER NOT NULL,
    available_space INTEGER NOT NULL,
    resources TEXT);

CREATE TABLE IF NOT EXISTS resources(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    location TEXT NOT NULL,
    assigned_to INTEGER,
    status TEXT CHECK(status IN("available","in_use","depleted")) DEFAULT "available",
    FOREIGN KEY(assigned_to) REFERENCES shelters(id) on DELETE SET NULL);

CREATE TABLE IF NOT EXISTS rescue_teams(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    members_count INTEGER NOT NULL,
    current_location TEXT NOT NULL,
    status TEXT CHECK(status IN("available","busy")) DEFAULT "available");

CREATE TABLE IF NOT EXISTS assignments(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sos_id INTEGER,
    team_id INTEGER,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sos_id) REFERENCES sos_requests(id) ON DELETE CASCADE,
    FOREIGN KEY(team_id) REFERENCES rescue_teams(id) ON DELETE CASCADE);
    
    
    










        
