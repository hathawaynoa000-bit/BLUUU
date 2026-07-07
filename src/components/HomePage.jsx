import React, { useEffect, useRef, useState } from 'react';

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  emoji: ['💗','✨','🌸','💕','⭐','💫','🌷','💖'][i % 8],
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 14 + Math.random() * 18,
  dur: 6 + Math.random() * 8,
  delay: Math.random() * 6,
}));

export default function HomePage({ onStart }) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleStart = () => {
    document.documentElement.classList.add('page-exit');
    setTimeout(() => {
      document.documentElement.classList.remove('page-exit');
      onStart();
    }, 420);
  };

  return (
    <div style={S.root}>
      {/* Animated particles */}
      <div style={S.particles} aria-hidden="true">
        {PARTICLES.map(p => (
          <span
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              fontSize: p.size,
              opacity: 0.22,
              animation: `floatUp ${p.dur}s ease-in-out ${p.delay}s infinite alternate`,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {p.emoji}
          </span>
        ))}
      </div>

      {/* Center content */}
      <div style={{
        ...S.card,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.96)',
        transition: 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* Logo orb */}
        <div style={S.logoOrb}>
          <span style={{ fontSize: 48 }}>💖</span>
          <div style={S.logoGlow} />
        </div>

        {/* Brand */}
        <div style={S.brandWrap}>
          <div style={S.brandTag}>✨ Couple Experience</div>
          <h1 style={S.title}>BLUUU <span style={S.v3}>V3</span></h1>
          <p style={S.subtitle}>
            Photobooth virtual .<br />
            Take the moment .
          </p>
        </div>

        {/* Feature pills */}
        <div style={S.featurePills}>
          {[
            { icon: '📸', label: 'Photobooth' },
            { icon: '📡', label: 'Real-Time Photobooth' },
            { icon: '💬', label: 'Couple Games' },
            { icon: '🔒', label: 'Private Room' },
          ].map(f => (
            <div key={f.label} style={S.pill}>
              <span>{f.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600 }}>{f.label}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={handleStart}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            ...S.ctaBtn,
            transform: hovered ? 'translateY(-3px) scale(1.03)' : 'translateY(0) scale(1)',
            boxShadow: hovered
              ? '0 20px 50px rgba(232,68,106,0.55), 0 0.5px 0 rgba(255,255,255,0.4) inset'
              : '0 10px 30px rgba(232,68,106,0.4), 0 0.5px 0 rgba(255,255,255,0.4) inset',
          }}
        >
          <span style={{ fontSize: 20 }}>💕</span>
          <span>Let's Date</span>
          <span style={{ fontSize: 18, marginLeft: 4 }}>→</span>
        </button>

        {/* Bottom note */}
        <p style={S.note}>Lanjutan dari BLU-2</p>
      </div>

      {/* Footer link to admin/about */}
      <div style={S.footerBar}>
        <span style={S.footerText}>© 2026 BLUUU V3 · Build for R💖</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => {
            window.history.pushState({}, '', '/about');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }} style={S.adminLink}>📖 About</button>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>·</span>
          <button onClick={() => {
            window.history.pushState({}, '', '/admin');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }} style={S.adminLink}>🔒 Admin</button>
        </div>
      </div>

      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-28px) rotate(15deg); }
        }
        .page-exit { animation: exitAnim 0.42s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes exitAnim {
          0%   { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.96); }
        }
      `}</style>
    </div>
  );
}

const S = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    position: 'relative',
    overflow: 'hidden',
  },
  particles: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
  },
  card: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 28,
    textAlign: 'center',
    maxWidth: 520,
    width: '100%',
    background: 'rgba(255,255,255,0.22)',
    backdropFilter: 'saturate(220%) blur(40px)',
    WebkitBackdropFilter: 'saturate(220%) blur(40px)',
    border: '1.5px solid rgba(255,255,255,0.6)',
    borderRadius: 40,
    padding: '52px 40px 44px',
    boxShadow: '0 24px 80px rgba(232,68,106,0.14), 0 1px 0 rgba(255,255,255,0.85) inset',
  },
  logoOrb: {
    position: 'relative',
    width: 96,
    height: 96,
    background: 'linear-gradient(145deg, #ff9ab5 0%, #e8446a 50%, #c9184a 100%)',
    borderRadius: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 16px 40px rgba(232,68,106,0.45)',
    flexShrink: 0,
  },
  logoGlow: {
    position: 'absolute',
    inset: '-12px',
    background: 'radial-gradient(circle, rgba(232,68,106,0.3) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
    animation: 'pulse 3s ease-in-out infinite',
  },
  brandWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  brandTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 14px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    background: 'rgba(232,68,106,0.1)',
    border: '1px solid rgba(232,68,106,0.22)',
    color: '#c9184a',
  },
  title: {
    fontSize: 'clamp(48px, 10vw, 80px)',
    fontWeight: 900,
    letterSpacing: '-0.05em',
    color: '#1d1017',
    lineHeight: 1,
  },
  v3: {
    background: 'linear-gradient(135deg, #e8446a 0%, #ff6b8a 50%, #ff92a8 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    fontSize: 14.5,
    color: '#6b4f58',
    lineHeight: 1.75,
    fontWeight: 400,
    maxWidth: 380,
  },
  featurePills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.55)',
    border: '1px solid rgba(255,255,255,0.75)',
    backdropFilter: 'saturate(180%) blur(12px)',
    WebkitBackdropFilter: 'saturate(180%) blur(12px)',
    fontSize: 13,
    color: '#5a3c45',
    fontWeight: 500,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  ctaBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '16px 40px',
    borderRadius: 999,
    background: 'linear-gradient(180deg, #ff6b8a 0%, #e8446a 100%)',
    border: 'none',
    color: '#fff',
    fontSize: 18,
    fontWeight: 700,
    fontFamily: 'inherit',
    cursor: 'pointer',
    letterSpacing: '-0.02em',
    transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s cubic-bezier(0.16,1,0.3,1)',
  },
  note: {
    fontSize: 11.5,
    color: '#b08a95',
    fontWeight: 500,
    letterSpacing: '0.01em',
  },
  footerBar: {
    position: 'fixed',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    zIndex: 10,
    background: 'rgba(255,255,255,0.4)',
    backdropFilter: 'saturate(180%) blur(20px)',
    WebkitBackdropFilter: 'saturate(180%) blur(20px)',
    border: '1px solid rgba(255,255,255,0.65)',
    borderRadius: 999,
    padding: '8px 20px',
  },
  footerText: {
    fontSize: 11,
    color: '#9c7b85',
    fontWeight: 500,
  },
  adminLink: {
    fontSize: 11,
    color: '#9c7b85',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 600,
    opacity: 0.75,
    textDecoration: 'underline',
  },
};
