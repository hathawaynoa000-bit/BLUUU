import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'pink_glass_booth_jwt_secret';

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token tidak ditemukan. Akses ditolak.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token tidak valid atau kedaluwarsa.' });
    req.admin = user;
    next();
  });
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

    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '2h' });
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

    res.status(201).json({
      message: 'Kamar privat berhasil dibuat.',
      roomCode: formattedCode,
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

    res.json({ message: 'Berhasil bergabung dengan kamar.', roomCode: formattedCode });
  } catch (err) {
    console.error('Join Room Error:', err);
    res.status(500).json({ message: 'Gagal memproses penggabungan kamar.' });
  }
});

app.post('/api/rooms/update-peer', async (req, res) => {
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

app.get('/api/rooms/peers/:roomCode', async (req, res) => {
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

app.post('/api/photos/upload', async (req, res) => {
  const { roomCode, photoData, coupleNames } = req.body;

  if (!roomCode || !photoData || !coupleNames) {
    return res.status(400).json({ message: 'Data foto tidak lengkap.' });
  }

  try {
    await pool.query(
      'INSERT INTO photo_strips (room_code, photo_data, couple_names) VALUES ($1, $2, $3)',
      [roomCode.toUpperCase(), photoData, coupleNames]
    );
    res.status(201).json({ message: 'Foto strip berhasil disimpan ke galeri kamar!' });
  } catch (err) {
    console.error('Photo Upload Error:', err);
    res.status(500).json({ message: 'Gagal mengunggah foto.' });
  }
});

app.get('/api/photos/room/:roomCode', async (req, res) => {
  const { roomCode } = req.params;

  try {
    const result = await pool.query(
      'SELECT id, couple_names, created_at, photo_data FROM photo_strips WHERE room_code = $1 ORDER BY created_at DESC',
      [roomCode.toUpperCase()]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch Room Photos Error:', err);
    res.status(500).json({ message: 'Gagal mengambil galeri foto.' });
  }
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

app.get('/api/admin/photos', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM photo_strips ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Admin Fetch Photos Error:', err);
    res.status(500).json({ message: 'Gagal memuat galeri global.' });
  }
});

app.delete('/api/admin/photos/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM photo_strips WHERE id = $1', [id]);
    res.json({ message: 'Foto strip berhasil dihapus dari sistem.' });
  } catch (err) {
    console.error('Admin Delete Photo Error:', err);
    res.status(500).json({ message: 'Gagal menghapus foto.' });
  }
});

export default app;
