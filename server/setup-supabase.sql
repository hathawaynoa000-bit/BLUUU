-- Jalankan script ini di Supabase Dashboard > SQL Editor > New query > Run
-- Project: axzxqcqtasykrbtgekbd

-- 1. Buat tabel
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    room_code VARCHAR(100) UNIQUE NOT NULL,
    passcode VARCHAR(100) NOT NULL,
    creator_peer_id VARCHAR(100),
    joiner_peer_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS photo_strips (
    id SERIAL PRIMARY KEY,
    room_code VARCHAR(100) REFERENCES rooms(room_code) ON DELETE CASCADE,
    photo_data TEXT NOT NULL,
    couple_names VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Buat akun admin default (username: admin, password: LimabelasNoldua)
INSERT INTO admins (username, password_hash)
VALUES ('admin', '$2b$10$1edPYo9pMx8pdsIgxlh5l.AQaLZEc.iXftGrdQfu4IqGtvYj12wgy')
ON CONFLICT (username) DO NOTHING;
