import React, { useState, useEffect } from 'react';

const QUESTIONS = [
  'Kapan pertama kali kamu sadar jatuh cinta padaku?',
  'Apa momen terfavorit kita yang selalu kamu ingat?',
  'Mimpi terbesarmu yang ingin kita capai bersama?',
  'Hal apa dariku yang paling kamu suka?',
  'Kalau bisa kembali ke satu hari denganku, hari apa?',
  'Apa ketakutan terbesar yang belum kamu ceritakan?',
  'Hal kecil apa yang selalu membuatmu teringat padaku?',
  'Kalau kita punya satu hari tanpa HP, mau ngapain?',
  'Apa yang paling ingin kamu pelajari dari kepribadianku?',
  'Ceritakan satu hal yang belum pernah kamu ceritakan ke siapapun.',
];

const TRUTHS = [
  'Apa kebohongan kecil pertama yang pernah kamu katakan padaku?',
  'Siapa yang lebih sering memulai pertengkaran?',
  'Apa yang paling tidak kamu suka tapi tidak pernah bilang?',
  'Apa yang kamu pikirkan saat pertama kali melihatku?',
  'Pernahkah kamu berpura-pura setuju padahal tidak?',
  'Hal apa yang diam-diam kamu kagumi dari orang lain?',
  'Kapan terakhir kali kamu menangis dan kenapa?',
];

const DARES = [
  'Nyanyikan bait lagu cinta favorit dengan suara penuh!',
  'Ceritakan kenangan paling memalukan kita.',
  'Tulis pesan romantis 3 baris dan bacakan keras-keras.',
  'Tiru gaya foto pre-wedding, tahan 10 detik.',
  'Kirimkan meme lucu ke kontak paling jarang dibalas.',
  'Buat konten TikTok 15 detik langsung sekarang.',
];

const LIKELY_QUESTIONS = [
  'Siapa yang lebih mungkin terlambat untuk kencan?',
  'Siapa yang lebih mungkin menghabiskan uang lebih?',
  'Siapa yang lebih mungkin menangis di film romantis?',
  'Siapa yang lebih mungkin masak makan malam spesial?',
  'Siapa yang lebih mungkin lupa ulang tahun pasangan?',
  'Siapa yang lebih mungkin panik saat ada serangga?',
  'Siapa yang lebih mungkin sukses dulu?',
  'Siapa yang lebih mungkin tidur di sofa setelah ribut?',
];

const POSES = [
  { title: '🤳 Selfie Senyum Lebar', desc: 'Tempel pipi, senyum selebar mungkin!' },
  { title: '🤗 Pelukan Terbaik', desc: 'Pelukan paling hangat, tampak kamera!' },
  { title: '🤪 Muka Paling Lucu', desc: 'Boleh semua gaya gila-gilaan!' },
  { title: '👑 Gaya Ratu & Raja', desc: 'Tampil anggun dan wibawa!' },
  { title: '🤫 Bisik Rahasia', desc: 'Pura-pura bisik, ekspresi berlebihan!' },
];

const GAMES = [
  { id: 'deep',   emoji: '💬', name: 'Deep Talk',       desc: 'Pertanyaan mendalam' },
  { id: 'tod',    emoji: '🔥', name: 'Truth or Dare',   desc: 'Jujur atau tantangan' },
  { id: 'likely', emoji: '🏆', name: 'Siapa Paling...', desc: 'Voting real-time' },
  { id: 'pose',   emoji: '🎭', name: 'Pose Challenge',  desc: 'Pose & foto langsung' },
];

export default function CoupleGames({ isRemote, connState, sendData, remoteGameState, onTriggerBoothCapture }) {
  const [game, setGame] = useState(null);
  const [qIdx, setQIdx] = useState(0);
  const [todType, setTodType] = useState(null);
  const [todIdx, setTodIdx] = useState(0);
  const [lIdx, setLIdx] = useState(0);
  const [myVote, setMyVote] = useState(null);
  const [remoteVote, setRemoteVote] = useState(null);
  const [poseIdx, setPoseIdx] = useState(0);
  const [cooldown, setCooldown] = useState(false);

  const live = !isRemote || connState === 'connected';
  const send = (d) => sendData?.(d);

  useEffect(() => {
    if (!remoteGameState) return;
    const d = remoteGameState;
    if (d.type === 'GAME_STATE') {
      if (d.game === 'deep')   setQIdx(d.idx);
      if (d.game === 'tod')    { setTodType(d.todType); setTodIdx(d.idx); }
      if (d.game === 'likely') { setLIdx(d.idx); setMyVote(null); setRemoteVote(null); }
      if (d.game === 'pose')   setPoseIdx(d.idx);
      setGame(d.game);
    }
    if (d.type === 'VOTE') setRemoteVote(d.vote);
    if (d.type === 'RESET') { setGame(null); setMyVote(null); setRemoteVote(null); }
  }, [remoteGameState]);

  const start = (id) => { setGame(id); setQIdx(0); setTodType(null); setMyVote(null); setRemoteVote(null); setPoseIdx(0); send({ type: 'GAME_STATE', game: id, idx: 0 }); };
  const reset = () => { setGame(null); setMyVote(null); setRemoteVote(null); send({ type: 'RESET' }); };

  const nextQ = () => { const n = (qIdx+1) % QUESTIONS.length; setQIdx(n); send({ type: 'GAME_STATE', game: 'deep', idx: n }); };
  const prevQ = () => { const n = (qIdx-1+QUESTIONS.length) % QUESTIONS.length; setQIdx(n); send({ type: 'GAME_STATE', game: 'deep', idx: n }); };

  const pickTod = (type) => { const arr = type === 'truth' ? TRUTHS : DARES; const i = Math.floor(Math.random()*arr.length); setTodType(type); setTodIdx(i); send({ type: 'GAME_STATE', game: 'tod', todType: type, idx: i }); };

  const nextL = () => { const n = (lIdx+1) % LIKELY_QUESTIONS.length; setLIdx(n); setMyVote(null); setRemoteVote(null); send({ type: 'GAME_STATE', game: 'likely', idx: n }); };
  const vote = (v) => { setMyVote(v); send({ type: 'VOTE', vote: v }); };

  const nextPose = () => { const n = (poseIdx+1) % POSES.length; setPoseIdx(n); send({ type: 'GAME_STATE', game: 'pose', idx: n }); };
  const poseCapture = () => { if (cooldown) return; setCooldown(true); onTriggerBoothCapture?.(); setTimeout(() => setCooldown(false), 4000); };

  /* ── Game views ── */
  const renderGame = () => {
    if (game === 'deep') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span className="pill pill-pink">💬 Deep Talk · {qIdx+1}/{QUESTIONS.length}</span>
        <div className="frosted-card">
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.55 }}>"{QUESTIONS[qIdx]}"</p>
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
                "{todType === 'truth' ? TRUTHS[todIdx] : DARES[todIdx]}"
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
        <span className="pill pill-pink">🏆 Siapa Paling... · {lIdx+1}/{LIKELY_QUESTIONS.length}</span>
        <div className="frosted-card">
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.55 }}>"{LIKELY_QUESTIONS[lIdx]}"</p>
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

    if (game === 'pose') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span className="pill pill-pink">🎭 Pose · {poseIdx+1}/{POSES.length}</span>
        <div className="frosted-card">
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>{POSES[poseIdx].title}</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>{POSES[poseIdx].desc}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-accent" style={{ flex: 1 }} onClick={poseCapture} disabled={cooldown}>
            {cooldown ? '⏱ Siap-siap...' : '📸 Foto Sekarang!'}
          </button>
          <button className="btn btn-glass btn-sm" onClick={nextPose}>Pose Lain →</button>
        </div>
        {cooldown && <div className="notice notice-success">Countdown dimulai! Berpose sekarang! 💕</div>}
      </div>
    );

    return null;
  };

  return (
    <div className="glass" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14, height: 'fit-content' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>🎮 Games</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{live ? '🔗 Sinkron aktif' : '📱 Mode lokal'}</div>
        </div>
        {game && <button className="btn btn-outline btn-sm" onClick={reset}>← Pilih Game</button>}
      </div>

      {/* Game grid */}
      {!game ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {GAMES.map(g => (
            <button key={g.id} onClick={() => start(g.id)} className="glass" style={{
              padding: '16px 14px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              display: 'flex', flexDirection: 'column', gap: 6, border: '1.5px solid rgba(255,255,255,0.45)',
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
