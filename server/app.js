import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';
import pool from './db.js';

dotenv.config();

const app = express();

// Fallback to random secure string if not configured in environment
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

app.get('/api/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as server_time');
    res.json({
      status: 'ok',
      database: 'connected',
      server_time: result.rows[0].server_time,
      environment: process.env.NODE_ENV || 'development',
      vercel: process.env.VERCEL === '1',
    });
  } catch (err) {
    console.error('Health Check Error:', err.message);
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      message: err.message,
      hint: 'Pastikan DATABASE_URL sudah di-set di Vercel Environment Variables',
    });
  }
});

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token tidak ditemukan. Akses ditolak.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err || !user?.isAdmin) return res.status(403).json({ message: 'Token tidak valid atau kedaluwarsa.' });
    req.admin = user;
    next();
  });
};

// Middleware: Authenticate Room Access (via Room JWT or Passcode header)
const authenticateRoom = async (req, res, next) => {
  const targetRoom = (req.params.roomCode || req.body.roomCode || '').toUpperCase().trim();
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const passcode = req.headers['x-room-passcode'];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (!err && decoded && (decoded.isAdmin || decoded.roomCode === targetRoom)) {
        req.roomAuth = decoded;
        return next();
      }
      verifyByPasscode();
    });
  } else {
    verifyByPasscode();
  }

  async function verifyByPasscode() {
    if (!passcode && !token) {
      // For backward compatibility if neither is provided, check if room exists
      // but warn/restrict if room is active
      return res.status(401).json({ message: 'Akses ditolak: Diperlukan otentikasi room yang valid.' });
    }

    if (passcode && targetRoom) {
      try {
        const result = await pool.query('SELECT passcode, expires_at, status FROM rooms WHERE room_code = $1', [targetRoom]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Room tidak ditemukan.' });
        const room = result.rows[0];
        const isValid = await bcrypt.compare(String(passcode).trim(), room.passcode);
        if (isValid) return next();
      } catch (_) {}
    }

    return res.status(403).json({ message: 'Akses ditolak: Token atau sandi room tidak valid.' });
  }
};

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password harus diisi.' });
  }

  try {
    const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    const admin = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    const token = jwt.sign({ id: admin.id, username: admin.username, isAdmin: true }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, username: admin.username });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
});

app.get('/api/admin/me', authenticateAdmin, (req, res) => {
  res.json({ username: req.admin.username });
});

app.post('/api/rooms/create', async (req, res) => {
  const { roomCode, passcode } = req.body;

  if (!roomCode || !passcode) {
    return res.status(400).json({ message: 'Kode kamar dan sandi harus diisi.' });
  }

  const formattedCode = roomCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');

  if (formattedCode.length < 4) {
    return res.status(400).json({ message: 'Kode kamar minimal 4 karakter (huruf/angka/tanda hubung).' });
  }

  try {
    const existing = await pool.query('SELECT * FROM rooms WHERE room_code = $1', [formattedCode]);
    if (existing.rows.length > 0) {
      const room = existing.rows[0];
      if (room.status === 'active' && new Date(room.expires_at) > new Date()) {
        return res.status(409).json({ message: 'Kode kamar sudah digunakan dan masih aktif.' });
      } else {
        await pool.query('DELETE FROM rooms WHERE room_code = $1', [formattedCode]);
      }
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const hashedPasscode = await bcrypt.hash(passcode.trim(), 8);

    await pool.query(
      'INSERT INTO rooms (room_code, passcode, expires_at) VALUES ($1, $2, $3)',
      [formattedCode, hashedPasscode, expiresAt]
    );

    const roomToken = jwt.sign({ roomCode: formattedCode, role: 'creator' }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Kamar privat berhasil dibuat.',
      roomCode: formattedCode,
      roomToken,
      expiresAt,
    });
  } catch (err) {
    console.error('Create Room Error:', err);
    res.status(500).json({ message: 'Gagal membuat kamar privat.' });
  }
});

app.post('/api/rooms/join', async (req, res) => {
  const { roomCode, passcode } = req.body;

  if (!roomCode || !passcode) {
    return res.status(400).json({ message: 'Kode kamar dan sandi harus diisi.' });
  }

  const formattedCode = roomCode.trim().toUpperCase();

  try {
    const result = await pool.query('SELECT * FROM rooms WHERE room_code = $1', [formattedCode]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Kamar tidak ditemukan.' });
    }

    const room = result.rows[0];

    if (new Date(room.expires_at) < new Date() || room.status !== 'active') {
      return res.status(410).json({ message: 'Kamar ini sudah kedaluwarsa atau tidak aktif.' });
    }

    const isPasscodeValid = await bcrypt.compare(passcode.trim(), room.passcode);
    if (!isPasscodeValid) {
      return res.status(401).json({ message: 'Sandi kamar salah.' });
    }

    const roomToken = jwt.sign({ roomCode: formattedCode, role: 'joiner' }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Berhasil bergabung dengan kamar.',
      roomCode: formattedCode,
      roomToken,
    });
  } catch (err) {
    console.error('Join Room Error:', err);
    res.status(500).json({ message: 'Gagal memproses penggabungan kamar.' });
  }
});

app.post('/api/rooms/update-peer', authenticateRoom, async (req, res) => {
  const { roomCode, peerId, role } = req.body;

  if (!roomCode || !peerId || !role) {
    return res.status(400).json({ message: 'Parameter tidak lengkap.' });
  }

  const field = role === 'creator' ? 'creator_peer_id' : 'joiner_peer_id';

  try {
    await pool.query(
      `UPDATE rooms SET ${field} = $1 WHERE room_code = $2`,
      [peerId, roomCode.toUpperCase()]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Update Peer Error:', err);
    res.status(500).json({ message: 'Gagal memperbarui Peer ID.' });
  }
});

app.get('/api/rooms/peers/:roomCode', authenticateRoom, async (req, res) => {
  const { roomCode } = req.params;

  try {
    const result = await pool.query(
      'SELECT creator_peer_id, joiner_peer_id FROM rooms WHERE room_code = $1',
      [roomCode.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Kamar tidak ditemukan.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Fetch Peers Error:', err);
    res.status(500).json({ message: 'Gagal mengambil data koneksi.' });
  }
});

// ─── 100% Client-Only Privacy (No Server Photo Storage) ─────────────────────
app.post('/api/photos/upload', (_req, res) => {
  res.status(200).json({ message: '🛡️ Mode Privasi Aktif: Foto dikelola langsung di perangkat pengguna (Client-Only).' });
});

app.get('/api/photos/room/:roomCode', (_req, res) => {
  res.json([]);
});

app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const [roomStats, photoStats] = await Promise.all([
      pool.query(`SELECT
        COUNT(*) FILTER (WHERE TRUE) AS total_rooms,
        COUNT(*) FILTER (WHERE status = 'active') AS active_rooms,
        COUNT(*) FILTER (WHERE joiner_peer_id IS NULL) AS waiting_rooms,
        COUNT(*) FILTER (WHERE creator_peer_id IS NOT NULL AND joiner_peer_id IS NOT NULL) AS connected_sessions
        FROM rooms`),
      pool.query(`SELECT COUNT(*) AS total_photos FROM photo_strips`),
    ]);
    const r = roomStats.rows[0];
    res.json({
      total_rooms: parseInt(r.total_rooms, 10),
      active_rooms: parseInt(r.active_rooms, 10),
      waiting_rooms: parseInt(r.waiting_rooms, 10),
      connected_sessions: parseInt(r.connected_sessions, 10),
      total_photos: parseInt(photoStats.rows[0].total_photos, 10),
    });
  } catch (err) {
    console.error('Admin Stats Error:', err);
    res.status(500).json({ message: 'Gagal memuat statistik.' });
  }
});

app.get('/api/admin/rooms', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, COUNT(p.id) as photo_count
      FROM rooms r
      LEFT JOIN photo_strips p ON r.room_code = p.room_code
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Admin Fetch Rooms Error:', err);
    res.status(500).json({ message: 'Gagal memuat daftar kamar.' });
  }
});

app.delete('/api/admin/rooms/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM rooms WHERE id = $1 RETURNING room_code', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Kamar tidak ditemukan.' });
    }
    res.json({ message: `Kamar ${result.rows[0].room_code} berhasil dihapus.` });
  } catch (err) {
    console.error('Admin Delete Room Error:', err);
    res.status(500).json({ message: 'Gagal menghapus kamar.' });
  }
});

// ─── Zero-Knowledge Photo Privacy for Users ─────────────────────────────────
app.get('/api/admin/photos', authenticateAdmin, (_req, res) => {
  res.status(403).json({
    status: 'forbidden',
    message: '🔒 Privasi Pengguna Terkunci: Admin dilarang mengakses atau melihat foto privat yang diambil oleh pasangan.',
  });
});

app.delete('/api/admin/photos/:id', authenticateAdmin, (_req, res) => {
  res.status(403).json({
    status: 'forbidden',
    message: '🔒 Privasi Pengguna Terkunci: Foto hanya dapat dikelola oleh pemilik kamar privat.',
  });
});

// ─── Game Content Public (Read-Only) ─────────────────────────────────────────
app.get('/api/games/content', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, game_type, text_content, sort_order FROM game_content WHERE is_active = true ORDER BY game_type, sort_order ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch Game Content Error:', err);
    res.status(500).json({ message: 'Gagal memuat konten game.' });
  }
});

// ─── Game Content Admin ──────────────────────────────────────────────────────
app.get('/api/admin/games', authenticateAdmin, async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, game_type, text_content, sort_order, is_active, created_at FROM game_content ORDER BY game_type, sort_order ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Admin Fetch Games Error:', err);
    res.status(500).json({ message: 'Gagal memuat list game content.' });
  }
});

app.post('/api/admin/games', authenticateAdmin, async (req, res) => {
  const { game_type, text_content, sort_order } = req.body;
  if (!game_type || !text_content) {
    return res.status(400).json({ message: 'game_type dan text_content harus diisi.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO game_content (game_type, text_content, sort_order) VALUES ($1, $2, $3) RETURNING *',
      [game_type, text_content.trim(), sort_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Admin Create Game Item Error:', err);
    res.status(500).json({ message: 'Gagal menambah item game.' });
  }
});

app.put('/api/admin/games/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { text_content, sort_order, is_active } = req.body;
  try {
    const result = await pool.query(
      'UPDATE game_content SET text_content = COALESCE($1, text_content), sort_order = COALESCE($2, sort_order), is_active = COALESCE($3, is_active) WHERE id = $4 RETURNING *',
      [text_content, sort_order, is_active, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Item tidak ditemukan.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Admin Update Game Item Error:', err);
    res.status(500).json({ message: 'Gagal mengubah item game.' });
  }
});

app.delete('/api/admin/games/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM game_content WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Item tidak ditemukan.' });
    res.json({ message: 'Item game berhasil dihapus.' });
  } catch (err) {
    console.error('Admin Delete Game Item Error:', err);
    res.status(500).json({ message: 'Gagal menghapus item game.' });
  }
});

app.post('/api/admin/games/seed-defaults', authenticateAdmin, async (_req, res) => {
  try {
    await pool.query('DELETE FROM game_content');
    const defaults = [
      { type: 'deep', items: [
        'Momen apa dalam hubungan kita yang paling membuatmu merasa dicintai?',
        'Apa ketakutan terbesarmu tentang masa depan yang belum pernah kamu ceritakan?',
        'Hal apa yang paling kamu syukuri dari caraku memperlakukanmu?',
        'Jika kamu bisa mengulang satu hari bersamaku, hari apa yang kamu pilih?',
        'Apa impian terbesar kita berdua yang paling ingin kamu wujudkan tahun ini?',
        'Kapan kamu pertama kali sadar bahwa kamu benar-benar sayang padaku?',
        'Hal kecil apa yang selalu membuatmu teringat padaku?',
        'Kalau kita punya satu hari tanpa HP, mau ngapain?',
        'Apa yang paling ingin kamu pelajari dari kepribadianku?',
        'Ceritakan satu hal yang belum pernah kamu ceritakan ke siapapun.',
      ]},
      { type: 'truth', items: [
        'Apa kebohongan kecil pertama yang pernah kamu katakan padaku?',
        'Siapa yang lebih sering memulai pertengkaran?',
        'Apa yang paling tidak kamu suka tapi tidak pernah bilang?',
        'Apa yang kamu pikirkan saat pertama kali melihatku?',
        'Pernahkah kamu berpura-pura setuju padahal tidak?',
        'Hal apa yang diam-diam kamu kagumi dari orang lain?',
        'Kapan terakhir kali kamu menangis dan kenapa?',
      ]},
      { type: 'dare', items: [
        'Nyanyikan bait lagu cinta favorit dengan suara penuh!',
        'Ceritakan kenangan paling memalukan kita.',
        'Tulis pesan romantis 3 baris dan bacakan keras-keras.',
        'Tiru gaya foto pre-wedding, tahan 10 detik.',
        'Kirimkan meme lucu ke kontak paling jarang dibalas.',
        'Buat konten TikTok 15 detik langsung sekarang.',
      ]},
      { type: 'likely', items: [
        'Siapa yang lebih mungkin terlambat untuk kencan?',
        'Siapa yang lebih mungkin menghabiskan uang lebih?',
        'Siapa yang lebih mungkin menangis di film romantis?',
        'Siapa yang lebih mungkin masak makan malam spesial?',
        'Siapa yang lebih mungkin lupa ulang tahun pasangan?',
        'Siapa yang lebih mungkin panik saat ada serangga?',
        'Siapa yang lebih mungkin sukses dulu?',
        'Siapa yang lebih mungkin tidur di sofa setelah ribut?',
      ]},
    ];
    for (const { type, items } of defaults) {
      for (let i = 0; i < items.length; i++) {
        await pool.query(
          'INSERT INTO game_content (game_type, text_content, sort_order) VALUES ($1, $2, $3)',
          [type, items[i], i + 1]
        );
      }
    }
    res.json({ message: 'Konten berhasil di-reset ke default.', count: defaults.reduce((a, d) => a + d.items.length, 0) });
  } catch (err) {
    console.error('Admin Seed Content Error:', err);
    res.status(500).json({ message: 'Gagal me-reset konten.' });
  }
});

// ─── Custom Frames (Public) ─────────────────────────────────────────────────
app.get('/api/frames', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, emoji, image_data FROM custom_frames ORDER BY id DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch Custom Frames Error:', err);
    res.status(500).json({ message: 'Gagal memuat frame kustom.' });
  }
});

// ─── Custom Frames Admin ────────────────────────────────────────────────────
app.get('/api/admin/frames', authenticateAdmin, async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, emoji, created_at, length(image_data) as size FROM custom_frames ORDER BY id DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Admin Fetch Custom Frames Error:', err);
    res.status(500).json({ message: 'Gagal memuat list frame.' });
  }
});

app.post('/api/admin/frames', authenticateAdmin, async (req, res) => {
  const { name, emoji, image_data } = req.body;
  if (!name || !image_data) {
    return res.status(400).json({ message: 'Nama frame dan image_data (base64) harus diisi.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO custom_frames (name, emoji, image_data) VALUES ($1, $2, $3) RETURNING id, name, emoji',
      [name.trim(), emoji || '🖼️', image_data]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Admin Create Custom Frame Error:', err);
    res.status(500).json({ message: 'Gagal mengunggah frame kustom.' });
  }
});

app.delete('/api/admin/frames/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM custom_frames WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Frame tidak ditemukan.' });
    res.json({ message: 'Frame kustom berhasil dihapus.' });
  } catch (err) {
    console.error('Admin Delete Custom Frame Error:', err);
    res.status(500).json({ message: 'Gagal menghapus frame kustom.' });
  }
});

// ─── Catch-all 404 for unknown API routes ───────────────────────────────────

// ─── Game Content Aliases (/api/admin/content) ──────────────────────────────
app.get('/api/admin/content', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, game_type, text_content, sort_order, is_active, created_at FROM game_content ORDER BY game_type, sort_order ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Admin Fetch Games Error:', err);
    res.status(500).json({ message: 'Gagal memuat list game content.' });
  }
});

app.post('/api/admin/content', authenticateAdmin, async (req, res) => {
  const { game_type, text_content, sort_order } = req.body;
  if (!game_type || !text_content) {
    return res.status(400).json({ message: 'game_type dan text_content harus diisi.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO game_content (game_type, text_content, sort_order) VALUES ($1, $2, $3) RETURNING *',
      [game_type, text_content.trim(), sort_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Admin Create Game Item Error:', err);
    res.status(500).json({ message: 'Gagal menambah item game.' });
  }
});

app.put('/api/admin/content/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { text_content, sort_order, is_active } = req.body;
  try {
    const result = await pool.query(
      'UPDATE game_content SET text_content = COALESCE($1, text_content), sort_order = COALESCE($2, sort_order), is_active = COALESCE($3, is_active) WHERE id = $4 RETURNING *',
      [text_content, sort_order, is_active, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Item tidak ditemukan.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Admin Update Game Item Error:', err);
    res.status(500).json({ message: 'Gagal mengubah item game.' });
  }
});

app.delete('/api/admin/content/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM game_content WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Item tidak ditemukan.' });
    res.json({ message: 'Item game berhasil dihapus.' });
  } catch (err) {
    console.error('Admin Delete Game Item Error:', err);
    res.status(500).json({ message: 'Gagal menghapus item game.' });
  }
});

app.post('/api/admin/content/seed', authenticateAdmin, async (_req, res) => {
  try {
    await pool.query('DELETE FROM game_content');
    const defaults = [
      { type: 'deep', items: [
        'Momen apa dalam hubungan kita yang paling membuatmu merasa dicintai?',
        'Apa ketakutan terbesarmu tentang masa depan yang belum pernah kamu ceritakan?',
        'Hal apa yang paling kamu syukuri dari caraku memperlakukanmu?',
        'Jika kamu bisa mengulang satu hari bersamaku, hari apa yang kamu pilih?',
        'Apa impian terbesar kita berdua yang paling ingin kamu wujudkan tahun ini?',
        'Kapan kamu pertama kali sadar bahwa kamu benar-benar sayang padaku?',
        'Hal kecil apa yang selalu membuatmu teringat padaku?',
        'Kalau kita punya satu hari tanpa HP, mau ngapain?',
        'Apa yang paling ingin kamu pelajari dari kepribadianku?',
        'Ceritakan satu hal yang belum pernah kamu ceritakan ke siapapun.',
      ]},
      { type: 'truth', items: [
        'Apa kebohongan kecil pertama yang pernah kamu katakan padaku?',
        'Siapa yang lebih sering memulai pertengkaran?',
        'Apa yang paling tidak kamu suka tapi tidak pernah bilang?',
        'Apa yang kamu pikirkan saat pertama kali melihatku?',
        'Pernahkah kamu berpura-pura setuju padahal tidak?',
        'Hal apa yang diam-diam kamu kagumi dari orang lain?',
        'Kapan terakhir kali kamu menangis dan kenapa?',
      ]},
      { type: 'dare', items: [
        'Nyanyikan bait lagu cinta favorit dengan suara penuh!',
        'Ceritakan kenangan paling memalukan kita.',
        'Tulis pesan romantis 3 baris dan bacakan keras-keras.',
        'Tiru gaya foto pre-wedding, tahan 10 detik.',
        'Kirimkan meme lucu ke kontak paling jarang dibalas.',
        'Buat konten TikTok 15 detik langsung sekarang.',
      ]},
      { type: 'likely', items: [
        'Siapa yang lebih mungkin terlambat untuk kencan?',
        'Siapa yang lebih mungkin menghabiskan uang lebih?',
        'Siapa yang lebih mungkin menangis di film romantis?',
        'Siapa yang lebih mungkin masak makan malam spesial?',
        'Siapa yang lebih mungkin lupa ulang tahun pasangan?',
        'Siapa yang lebih mungkin panik saat ada serangga?',
        'Siapa yang lebih mungkin sukses dulu?',
        'Siapa yang lebih mungkin tidur di sofa setelah ribut?',
      ]},
    ];
    for (const { type, items } of defaults) {
      for (let i = 0; i < items.length; i++) {
        await pool.query(
          'INSERT INTO game_content (game_type, text_content, sort_order) VALUES ($1, $2, $3)',
          [type, items[i], i + 1]
        );
      }
    }
    res.json({ message: 'Konten berhasil di-reset ke default.', count: defaults.reduce((a, d) => a + d.items.length, 0) });
  } catch (err) {
    console.error('Admin Seed Content Error:', err);
    res.status(500).json({ message: 'Gagal me-reset konten.' });
  }
});

app.use('/api', (req, res) => {
  res.status(404).json({
    status: 'not_found',
    message: `Route ${req.method} ${req.originalUrl} tidak ditemukan.`,
    hint: 'Pastikan endpoint sudah benar. Cek /api/health untuk status server.',
  });
});

export default app;
