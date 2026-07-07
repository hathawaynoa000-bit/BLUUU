import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import WebRTCConnection, { CONNECTION_MODES } from './components/WebRTCConnection';
import Photobooth from './components/Photobooth';
import CoupleGames from './components/CoupleGames';
import AdminDashboard from './components/AdminDashboard';
import AboutPage from './components/AboutPage';

/* ─── Simple client-side router ─── */
function useRouter() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (to) => {
    window.history.pushState({}, '', to);
    setPath(to);
  };

  return { path, navigate };
}

/* ─── Mesh background orbs (shared) ─── */
function MeshBg() {
  return (
    <div className="mesh-bg">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </div>
  );
}

export default function App() {
  const { path, navigate } = useRouter();
  const [mode, setMode]   = useState(CONNECTION_MODES.NONE);
  const [connectionData, setConnectionData]     = useState(null);
  const [remoteGameState, setRemoteGameState]   = useState(null);
  const [syncShutterState, setSyncShutterState] = useState('idle');

  const handleConnectionReady = (data) => setConnectionData(data);

  const handleDataReceived = (data) => {
    if (data.type === 'SHUTTER_TRIGGER') {
      setSyncShutterState('trigger');
      setTimeout(() => setSyncShutterState('idle'), 500);
    } else {
      setRemoteGameState(data);
    }
  };

  const triggerSyncCapture = () => {
    if (connectionData?.sendData) connectionData.sendData({ type: 'SHUTTER_TRIGGER' });
  };

  const isConnected   = connectionData?.connState === 'connected';
  const showWorkspace = mode === CONNECTION_MODES.LOCAL || (mode === CONNECTION_MODES.REMOTE && isConnected);

  /* ═══════════════ PAGE: HOME ══════════════════════════════════════════════ */
  if (path === '/' || path === '') {
    return (
      <>
        <MeshBg />
        <HomePage onStart={() => navigate('/app')} />
      </>
    );
  }

  /* ═══════════════ PAGE: ABOUT ════════════════════════════════════════════ */
  if (path === '/about') {
    return (
      <div style={{ minHeight: '100vh', position: 'relative' }}>
        <MeshBg />
        <header style={S.header}>
          <button onClick={() => navigate('/')} style={S.logoWrap}>
            <span style={S.logoIcon}>💖</span>
            <span style={S.logoLabel}>BLUUU V3</span>
          </button>
          <span className="pill pill-pink">📖 About</span>
        </header>
        <main style={{ maxWidth: 1040, margin: '0 auto', padding: '28px 20px 60px' }}>
          <AboutPage onBack={() => navigate('/')} />
        </main>
      </div>
    );
  }

  /* ═══════════════ PAGE: ADMIN ════════════════════════════════════════════ */
  if (path === '/admin') {
    return (
      <div style={{ minHeight: '100vh', position: 'relative' }}>
        <MeshBg />
        <header style={S.header}>
          <button onClick={() => navigate('/')} style={S.logoWrap}>
            <span style={S.logoIcon}>💖</span>
            <span style={S.logoLabel}>BLUUU V3</span>
          </button>
          <span className="pill pill-pink">🔒 Admin Dashboard</span>
        </header>
        <main style={{ maxWidth: 1040, margin: '0 auto', padding: '28px 20px 60px' }}>
          <AdminDashboard />
        </main>
      </div>
    );
  }

  /* ═══════════════ PAGE: APP (/app) ═══════════════════════════════════════ */
  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <MeshBg />

      {/* Header */}
      <header style={S.header}>
        <button onClick={() => { setMode(CONNECTION_MODES.NONE); navigate('/'); }} style={S.logoWrap}>
          <span style={S.logoIcon}>💖</span>
          <span style={S.logoLabel}>BLUUU V3</span>
        </button>
        {mode !== CONNECTION_MODES.NONE && (
          <span className="pill pill-pink">Tools LDR</span>
        )}
      </header>

      {/* Content */}
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '20px 20px 60px' }}>

        {/* ── Landing: pick mode ── */}
        {mode === CONNECTION_MODES.NONE && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
            {/* Hero */}
            <section style={S.hero}>
              <span className="pill pill-pink">✨ Couple Experience</span>
              <h1 style={S.heroTitle}>
                Photobooth virtual .<br />
                <span style={{ background: 'linear-gradient(135deg,#e8446a 0%,#ff6b8a 60%,#ff92a8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Take the moment .
                </span>
              </h1>
              <p style={S.heroSub}>
                Lanjutan dari BLU-2
              </p>
            </section>

            {/* Mode selector */}
            <WebRTCConnection
              mode={mode}
              setMode={setMode}
              onConnectionReady={handleConnectionReady}
              onDataReceived={handleDataReceived}
            />

            {/* Feature cards */}
            <section style={S.featureGrid}>
              {[
                { icon: '📸', title: 'Photobooth', desc: 'Frame estetik, filter retro, dan sinkronisasi shutter secara real-time.' },
                { icon: '📡', title: 'Real-Time Photobooth',  desc: 'Pertanyaan mendalam untuk mendekatkan hati dan membuka kenangan.' },
                { icon: '💬', title: 'Couple Games',    desc: 'Tantangan lucu dan pertanyaan jujur yang seru untuk pasangan.' },
                { icon: '🔒', title: 'Private Room',  desc: 'Voting real-time saling menebak kepribadian pasangan langsung.' },
              ].map(f => (
                <div key={f.title} className="glass" style={S.featureCard}>
                  <div style={S.featureEmoji}>{f.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{f.title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              ))}
            </section>
          </div>
        )}

        {/* ── Mode active ── */}
        {mode !== CONNECTION_MODES.NONE && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <WebRTCConnection
              mode={mode}
              setMode={setMode}
              onConnectionReady={handleConnectionReady}
              onDataReceived={handleDataReceived}
            />
            
            <div className="app-workspace">
              <Photobooth
                connectionData={connectionData}
                syncShutterState={syncShutterState}
                triggerSyncCapture={triggerSyncCapture}
              />
              <CoupleGames
                isRemote={mode === CONNECTION_MODES.REMOTE}
                connState={connectionData?.connState}
                sendData={connectionData?.sendData}
                remoteGameState={remoteGameState}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={S.footer}>
        <span>© {new Date().getFullYear()} BLUUU V3 · Build for R💖</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => navigate('/about')} style={S.footerAdmin}>
            📖 About BLUUU
          </button>
          <span style={{ color: '#c2a1ab' }}>·</span>
          <button onClick={() => navigate('/admin')} style={S.footerAdmin}>
            🔒 Administrator
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ── Inline styles ── */
const S = {
  header: {
    position: 'sticky', top: 0, zIndex: 50,
    padding: '12px 28px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'rgba(254,242,244,0.6)',
    backdropFilter: 'saturate(180%) blur(28px)',
    WebkitBackdropFilter: 'saturate(180%) blur(28px)',
    borderBottom: '1px solid rgba(255,255,255,0.4)',
  },
  logoWrap: {
    display: 'flex', alignItems: 'center', gap: 10,
    cursor: 'pointer', border: 'none', background: 'transparent',
    outline: 'none', fontFamily: 'inherit', padding: 0,
  },
  logoIcon: {
    width: 36, height: 36, borderRadius: 12,
    background: 'linear-gradient(135deg, #ff6b8a 0%, #e8446a 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 17,
    boxShadow: '0 4px 16px rgba(232,68,106,0.35)',
  },
  logoLabel: {
    fontWeight: 800, fontSize: 20, color: '#1d1017', letterSpacing: '-0.04em',
  },
  hero: {
    textAlign: 'center', padding: '56px 16px 32px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
  },
  heroTitle: {
    fontSize: 'clamp(34px, 5.5vw, 62px)',
    fontWeight: 800, color: '#1d1017', lineHeight: 1.08, letterSpacing: '-0.04em',
  },
  heroSub: { fontSize: 15, color: '#6b4f58', lineHeight: 1.7, maxWidth: 440 },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 14,
  },
  featureCard: {
    padding: '26px 22px',
    display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start',
  },
  featureEmoji: {
    width: 42, height: 42, borderRadius: 13,
    background: 'rgba(255,255,255,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20,
    border: '1px solid rgba(255,255,255,0.7)',
    boxShadow: '0 2px 8px rgba(140,60,80,0.04)',
  },
  footer: {
    textAlign: 'center', padding: '20px',
    fontSize: 11, color: '#a38890',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
  },
  footerAdmin: {
    fontSize: 10.5, color: '#a38890', background: 'none',
    border: 'none', cursor: 'pointer', opacity: 0.6,
    textDecoration: 'underline', fontFamily: 'inherit',
  },
};
