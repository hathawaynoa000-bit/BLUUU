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

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchAll = async () => {
    if (!token) return;
    setLoading(true); setError('');
    try {
      const [sr, rr, pr, cr] = await Promise.all([
        fetch(`${API}/admin/stats`, { headers }),
        fetch(`${API}/admin/rooms`, { headers }),
        fetch(`${API}/admin/photos`, { headers }),
        fetch(`${API}/admin/content`, { headers }),
      ]);
      if (sr.status === 401 || rr.status === 401 || pr.status === 401 || cr.status === 401) { logout(); return; }
      setStats(await sr.json());
      setRooms(await rr.json());
      setPhotos(await pr.json());
      setContent(await cr.json());
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

  const deletePhoto = async (id) => {
    try {
      const r = await fetch(`${API}/admin/photos/${id}`, { method: 'DELETE', headers });
      if (!r.ok) throw new Error('Gagal menghapus foto');
      setPhotos(prev => prev.filter(ph => ph.id !== id));
      setDeletingPhoto(null);
    } catch (e) { setError(e.message); }
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
        {['overview', 'rooms', 'photos', 'games'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`seg-btn${tab === t ? ' active' : ''}`}>
            {t === 'overview' ? '📊 Statistik' : t === 'rooms' ? '🏠 Room' : t === 'photos' ? '📸 Foto Gallery' : '🎮 Konten Game'}
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

      {/* Photos Gallery Tab */}
      {tab === 'photos' && (
        <div className="glass" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Galeri Foto Global ({photos.length})</span>
            <span className="pill pill-pink">📸 Real-time Gallery</span>
          </div>

          {photos.length === 0 ? (
            <div style={{ padding: '44px 24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📸</div>
              Belum ada foto strip diunggah ke database.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 14 }}>
              {photos.map(ph => (
                <div 
                  key={ph.id} 
                  style={{
                    background: 'rgba(255,255,255,0.4)', borderRadius: 'var(--radius-md)', padding: 8,
                    border: '1px solid rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', gap: 8,
                    boxShadow: '0 2px 10px rgba(140,60,80,0.04)'
                  }}
                >
                  <div 
                    onClick={() => setPreviewPhoto(ph.photo_data)}
                    style={{
                      aspectRatio: '1/3', borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                      border: '1px solid rgba(255,255,255,0.5)', position: 'relative'
                    }}
                  >
                    <img src={ph.photo_data} alt="Strip" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      💕 {ph.couple_names}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
                      Room: {ph.room_code}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-quaternary)', marginTop: 2 }}>
                      {new Date(ph.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <button 
                    className="btn btn-outline btn-sm" 
                    onClick={() => setDeletingPhoto(ph.id)}
                    style={{ 
                      borderColor: 'rgba(255,59,48,0.25)', color: '#b71c1c', padding: '4px', width: '100%', 
                      fontSize: 10, borderRadius: 6 
                    }}
                  >
                    🗑 Hapus
                  </button>
                </div>
              ))}
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
          {content.filter(c => c.game_type === contentTab).length === 0 ? (
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
                  {content.filter(c => c.game_type === contentTab).map((c) => (
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
