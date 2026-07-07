-- Jalankan script ini di Supabase Dashboard > SQL Editor > New query > Run
-- BLUUU V3 — Custom Frames Migration

CREATE TABLE IF NOT EXISTS custom_frames (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    emoji VARCHAR(10) DEFAULT '🖼️',
    image_data TEXT NOT NULL, -- base64 PNG data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
