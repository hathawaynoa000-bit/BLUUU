-- Jalankan script ini di Supabase Dashboard > SQL Editor > New query > Run
-- BLUUU V3 — Game Content Migration

-- 1. Buat tabel game_content
CREATE TABLE IF NOT EXISTS game_content (
    id SERIAL PRIMARY KEY,
    game_type VARCHAR(20) NOT NULL,
    text_content TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_game_content_type ON game_content(game_type);
CREATE INDEX IF NOT EXISTS idx_game_content_active ON game_content(is_active);

-- 2. Seed pertanyaan default
INSERT INTO game_content (game_type, text_content, sort_order) VALUES
-- Deep Talk (10)
('deep', 'Kapan pertama kali kamu sadar jatuh cinta padaku?', 1),
('deep', 'Apa momen terfavorit kita yang selalu kamu ingat?', 2),
('deep', 'Mimpi terbesarmu yang ingin kita capai bersama?', 3),
('deep', 'Hal apa dariku yang paling kamu suka?', 4),
('deep', 'Kalau bisa kembali ke satu hari denganku, hari apa?', 5),
('deep', 'Apa ketakutan terbesar yang belum kamu ceritakan?', 6),
('deep', 'Hal kecil apa yang selalu membuatmu teringat padaku?', 7),
('deep', 'Kalau kita punya satu hari tanpa HP, mau ngapain?', 8),
('deep', 'Apa yang paling ingin kamu pelajari dari kepribadianku?', 9),
('deep', 'Ceritakan satu hal yang belum pernah kamu ceritakan ke siapapun.', 10),
-- Truth (7)
('truth', 'Apa kebohongan kecil pertama yang pernah kamu katakan padaku?', 1),
('truth', 'Siapa yang lebih sering memulai pertengkaran?', 2),
('truth', 'Apa yang paling tidak kamu suka tapi tidak pernah bilang?', 3),
('truth', 'Apa yang kamu pikirkan saat pertama kali melihatku?', 4),
('truth', 'Pernahkah kamu berpura-pura setuju padahal tidak?', 5),
('truth', 'Hal apa yang diam-diam kamu kagumi dari orang lain?', 6),
('truth', 'Kapan terakhir kali kamu menangis dan kenapa?', 7),
-- Dare (6)
('dare', 'Nyanyikan bait lagu cinta favorit dengan suara penuh!', 1),
('dare', 'Ceritakan kenangan paling memalukan kita.', 2),
('dare', 'Tulis pesan romantis 3 baris dan bacakan keras-keras.', 3),
('dare', 'Tiru gaya foto pre-wedding, tahan 10 detik.', 4),
('dare', 'Kirimkan meme lucu ke kontak paling jarang dibalas.', 5),
('dare', 'Buat konten TikTok 15 detik langsung sekarang.', 6),
-- Siapa Paling (8)
('likely', 'Siapa yang lebih mungkin terlambat untuk kencan?', 1),
('likely', 'Siapa yang lebih mungkin menghabiskan uang lebih?', 2),
('likely', 'Siapa yang lebih mungkin menangis di film romantis?', 3),
('likely', 'Siapa yang lebih mungkin masak makan malam spesial?', 4),
('likely', 'Siapa yang lebih mungkin lupa ulang tahun pasangan?', 5),
('likely', 'Siapa yang lebih mungkin panik saat ada serangga?', 6),
('likely', 'Siapa yang lebih mungkin sukses dulu?', 7),
('likely', 'Siapa yang lebih mungkin tidur di sofa setelah ribut?', 8);
