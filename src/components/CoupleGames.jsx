import React, { useState, useEffect, useRef } from 'react';
import { API } from '../lib/api';

/* ── Default fallback content (used if API fails) ── */
const DEFAULT_QUESTIONS = [
  'Kapan pertama kali kamu sadar jatuh cinta padaku?',
  'Apa momen terfavorit kita yang selalu kamu ingat?',
  'Mimpi terbesarmu yang ingin kita capai bersama?',
  'Hal apa dariku yang paling kamu suka?',
  'Kalau bisa kembali ke satu hari denganku, hari apa?',
];
const DEFAULT_TRUTHS = [
  'Apa kebohongan kecil pertama yang pernah kamu katakan padaku?',
  'Siapa yang lebih sering memulai pertengkaran?',
  'Apa yang paling tidak kamu suka tapi tidak pernah bilang?',
];
const DEFAULT_DARES = [
  'Nyanyikan bait lagu cinta favorit dengan suara penuh!',
  'Ceritakan kenangan paling memalukan kita.',
  'Tulis pesan romantis 3 baris dan bacakan keras-keras.',
];
const DEFAULT_LIKELY = [
  'Siapa yang lebih mungkin terlambat untuk kencan?',
  'Siapa yang lebih mungkin menghabiskan uang lebih?',
  'Siapa yang lebih mungkin menangis di film romantis?',
];

const GAMES = [
  { id: 'deep',   emoji: '💬', name: 'Deep Talk',       desc: 'Pertanyaan mendalam' },
  { id: 'tod',    emoji: '🔥', name: 'Truth or Dare',   desc: 'Jujur atau tantangan' },
  { id: 'likely', emoji: '🏆', name: 'Siapa Paling...', desc: 'Voting real-time' },
  { id: 'draw',   emoji: '🎨', name: 'Saling Gambar',   desc: 'Coret-coret berdua' },
];

export default function CoupleGames({ isRemote, connState, sendData, remoteGameState }) {
  const [game, setGame] = useState(null);
  const [qIdx, setQIdx] = useState(0);
  const [todType, setTodType] = useState(null);
  const [todIdx, setTodIdx] = useState(0);
  const [lIdx, setLIdx] = useState(0);
  const [myVote, setMyVote] = useState(null);
  const [remoteVote, setRemoteVote] = useState(null);

  // Drawing game states & refs
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const [brushColor, setBrushColor] = useState('#ff6b8a');

  // Dynamic content from API
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [truths, setTruths] = useState(DEFAULT_TRUTHS);
  const [dares, setDares] = useState(DEFAULT_DARES);
  const [likelyQs, setLikelyQs] = useState(DEFAULT_LIKELY);

  const live = !isRemote || connState === 'connected';
  const send = (d) => sendData?.(d);

  // Fetch content from API on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/content`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.deep?.length)   setQuestions(data.deep);
        if (data.truth?.length)  setTruths(data.truth);
        if (data.dare?.length)   setDares(data.dare);
        if (data.likely?.length) setLikelyQs(data.likely);
      } catch (_) { /* fallback to defaults */ }
    })();
  }, []);

  // Handle remote game state sync and draw lines
  useEffect(() => {
    if (!remoteGameState) return;
    const d = remoteGameState;
    
    if (d.type === 'GAME_STATE') {
      if (d.game === 'deep')   setQIdx(d.idx);
      if (d.game === 'tod')    { setTodType(d.todType); setTodIdx(d.idx); }
      if (d.game === 'likely') { setLIdx(d.idx); setMyVote(null); setRemoteVote(null); }
      setGame(d.game);
    }
    if (d.type === 'VOTE') setRemoteVote(d.vote);
    if (d.type === 'RESET') { setGame(null); setMyVote(null); setRemoteVote(null); }
    
    // Draw incoming lines
    if (d.type === 'DRAW_LINE' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.strokeStyle = d.color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.moveTo(d.x0 * canvas.width, d.y0 * canvas.height);
      ctx.lineTo(d.x1 * canvas.width, d.y1 * canvas.height);
      ctx.stroke();
    }
    
    // Clear canvas
    if (d.type === 'DRAW_CLEAR' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [remoteGameState]);

  const start = (id) => { setGame(id); setQIdx(0); setTodType(null); setMyVote(null); setRemoteVote(null); send({ type: 'GAME_STATE', game: id, idx: 0 }); };
  const reset = () => { setGame(null); setMyVote(null); setRemoteVote(null); send({ type: 'RESET' }); };

  const nextQ = () => { const n = (qIdx+1) % questions.length; setQIdx(n); send({ type: 'GAME_STATE', game: 'deep', idx: n }); };
  const prevQ = () => { const n = (qIdx-1+questions.length) % questions.length; setQIdx(n); send({ type: 'GAME_STATE', game: 'deep', idx: n }); };

  const pickTod = (type) => { const arr = type === 'truth' ? truths : dares; const i = Math.floor(Math.random()*arr.length); setTodType(type); setTodIdx(i); send({ type: 'GAME_STATE', game: 'tod', todType: type, idx: i }); };

  const nextL = () => { const n = (lIdx+1) % likelyQs.length; setLIdx(n); setMyVote(null); setRemoteVote(null); send({ type: 'GAME_STATE', game: 'likely', idx: n }); };
  const vote = (v) => { setMyVote(v); send({ type: 'VOTE', vote: v }); };

  // Drawing event handlers
  const getCanvasCoords = (e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Support mouse and touch
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Calculate normalized coords [0..1]
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    return { x, y };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const pos = getCanvasCoords(e);
    lastPosRef.current = pos;
    isDrawingRef.current = true;
  };

  const draw = (e) => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getCanvasCoords(e);
    
    ctx.beginPath();
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.moveTo(lastPosRef.current.x * canvas.width, lastPosRef.current.y * canvas.height);
    ctx.lineTo(pos.x * canvas.width, pos.y * canvas.height);
    ctx.stroke();
    
    // Send line info over WebRTC
    send({
      type: 'DRAW_LINE',
      x0: lastPosRef.current.x,
      y0: lastPosRef.current.y,
      x1: pos.x,
      y1: pos.y,
      color: brushColor
    });
    
    lastPosRef.current = pos;
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    send({ type: 'DRAW_CLEAR' });
  };

  /* ── Game views ── */
  const renderGame = () => {
    if (game === 'deep') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span className="pill pill-pink">💬 Deep Talk · {qIdx+1}/{questions.length}</span>
        <div className="frosted-card">
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.55 }}>"{questions[qIdx]}"</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <button className="btn btn-glass btn-sm" onClick={prevQ}>← Prev</button>
          <span style={{ fontSize: 11, color: 'var(--text-quaternary)', fontWeight: 600 }}>{live ? '🔗 Sinkron' : '📱 Lokal'}</span>
          <button className="btn btn-accent btn-sm" onClick={nextQ}>Next →</button>
        </div>
      </div>
    );

    if (game === 'tod') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span className="pill pill-pink">🔥 Truth or Dare</span>
        {!todType ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { t: 'truth', em: '💎', label: 'Truth', sub: 'Jawab jujur', bg: 'rgba(99,102,241,0.08)', brd: '#6366f1', col: '#4338ca' },
              { t: 'dare',  em: '🔥', label: 'Dare',  sub: 'Lakukan tantangan', bg: 'rgba(232,68,106,0.08)', brd: '#e8446a', col: '#c9184a' },
            ].map(b => (
              <button key={b.t} onClick={() => pickTod(b.t)} style={{
                padding: '20px 14px', borderRadius: 'var(--radius-lg)', border: `1.5px solid ${b.brd}`,
                background: b.bg, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', color: b.col,
                transition: 'all 0.25s',
              }}>
                <span style={{ fontSize: 28 }}>{b.em}</span>
                <span style={{ fontWeight: 800, fontSize: 15 }}>{b.label}</span>
                <span style={{ fontSize: 11, opacity: 0.75 }}>{b.sub}</span>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="frosted-card" style={{ background: todType === 'truth' ? 'rgba(99,102,241,0.06)' : 'rgba(232,68,106,0.06)' }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.55 }}>
                "{todType === 'truth' ? truths[todIdx] : dares[todIdx]}"
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-glass btn-sm" onClick={() => setTodType(null)}>← Pilih Ulang</button>
              <button className="btn btn-accent btn-sm" onClick={() => pickTod(todType)}>🔀 Acak Lagi</button>
            </div>
          </div>
        )}
      </div>
    );

    if (game === 'likely') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span className="pill pill-pink">🏆 Siapa Paling... · {lIdx+1}/{likelyQs.length}</span>
        <div className="frosted-card">
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.55 }}>"{likelyQs[lIdx]}"</p>
        </div>
        {!myVote ? (
          <div style={{ display: 'flex', gap: 10 }}>
            {['Aku', 'Pasanganku'].map((v, i) => (
              <button key={v} className="vote-btn" onClick={() => vote(v)}>
                <span style={{ fontSize: 18 }}>{i === 0 ? '🙋' : '💑'}</span> {v}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-md)', background: 'rgba(232,68,106,0.06)', border: '1.5px solid rgba(232,68,106,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 700, marginBottom: 3 }}>Pilihanmu</div>
                <div style={{ fontWeight: 800, color: 'var(--accent-dark)', fontSize: 14 }}>{myVote}</div>
              </div>
              <div style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.5)', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 700, marginBottom: 3 }}>Pasangan</div>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 14 }}>{remoteVote ?? (live ? '⏳ Menunggu...' : '—')}</div>
              </div>
            </div>
            {myVote && remoteVote && (
              <div className={`notice ${myVote === remoteVote ? 'notice-success' : ''}`} style={myVote !== remoteVote ? { background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.15)', color: '#8a5a00' } : {}}>
                {myVote === remoteVote ? '🎉 Kalian setuju! Sempurna 💕' : '😄 Beda pilihan! Seru juga~'}
              </div>
            )}
            <button className="btn btn-accent btn-sm" onClick={nextL}>Pertanyaan Berikutnya →</button>
          </div>
        )}
      </div>
    );

    if (game === 'draw') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <span className="pill pill-pink" style={{ width: '100%', textAlign: 'center' }}>🎨 Saling Gambar Real-time</span>
        
        <canvas
          ref={canvasRef}
          width={320}
          height={240}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '2px solid rgba(255, 255, 255, 0.6)',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
            cursor: 'crosshair',
            width: '100%',
            maxWidth: '320px',
            touchAction: 'none' // Prevent scrolling while drawing on mobile
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '320px', alignItems: 'center', gap: 10 }}>
          {/* Color palette */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { color: '#ff6b8a', label: 'Pink' },
              { color: '#00ffff', label: 'Cyan' },
              { color: '#ffd700', label: 'Yellow' },
              { color: '#222222', label: 'Black' }
            ].map(c => (
              <button
                key={c.color}
                onClick={() => setBrushColor(c.color)}
                style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: c.color,
                  border: brushColor === c.color ? '2.5px solid #fff' : '1px solid rgba(0,0,0,0.15)',
                  boxShadow: brushColor === c.color ? '0 0 8px rgba(0,0,0,0.2)' : 'none',
                  cursor: 'pointer', outline: 'none', transition: 'all 0.15s'
                }}
                title={c.label}
              />
            ))}
          </div>
          
          <button className="btn btn-outline btn-sm" onClick={clearCanvas} style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
            🗑️ Hapus Coretan
          </button>
        </div>
      </div>
    );

    return null;
  };

  return (
    <div className="glass workspace-card" style={{ display: 'flex', flexDirection: 'column', gap: 14, height: 'fit-content' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>🎮 Games</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{live ? '🔗 Sinkron aktif' : '📱 Mode lokal'}</div>
        </div>
        {game && <button className="btn btn-outline btn-sm" onClick={reset}>← Pilih Game</button>}
      </div>

      {/* Game grid */}
      {!game ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 8 }}>
          {GAMES.map(g => (
            <button key={g.id} onClick={() => start(g.id)} className="glass" style={{
              padding: '16px 14px', cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit',
              display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', border: '1.5px solid rgba(255,255,255,0.45)',
            }}>
              <span style={{ fontSize: 24 }}>{g.emoji}</span>
              <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>{g.name}</span>
              <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>{g.desc}</span>
            </button>
          ))}
        </div>
      ) : (
        <div style={{ minHeight: 180 }}>{renderGame()}</div>
      )}

      {isRemote && !live && (
        <div className="notice notice-error" style={{ fontSize: 12 }}>⚠️ Pasangan belum terhubung.</div>
      )}
    </div>
  );
}
