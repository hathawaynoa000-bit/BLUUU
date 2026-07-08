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

  // ─── Theme: Light / AMOLED Dark ───
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      className="btn-glass"
      style={{
        padding: '6px 12px',
        fontSize: 12.5,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        border: '1px solid var(--glass-border)',
        cursor: 'pointer',
        background: 'var(--glass-bg)',
        color: 'var(--text-primary)',
        transition: 'all 0.2s',
        outline: 'none',
        fontWeight: 700,
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}
      title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
    >
      <span>{theme === 'light' ? '🌙' : '☀️'}</span>
      <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
    </button>
  );

  const handleConnectionReady = (data) => setConnectionData(data);

  const [remoteCamEnabled, setRemoteCamEnabled] = useState(true);
  const [remoteMicEnabled, setRemoteMicEnabled] = useState(true);

  // Reset remote states on disconnect/mode change
  useEffect(() => {
    if (mode === CONNECTION_MODES.NONE || connectionData?.connState !== 'connected') {
      setRemoteCamEnabled(true);
      setRemoteMicEnabled(true);
    }
  }, [mode, connectionData]);

  const handleDataReceived = (data) => {
    if (data.type === 'SHUTTER_TRIGGER') {
      setSyncShutterState('trigger');
      setTimeout(() => setSyncShutterState('idle'), 500);
    } else if (data.type === 'CAM_STATUS') {
      setRemoteCamEnabled(data.enabled);
    } else if (data.type === 'MIC_STATUS') {
      setRemoteMicEnabled(data.enabled);
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
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 100 }}>
          <ThemeToggle />
        </div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ThemeToggle />
            <span className="pill pill-pink">📖 About</span>
          </div>
        </header>
        <main className="main-content" style={{ maxWidth: 1040 }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ThemeToggle />
            <span className="pill pill-pink">🔒 Admin</span>
          </div>
        </header>
        <main className="main-content" style={{ maxWidth: 1040 }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ThemeToggle />
          {mode !== CONNECTION_MODES.NONE && (
            <span className="pill pill-pink">Tools LDR</span>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="main-content">

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
                remoteCamEnabled={remoteCamEnabled}
                remoteMicEnabled={remoteMicEnabled}
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
    background: 'var(--header-bg)',
    backdropFilter: 'saturate(180%) blur(28px)',
    WebkitBackdropFilter: 'saturate(180%) blur(28px)',
    borderBottom: '1.5px solid var(--header-border)',
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
    fontWeight: 800, fontSize: 20, color: 'var(--text-primary)', letterSpacing: '-0.04em',
  },
  hero: {
    textAlign: 'center', padding: '56px 16px 32px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
  },
  heroTitle: {
    fontSize: 'clamp(34px, 5.5vw, 62px)',
    fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.08, letterSpacing: '-0.04em',
  },
  heroSub: { fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 440 },
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
    background: 'var(--glass-bg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20,
    border: '1px solid var(--glass-border)',
    boxShadow: '0 2px 8px rgba(140,60,80,0.04)',
  },
  footer: {
    textAlign: 'center', padding: '20px',
    fontSize: 11, color: 'var(--text-tertiary)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
  },
  footerAdmin: {
    fontSize: 10.5, color: 'var(--text-tertiary)', background: 'none',
    border: 'none', cursor: 'pointer', opacity: 0.6,
    textDecoration: 'underline', fontFamily: 'inherit',
  },
};
