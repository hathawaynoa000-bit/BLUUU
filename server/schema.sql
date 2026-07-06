-- Table for Admin Users
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Private Couple Rooms
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    room_code VARCHAR(100) UNIQUE NOT NULL,
    passcode VARCHAR(100) NOT NULL,
    creator_peer_id VARCHAR(100),
    joiner_peer_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active' -- active, expired, blocked
);

-- Table for Photo Strips uploaded by couples
CREATE TABLE IF NOT EXISTS photo_strips (
    id SERIAL PRIMARY KEY,
    room_code VARCHAR(100) REFERENCES rooms(room_code) ON DELETE CASCADE,
    photo_data TEXT NOT NULL, -- base64 image data
    couple_names VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
