import React, { useState, useEffect } from 'react';
import { API } from '../lib/api.js';

function useAuth() {
  const [token, setToken] = useState(() => sessionStorage.getItem('admin_token'));
  const login = (t) => { sessionStorage.setItem('admin_token', t); setToken(t); };
  const logout = () => { sessionStorage.removeItem('admin_token'); setToken(null); };
  return { token, login, logout };
}

/* ─── Metric card ─── */
function Metric({ icon, label, value, sub, accent }) {
  return (
    <div className="glass" style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        width: 40, height: 40, borderRadius: 13,
        background: accent ? 'linear-gradient(180deg, #ff6b8a, #e8446a)' : 'rgba(255,255,255,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        boxShadow: accent ? '0 4px 16px rgba(232,68,106,0.3)' : 'none',
        border: accent ? 'none' : '1px solid rgba(255,255,255,0.6)',
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</div>
        <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ─── Login ─── */
function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const r = await fetch(`${API}/admin/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Login gagal');
      onLogin(d.token);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="panel" style={{ maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18, margin: '0 auto 14px',
            background: 'linear-gradient(180deg, #ff6b8a, #e8446a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
            boxShadow: '0 8px 24px rgba(232,68,106,0.35)',
          }}>🔒</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 4 }}>Admin Panel</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Masuk untuk mengelola BLUUU</p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Username</label>
            <input className="field" id="admin-username" placeholder="admin" value={username} onChange={e => setUsername(e.target.value)} autoFocus required />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input className="field" id="admin-password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <div className="notice notice-error">⚠️ {error}</div>}
          <button type="submit" className="btn btn-accent btn-lg" disabled={loading} style={{ marginTop: 4, width: '100%' }}>
            {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Masuk...</> : '🚀 Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Dashboard ─── */
export default function AdminDashboard() {
  const { token, login, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [content, setContent] = useState([]);
  const [customFrames, setCustomFrames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [deletingPhoto, setDeletingPhoto] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [tab, setTab] = useState('overview');

  // Game Content CRUD States
  const [contentTab, setContentTab] = useState('deep');
  const [editingContent, setEditingContent] = useState(null);
  const [deletingContent, setDeletingContent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [inputText, setInputText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Custom Frames States
  const [frameName, setFrameName] = useState('');
  const [frameEmoji, setFrameEmoji] = useState('🖼️');
  const [frameFileBase64, setFrameFileBase64] = useState('');
  const [deletingFrame, setDeletingFrame] = useState(null);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchAll = async () => {
    if (!token) return;
    setLoading(true); setError('');
    try {
      const [sr, rr, cr, fr] = await Promise.all([
        fetch(`${API}/admin/stats`, { headers }),
        fetch(`${API}/admin/rooms`, { headers }),
        fetch(`${API}/admin/content`, { headers }),
        fetch(`${API}/admin/frames`, { headers }),
      ]);
      if (sr.status === 401 || rr.status === 401 || pr.status === 401 || cr.status === 401 || fr.status === 401) { logout(); return; }
      const statsData = sr.ok ? await sr.json() : null;
      const roomsData = rr.ok ? await rr.json() : [];
      const contentData = cr.ok ? await cr.json() : [];
      const framesData = fr.ok ? await fr.json() : [];

      setStats(statsData);
      setRooms(Array.isArray(roomsData) ? roomsData : []);
      setPhotos([]);
      setContent(Array.isArray(contentData) ? contentData : []);
      setCustomFrames(Array.isArray(framesData) ? framesData : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [token]);

  const deleteRoom = async (id) => {
    try {
      const r = await fetch(`${API}/admin/rooms/${id}`, { method: 'DELETE', headers });
      if (!r.ok) throw new Error('Gagal menghapus Room');
      setRooms(prev => prev.filter(rm => rm.id !== id));
      setDeleting(null);
    } catch (e) { setError(e.message); }
  };

  const deletePhoto = async () => { /* disabled for privacy */ return;
    try {
      const r = await fetch(`${API}/admin/photos/${id}`, { method: 'DELETE', headers });
      if (!r.ok) throw new Error('Gagal menghapus foto');
      setPhotos(prev => prev.filter(ph => ph.id !== id));
      setDeletingPhoto(null);
    } catch (e) { setError(e.message); }
  };

  // Custom Frame Actions
  const handleUploadFrame = async (e) => {
    e.preventDefault();
    if (!frameName.trim() || !frameFileBase64) {
      alert('Nama frame dan file gambar PNG transparan harus dipilih!');
      return;
    }
    setActionLoading(true);
    try {
      const r = await fetch(`${API}/admin/frames`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: frameName,
          emoji: frameEmoji,
          image_data: frameFileBase64
        })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Gagal mengunggah frame kustom');
      
      setFrameName('');
      setFrameEmoji('🖼️');
      setFrameFileBase64('');
      // Reset file input element manually if exists
      const fileInput = document.getElementById('frame-file-input');
      if (fileInput) fileInput.value = '';
      
      await fetchAll();
    } catch (err) { setError(err.message); }
    finally { setActionLoading(false); }
  };

  const handleDeleteFrame = async (id) => {
    try {
      const r = await fetch(`${API}/admin/frames/${id}`, { method: 'DELETE', headers });
      if (!r.ok) throw new Error('Gagal menghapus frame kustom');
      setCustomFrames(prev => prev.filter(f => f.id !== id));
      setDeletingFrame(null);
    } catch (err) { setError(err.message); }
  };

  // Game Content Actions
  const handleAddContent = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setActionLoading(true);
    try {
      const r = await fetch(`${API}/admin/content`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ game_type: contentTab, text_content: inputText }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Gagal menambahkan konten');
      setContent(prev => [...prev, d]);
      setInputText('');
      setShowAddModal(false);
    } catch (err) { setError(err.message); }
    finally { setActionLoading(false); }
  };

  const handleUpdateContent = async (id, text, is_active) => {
    setActionLoading(true);
    try {
      const body = {};
      if (text !== undefined) body.text_content = text;
      if (is_active !== undefined) body.is_active = is_active;

      const r = await fetch(`${API}/admin/content/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Gagal mengubah konten');
      setContent(prev => prev.map(c => c.id === id ? d : c));
      setEditingContent(null);
      setInputText('');
    } catch (err) { setError(err.message); }
    finally { setActionLoading(false); }
  };

  const handleDeleteContent = async (id) => {
    try {
      const r = await fetch(`${API}/admin/content/${id}`, { method: 'DELETE', headers });
      if (!r.ok) throw new Error('Gagal menghapus konten');
      setContent(prev => prev.filter(c => c.id !== id));
      setDeletingContent(null);
    } catch (err) { setError(err.message); }
  };

  const handleSeedContent = async () => {
    if (!window.confirm('Apakah Anda yakin ingin me-reset semua game ke pertanyaan default? Tindakan ini akan menghapus semua kuis custom yang sudah Anda buat.')) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/admin/content/seed`, { method: 'POST', headers });
      if (!r.ok) throw new Error('Gagal me-reset konten default');
      await fetchAll();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const statusPill = (s) => {
    const m = { active: ['Active','pill-green'], waiting: ['Waiting','pill-amber'], full: ['Full','pill-pink'], inactive: ['Inactive','pill-red'] };
    const [label, cls] = m[s] || m.inactive;
    return <span className={`pill ${cls}`}>{label}</span>;
  };

  if (!token) return <LoginForm onLogin={login} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>Dashboard</h1>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Kelola room, foto, games, dan statistik BLUUU</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-glass btn-sm" onClick={fetchAll} disabled={loading}>
            {loading ? '⟳ Memuat...' : '🔄 Refresh'}
          </button>
          <button className="btn btn-outline btn-sm" onClick={logout}>🚪 Logout</button>
        </div>
      </div>

      {error && <div className="notice notice-error">⚠️ {error}</div>}

      {/* Tabs */}
      <div className="seg-control">
        {['overview', 'rooms', 'games', 'frames'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`seg-btn${tab === t ? ' active' : ''}`}>
            {t === 'overview' ? '📊 Statistik' : t === 'rooms' ? '🏠 Room' : t === 'games' ? '🎮 Game CMS' : '🖼️ Frame Kustom'}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          <Metric icon="🏠" label="Total Room" value={stats?.total_rooms ?? '—'} sub="Sejak awal" accent />
          <Metric icon="✅" label="Room Aktif" value={stats?.active_rooms ?? '—'} sub="Saat ini" />
          <Metric icon="⏳" label="Menunggu" value={stats?.waiting_rooms ?? '—'} sub="1 pengguna" />
          <Metric icon="📸" label="Total Foto" value={stats?.total_photos ?? '—'} sub="Terunduh" />
          <Metric icon="👥" label="Terhubung" value={stats?.connected_sessions ?? '—'} sub="Live" />
        </div>
      )}

      {/* Rooms */}
      {tab === 'rooms' && (
        <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Semua Room ({rooms.length})</span>
            <span className="pill pill-pink">🔒 Privat</span>
          </div>
          {rooms.length === 0 ? (
            <div style={{ padding: '44px 24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🏠</div>
              Belum ada Room dibuat.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kode</th><th>Status</th><th>Dibuat</th><th>Creator</th><th>Joiner</th><th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map(rm => (
                    <tr key={rm.id}>
                      <td>
                        <code style={{ fontWeight: 800, fontSize: 12, color: 'var(--accent-dark)', background: 'rgba(232,68,106,0.06)', padding: '2px 10px', borderRadius: 6 }}>
                          {rm.room_code}
                        </code>
                      </td>
                      <td>{statusPill(rm.status)}</td>
                      <td style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        {new Date(rm.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ fontSize: 11 }}>
                        {rm.creator_peer_id
                          ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div className="dot dot-green" />{rm.creator_peer_id.slice(0,10)}…</span>
                          : <span style={{ color: 'var(--text-quaternary)' }}>—</span>}
                      </td>
                      <td style={{ fontSize: 11 }}>
                        {rm.joiner_peer_id
                          ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div className="dot dot-pink" />{rm.joiner_peer_id.slice(0,10)}…</span>
                          : <span style={{ color: 'var(--text-quaternary)' }}>—</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => setDeleting(rm.id)} style={{ borderColor: 'rgba(255,59,48,0.25)', color: '#b71c1c' }}>
                          🗑 Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Game Content Tab */}
      {tab === 'games' && (
        <div className="glass" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Kelola Pertanyaan & Kuis</span>
              <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 2 }}>Edit daftar kuis game real-time pasangan</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-accent btn-sm" onClick={() => { setInputText(''); setShowAddModal(true); }}>
                ➕ Tambah Kuis
              </button>
              <button className="btn btn-outline btn-sm" onClick={handleSeedContent} style={{ borderColor: 'rgba(232,68,106,0.3)' }}>
                🔄 Reset ke Bawaan
              </button>
            </div>
          </div>

          {/* Sub-tabs for each game type */}
          <div className="seg-control" style={{ marginBottom: 16 }}>
            {['deep', 'truth', 'dare', 'likely'].map(t => (
              <button key={t} onClick={() => setContentTab(t)} className={`seg-btn${contentTab === t ? ' active' : ''}`} style={{ fontSize: 11.5 }}>
                {t === 'deep' ? '💬 Deep Talk' : t === 'truth' ? '💎 Truth' : t === 'dare' ? '🔥 Dare' : '🏆 Siapa Paling'}
              </button>
            ))}
          </div>

          {/* Filtered questions table */}
          {(Array.isArray(content) ? content : []).filter(c => c.game_type === contentTab).length === 0 ? (
            <div style={{ padding: '44px 24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🎮</div>
              Belum ada kuis untuk kategori ini. Tambahkan kuis baru!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Isi Kuis</th>
                    <th style={{ width: 100 }}>Status</th>
                    <th style={{ width: 180, textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(content) ? content : []).filter(c => c.game_type === contentTab).map((c) => (
                    <tr key={c.id}>
                      <td>
                        {editingContent?.id === c.id ? (
                          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                            <input
                              className="field"
                              value={inputText}
                              onChange={e => setInputText(e.target.value)}
                              style={{ padding: '8px 12px', fontSize: 13, flex: 1 }}
                              autoFocus
                            />
                            <button className="btn btn-accent btn-sm" onClick={() => handleUpdateContent(c.id, inputText, undefined)} disabled={actionLoading}>
                              Simpan
                            </button>
                            <button className="btn btn-glass btn-sm" onClick={() => { setEditingContent(null); setInputText(''); }}>
                              Batal
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 13.5, color: c.is_active ? 'var(--text-primary)' : 'var(--text-quaternary)', textDecoration: c.is_active ? 'none' : 'line-through' }}>
                            {c.text_content}
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          className={`pill ${c.is_active ? 'pill-green' : 'pill-red'}`}
                          style={{ border: 'none', cursor: 'pointer', outline: 'none' }}
                          onClick={() => handleUpdateContent(c.id, undefined, !c.is_active)}
                          title="Klik untuk mengubah status"
                        >
                          {c.is_active ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {editingContent?.id !== c.id && (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button className="btn btn-glass btn-sm" onClick={() => { setEditingContent(c); setInputText(c.text_content); }}>
                              ✏️ Edit
                            </button>
                            <button className="btn btn-outline btn-sm" onClick={() => setDeletingContent(c.id)} style={{ borderColor: 'rgba(255,59,48,0.25)', color: '#b71c1c' }}>
                              🗑️ Hapus
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Custom Frames Tab */}
      {tab === 'frames' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {/* Upload form */}
            <div className="glass" style={{ padding: '20px 22px' }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                🖼️ Upload Frame Baru
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 16 }}>
                Format wajib: PNG transparan dengan lubang pas
              </span>

              <form onSubmit={handleUploadFrame} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Nama Frame</label>
                  <input
                    className="field"
                    placeholder="Contoh: Frame Valentine"
                    value={frameName}
                    onChange={e => setFrameName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Emoji Icon</label>
                  <input
                    className="field"
                    placeholder="Contoh: 🌸"
                    value={frameEmoji}
                    onChange={e => setFrameEmoji(e.target.value)}
                    maxLength={5}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>File Gambar PNG (Transparan)</label>
                  <input
                    type="file"
                    id="frame-file-input"
                    accept="image/png"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      if (file.type !== 'image/png') {
                        alert('Format file wajib .PNG transparan!');
                        e.target.value = '';
                        return;
                      }
                      // check size limit
                      if (file.size > 2.5 * 1024 * 1024) {
                        alert('Ukuran file terlalu besar! Silakan kompres PNG Anda di bawah 2.5 MB agar tidak error.');
                        e.target.value = '';
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFrameFileBase64(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }}
                    style={{
                      display: 'block', width: '100%', fontSize: 12, padding: '10px 0',
                      color: 'var(--text-secondary)'
                    }}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-accent btn-sm" style={{ marginTop: 6 }} disabled={actionLoading}>
                  {actionLoading ? 'Mengunggah...' : '🚀 Unggah Frame'}
                </button>
              </form>
            </div>

            {/* Design guides */}
            <div className="glass" style={{ padding: '20px 22px', background: 'rgba(255,255,255,0.3)' }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                📐 Panduan Desain Frame HD
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'block', marginBottom: 12 }}>
                Agar foto jepretan pasangan pas berada di lubang transparan frame Anda, buatlah desain dengan panduan berikut:
              </span>

              <div style={{ fontSize: 11.5, lineHeight: 1.6, color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div>• Ukuran Canvas Utama: <code style={{ fontWeight: 700 }}>1050 x 3275 px</code></div>
                <div>• Format File: <code style={{ fontWeight: 700 }}>.PNG (Transparent)</code></div>
                <div>• Ukuran tiap Lubang Foto: <code style={{ fontWeight: 700 }}>950 x 712 px</code></div>
                <div>• Koordinat Lubang Foto (X: 50 px dari kiri):</div>
                <div style={{ paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div>- Lubang 1 Y: <code style={{ fontWeight: 700 }}>200 px</code></div>
                  <div>- Lubang 2 Y: <code style={{ fontWeight: 700 }}>937 px</code></div>
                  <div>- Lubang 3 Y: <code style={{ fontWeight: 700 }}>1674 px</code></div>
                  <div>- Lubang 4 Y: <code style={{ fontWeight: 700 }}>2411 px</code></div>
                </div>
                <div style={{ marginTop: 6, padding: '8px 10px', background: 'rgba(232,68,106,0.06)', borderRadius: 8, fontSize: 10.5, color: 'var(--accent-dark)', border: '1px solid rgba(232,68,106,0.1)' }}>
                  💡 <strong>Tips:</strong> Buatlah background transparan pada area koordinat tersebut di Photoshop/Canva sebelum mengunggah.
                </div>
              </div>
            </div>
          </div>

          {/* Frame List Table */}
          <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Daftar Frame Kustom ({customFrames.length})</span>
            </div>

            {customFrames.length === 0 ? (
              <div style={{ padding: '44px 24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🖼️</div>
                Belum ada frame kustom diunggah.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>Icon</th>
                      <th>Nama Frame</th>
                      <th>Ukuran File</th>
                      <th>Dibuat</th>
                      <th style={{ textAlign: 'right', width: 120 }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customFrames.map(f => (
                      <tr key={f.id}>
                        <td style={{ fontSize: 20, textAlign: 'center' }}>{f.emoji}</td>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{f.name}</td>
                        <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {f.size ? `${(f.size / 1024).toFixed(0)} KB` : '—'}
                        </td>
                        <td style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                          {f.created_at ? new Date(f.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setDeletingFrame(f.id)}
                            style={{ borderColor: 'rgba(255,59,48,0.25)', color: '#b71c1c' }}
                          >
                            🗑 Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Custom Frame Modal */}
      {deletingFrame && (
        <div className="overlay" onClick={() => setDeletingFrame(null)}>
          <div className="panel" style={{ maxWidth: 340 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>🗑️</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 5 }}>Hapus Frame Kustom?</h3>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Frame ini akan dihapus permanen dan tidak bisa dipilih lagi.</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-glass" style={{ flex: 1 }} onClick={() => setDeletingFrame(null)}>Batal</button>
              <button className="btn btn-accent" style={{ flex: 1, background: 'linear-gradient(180deg, #ff6b6b, #dc2626)', boxShadow: '0 6px 20px rgba(220,38,38,0.3)' }} onClick={() => handleDeleteFrame(deletingFrame)}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Content Modal */}
      {showAddModal && (
        <div className="overlay" onClick={() => setShowAddModal(false)}>
          <div className="panel" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 5 }}>Tambah Pertanyaan Baru</h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>
                Menambahkan ke kuis: <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                  {contentTab === 'deep' ? 'Deep Talk' : contentTab === 'truth' ? 'Truth' : contentTab === 'dare' ? 'Dare' : 'Siapa Paling'}
                </span>
              </p>
            </div>
            <form onSubmit={handleAddContent} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Isi Kuis / Pertanyaan</label>
                <textarea
                  className="field"
                  rows="3"
                  placeholder={contentTab === 'deep' ? 'Contoh: Apa sifat pasanganku yang paling membuatku kagum?' : 'Contoh pertanyaan kuis...'}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  style={{ width: '100%', fontFamily: 'inherit', resize: 'vertical', padding: '10px 14px' }}
                  required
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button type="button" className="btn btn-glass" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Batal</button>
                <button type="submit" className="btn btn-accent" style={{ flex: 1 }} disabled={actionLoading}>
                  {actionLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Content modal */}
      {deletingContent && (
        <div className="overlay" onClick={() => setDeletingContent(null)}>
          <div className="panel" style={{ maxWidth: 340 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>🗑️</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 5 }}>Hapus Kuis?</h3>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Pertanyaan ini akan dihapus permanen dari game.</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-glass" style={{ flex: 1 }} onClick={() => setDeletingContent(null)}>Batal</button>
              <button className="btn btn-accent" style={{ flex: 1, background: 'linear-gradient(180deg, #ff6b6b, #dc2626)', boxShadow: '0 6px 20px rgba(220,38,38,0.3)' }} onClick={() => handleDeleteContent(deletingContent)}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Room modal */}
      {deleting && (
        <div className="overlay" onClick={() => setDeleting(null)}>
          <div className="panel" style={{ maxWidth: 340 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>🗑️</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 5 }}>Hapus Room?</h3>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Data Room akan dihapus permanen.</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-glass" style={{ flex: 1 }} onClick={() => setDeleting(null)}>Batal</button>
              <button className="btn btn-accent" style={{ flex: 1, background: 'linear-gradient(180deg, #ff6b6b, #dc2626)', boxShadow: '0 6px 20px rgba(220,38,38,0.3)' }} onClick={() => deleteRoom(deleting)}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Photo modal */}
      {deletingPhoto && (
        <div className="overlay" onClick={() => setDeletingPhoto(null)}>
          <div className="panel" style={{ maxWidth: 340 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>🗑️</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 5 }}>Hapus Foto?</h3>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Data foto strip akan dihapus permanen dari galeri.</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-glass" style={{ flex: 1 }} onClick={() => setDeletingPhoto(null)}>Batal</button>
              <button className="btn btn-accent" style={{ flex: 1, background: 'linear-gradient(180deg, #ff6b6b, #dc2626)', boxShadow: '0 6px 20px rgba(220,38,38,0.3)' }} onClick={() => deletePhoto(deletingPhoto)}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview modal */}
      {previewPhoto && (
        <div className="overlay" onClick={() => setPreviewPhoto(null)}>
          <div style={{ position: 'relative' }}>
            <img src={previewPhoto} alt="Preview" style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 20, boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }} />
            <button onClick={() => setPreviewPhoto(null)} style={{ position: 'absolute', top: -10, right: -10, width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 };
