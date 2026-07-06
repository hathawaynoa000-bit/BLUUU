import React, { useState, useEffect, useRef } from 'react';

const API = '/api';

/* ─── Frame definitions ─── */
const FRAMES = [
  {
    id: 'pink-glass', name: 'Pink Glass', emoji: '💗',
    draw: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, 'rgba(255,140,165,0.8)');
      g.addColorStop(0.5, 'rgba(255,200,215,0.65)');
      g.addColorStop(1, 'rgba(255,100,140,0.8)');
      ctx.save(); ctx.fillStyle = g;
      const b = 24;
      ctx.fillRect(0,0,w,b); ctx.fillRect(0,h-b,w,b);
      ctx.fillRect(0,0,b,h); ctx.fillRect(w-b,0,b,h);
      ctx.font = '18px serif'; ctx.fillStyle = '#ff4d6d';
      ctx.fillText('💗', 6, 22); ctx.fillText('💗', w-28, 22);
      ctx.fillText('💗', 6, h-6); ctx.fillText('💗', w-28, h-6);
      ctx.restore();
    }
  },
  {
    id: 'film-strip', name: 'Film Strip', emoji: '🎞️',
    draw: (ctx, w, h) => {
      ctx.save(); ctx.fillStyle = '#1a0a0e';
      ctx.fillRect(0,0,w,36); ctx.fillRect(0,h-36,w,36);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 8; i++) {
        const x = (i/8)*w + (w/16) - 10;
        ctx.fillRect(x,8,20,20); ctx.fillRect(x,h-28,20,20);
      }
      ctx.restore();
    }
  },
  {
    id: 'polaroid', name: 'Polaroid', emoji: '📷',
    draw: (ctx, w, h) => {
      ctx.save(); ctx.fillStyle = '#fff';
      ctx.fillRect(0,0,w,16); ctx.fillRect(0,0,16,h);
      ctx.fillRect(w-16,0,16,h); ctx.fillRect(0,h-52,w,52);
      ctx.fillStyle = '#1d1017'; ctx.font = 'bold 14px Poppins,sans-serif';
      ctx.textAlign = 'center'; ctx.fillText('💖 Our Moment 💖', w/2, h-26);
      ctx.textAlign = 'start'; ctx.restore();
    }
  },
  {
    id: 'floral', name: 'Floral', emoji: '🌸',
    draw: (ctx, w, h) => {
      ctx.save(); ctx.fillStyle = 'rgba(255,220,230,0.55)';
      ctx.fillRect(0,0,w,32); ctx.fillRect(0,h-32,w,32);
      ctx.fillRect(0,0,32,h); ctx.fillRect(w-32,0,32,h);
      const f = ['🌸','🌺','🌷'];
      [[8,26],[w-30,26],[8,h-8],[w-30,h-8],[w/2-10,24],[w/2-10,h-8]].forEach(([x,y],i) => {
        ctx.font = '18px serif'; ctx.fillText(f[i%3], x, y);
      });
      ctx.restore();
    }
  },
  {
    id: 'gold', name: 'Gold Deco', emoji: '✨',
    draw: (ctx, w, h) => {
      ctx.save();
      const g = ctx.createLinearGradient(0,0,w,0);
      g.addColorStop(0,'#b8860b'); g.addColorStop(0.3,'#ffd700');
      g.addColorStop(0.5,'#fffacd'); g.addColorStop(0.7,'#ffd700');
      g.addColorStop(1,'#b8860b');
      ctx.fillStyle = g;
      const b = 20;
      ctx.fillRect(0,0,w,b); ctx.fillRect(0,h-b,w,b);
      ctx.fillRect(0,0,b,h); ctx.fillRect(w-b,0,b,h);
      ctx.restore();
    }
  },
];

const FILTERS = [
  { id: 'none',    name: 'Normal',  css: '' },
  { id: 'warm',    name: 'Warm',    css: 'sepia(0.4) saturate(1.3) hue-rotate(-10deg)' },
  { id: 'cool',    name: 'Cool',    css: 'hue-rotate(200deg) saturate(0.9) brightness(1.05)' },
  { id: 'vintage', name: 'Vintage', css: 'sepia(0.7) contrast(1.1) brightness(0.9)' },
  { id: 'rosy',    name: 'Rosy',    css: 'saturate(1.5) hue-rotate(-20deg) brightness(1.1)' },
  { id: 'mono',    name: 'B&W',     css: 'grayscale(1) contrast(1.2)' },
];

function playShutter() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.setValueAtTime(1200, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.12);
  } catch (_) {}
}

export default function Photobooth({ connectionData, syncShutterState, triggerSyncCapture }) {
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const flashRef       = useRef(null);
  const shootingRef    = useRef(false);

  // Own local stream — started directly, not relying on connectionData timing
  const [localStream,  setLocalStream]  = useState(null);
  const [cameraError,  setCameraError]  = useState('');

  const [frame,    setFrame]    = useState(FRAMES[0]);
  const [filter,   setFilter]   = useState(FILTERS[0]);
  const [captures, setCaptures] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [shooting,  setShooting]  = useState(false);
  const [strip,     setStrip]     = useState(null);
  const [preview,   setPreview]   = useState(null);
  const [coupleNames, setCoupleNames] = useState('Kita');
  const [gallery,   setGallery]   = useState([]);
  const [uploading, setUploading] = useState(false);

  // Keep mutable refs for use inside async countdown
  const frameRef       = useRef(FRAMES[0]);
  const filterRef      = useRef(FILTERS[0]);
  const capturesRef    = useRef([]);
  const coupleNamesRef = useRef('Kita');
  useEffect(() => { frameRef.current = frame; },             [frame]);
  useEffect(() => { filterRef.current = filter; },           [filter]);
  useEffect(() => { capturesRef.current = captures; },       [captures]);
  useEffect(() => { coupleNamesRef.current = coupleNames; }, [coupleNames]);

  // Remote stream from WebRTC (via connectionData)
  const remoteStream = connectionData?.remoteStream;
  const roomCode     = connectionData?.roomCode;

  // ─── Start camera directly in this component ────────────────────────────
  useEffect(() => {
    let active = true;
    const startCam = async () => {
      // Try video+audio, then video only
      for (const constraints of [
        { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: false },
        { video: true, audio: false },
      ]) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
          setLocalStream(stream);
          setCameraError('');
          return;
        } catch (_) {}
      }
      if (active) setCameraError('Gagal mengakses kamera. Pastikan izin kamera diberikan di browser.');
    };
    startCam();
    return () => {
      active = false;
    };
  }, []);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      localStream?.getTracks().forEach(t => t.stop());
    };
  }, [localStream]);

  // ─── Assign streams to video elements ───────────────────────────────────
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  // ─── Sync shutter from remote ────────────────────────────────────────────
  useEffect(() => {
    if (syncShutterState === 'trigger' && !shootingRef.current) doCountdown(false);
  }, [syncShutterState]);

  // ─── Gallery ─────────────────────────────────────────────────────────────
  const fetchGallery = async () => {
    if (!roomCode) return;
    try {
      const res = await fetch(`${API}/photos/room/${roomCode}`);
      if (res.ok) setGallery(await res.json());
    } catch (_) {}
  };
  useEffect(() => { fetchGallery(); }, [roomCode]);

  // ─── Countdown & capture ─────────────────────────────────────────────────
  const doCountdown = async (broadcast = false) => {
    if (shootingRef.current) return;
    shootingRef.current = true;
    setShooting(true);
    if (broadcast) triggerSyncCapture?.();
    for (let i = 3; i >= 1; i--) {
      setCountdown(i);
      await new Promise(r => setTimeout(r, 1000));
    }
    setCountdown('📸');
    await new Promise(r => setTimeout(r, 350));
    setCountdown(null);
    doCapture();
    shootingRef.current = false;
    setShooting(false);
  };

  const doCapture = () => {
    const currentFrame    = frameRef.current;
    const currentFilter   = filterRef.current;
    const currentCaptures = capturesRef.current;

    // Flash effect
    playShutter();
    if (flashRef.current) {
      flashRef.current.classList.add('fire');
      setTimeout(() => flashRef.current?.classList.remove('fire'), 500);
    }

    const v = localVideoRef.current;
    if (!v) return;

    const W = v.videoWidth  > 0 ? v.videoWidth  : 640;
    const H = v.videoHeight > 0 ? v.videoHeight : 480;

    const canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Apply filter
    if (currentFilter.css) ctx.filter = currentFilter.css;

    // Mirror (selfie style)
    ctx.save();
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0, W, H);
    ctx.restore();
    ctx.filter = 'none';

    // Frame overlay
    currentFrame.draw(ctx, W, H);

    const src  = canvas.toDataURL('image/jpeg', 0.92);
    const next = [...currentCaptures, { src, frame: currentFrame.name, filter: currentFilter.name }].slice(-4);
    capturesRef.current = next;
    setCaptures(next);
    if (next.length === 4) buildStrip(next);
  };

  const buildStrip = (shots) => {
    const W = 420, PH = 310, gap = 8, pad = 18, foot = 56;
    const H = PH * 4 + gap * 3 + pad * 2 + foot;
    const canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#fff5f7');
    bg.addColorStop(1, '#ffd4de');
    ctx.fillStyle = bg;
    // rounded rect polyfill
    const r = 16;
    ctx.beginPath();
    ctx.moveTo(r, 0); ctx.lineTo(W-r, 0); ctx.quadraticCurveTo(W, 0, W, r);
    ctx.lineTo(W, H-r); ctx.quadraticCurveTo(W, H, W-r, H);
    ctx.lineTo(r, H); ctx.quadraticCurveTo(0, H, 0, H-r);
    ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath(); ctx.fill();

    let loaded = 0;
    shots.forEach((s, i) => {
      const img = new Image();
      img.onload = () => {
        const y = pad + i * (PH + gap);
        ctx.save();
        // clip with rounded corners (polyfill)
        const cr = 8;
        ctx.beginPath();
        ctx.moveTo(pad + cr, y); ctx.lineTo(W - pad - cr, y);
        ctx.quadraticCurveTo(W - pad, y, W - pad, y + cr);
        ctx.lineTo(W - pad, y + PH - cr); ctx.quadraticCurveTo(W - pad, y + PH, W - pad - cr, y + PH);
        ctx.lineTo(pad + cr, y + PH); ctx.quadraticCurveTo(pad, y + PH, pad, y + PH - cr);
        ctx.lineTo(pad, y + cr); ctx.quadraticCurveTo(pad, y, pad + cr, y);
        ctx.closePath(); ctx.clip();
        ctx.drawImage(img, pad, y, W - pad * 2, PH);
        ctx.restore();

        loaded++;
        if (loaded === 4) {
          // Footer text
          ctx.fillStyle = '#e8446a';
          ctx.font = 'bold 16px Poppins,sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`💖 ${coupleNamesRef.current || 'BLUUU V3'}`, W / 2, H - 30);
          ctx.font = '11px Poppins,sans-serif';
          ctx.fillStyle = '#a38890';
          ctx.fillText(
            new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            W / 2, H - 12
          );
          const finalUrl = canvas.toDataURL('image/jpeg', 0.95);
          setStrip(finalUrl);
          if (roomCode) uploadPhoto(finalUrl);
        }
      };
      img.src = s.src;
    });
  };

  const uploadPhoto = async (photoData) => {
    setUploading(true);
    try {
      const res = await fetch(`${API}/photos/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, photoData, coupleNames: coupleNamesRef.current || 'Kita' }),
      });
      if (res.ok) fetchGallery();
    } catch (_) {}
    finally { setUploading(false); }
  };

  const download = () => {
    if (!strip) return;
    const a = document.createElement('a');
    a.href = strip;
    a.download = `${coupleNamesRef.current || 'bluuu'}-${Date.now()}.jpg`;
    a.click();
  };

  const isRemote = connectionData?.isRemote;
  const isConnected = connectionData?.connState === 'connected';
  const canShoot = !!localStream && !shooting && (!isRemote || isConnected);

  /* ─── RENDER ─── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="glass" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18, position: 'relative' }}>

        {/* Flash overlay */}
        <div className="flash" ref={flashRef} />

        {/* Countdown overlay */}
        {countdown !== null && (
          <div className="cd-overlay">
            <div className="cd-num">{countdown}</div>
            <div className="cd-label">Bersiap-siap! 💕</div>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              📸 Photo Booth
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
              {captures.length}/4 foto
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {strip && <button className="btn btn-accent btn-sm" onClick={download}>⬇ Unduh Strip</button>}
            {captures.length > 0 && (
              <button className="btn btn-outline btn-sm" onClick={() => { setCaptures([]); capturesRef.current = []; setStrip(null); }}>
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Camera error */}
        {cameraError && <div className="notice notice-error">{cameraError}</div>}

        {/* Couple names */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={labelStyle}>Nama Pada Footer Strip</label>
          <input
            className="field"
            placeholder="Contoh: Rian & Aulia"
            value={coupleNames}
            onChange={e => setCoupleNames(e.target.value)}
            style={{ padding: '8px 12px', fontSize: 12.5 }}
          />
        </div>

        {/* Video feeds */}
        <div style={{ display: 'grid', gridTemplateColumns: remoteStream ? '1fr 1fr' : '1fr', gap: 10 }}>
          <div className="video-viewport">
            <video
              ref={localVideoRef}
              muted
              autoPlay
              playsInline
              style={{ filter: filter.css || undefined, transform: 'scaleX(-1)' }}
            />
            <div className="video-tag"><div className="dot dot-green" /> Kamu</div>
          </div>
          {remoteStream && (
            <div className="video-viewport">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{ filter: filter.css || undefined }}
              />
              <div className="video-tag"><div className="dot dot-pink" /> Pasangan</div>
            </div>
          )}
        </div>

        {/* Frames */}
        <div>
          <div style={labelStyle}>Frame</div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {FRAMES.map(f => (
              <button key={f.id} onClick={() => setFrame(f)} style={{
                flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                padding: '8px 12px', borderRadius: 14,
                border: `1.5px solid ${frame.id === f.id ? 'var(--accent)' : 'rgba(255,255,255,0.45)'}`,
                background: frame.id === f.id ? 'rgba(232,68,106,0.08)' : 'rgba(255,255,255,0.25)',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.25s',
              }}>
                <span style={{ fontSize: 20 }}>{f.emoji}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: frame.id === f.id ? 'var(--accent-dark)' : 'var(--text-tertiary)' }}>{f.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div>
          <div style={labelStyle}>Filter</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilter(f)} style={{
                padding: '5px 14px', borderRadius: 999,
                border: `1.5px solid ${filter.id === f.id ? 'var(--accent)' : 'rgba(255,255,255,0.4)'}`,
                background: filter.id === f.id ? 'linear-gradient(180deg,#ff6b8a,#e8446a)' : 'rgba(255,255,255,0.25)',
                color: filter.id === f.id ? '#fff' : 'var(--text-tertiary)',
                fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.25s',
              }}>{f.name}</button>
            ))}
          </div>
        </div>

        {/* Shutter button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '4px 0' }}>
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            {canShoot && (
              <div 
                className="shutter-ring" 
                style={{ pointerEvents: 'none', zIndex: 1 }} 
              />
            )}
            <button
              id="shutter-btn"
              onClick={() => {
                console.log('[Photobooth] Shutter button clicked! Starting countdown...');
                doCountdown(true);
              }}
              disabled={!canShoot}
              title={!localStream ? 'Menunggu kamera...' : 'Ambil foto!'}
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: canShoot
                  ? 'linear-gradient(180deg, #ff6b8a 0%, #e8446a 100%)'
                  : 'rgba(180,160,165,0.5)',
                border: '4px solid rgba(255,255,255,0.7)',
                boxShadow: canShoot ? '0 8px 28px rgba(232,68,106,0.45)' : 'none',
                cursor: canShoot ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                transition: 'all 0.3s',
                outline: 'none',
                position: 'relative',
                zIndex: 5, // Sits on top of the ring
              }}
            >
              {shooting ? '⏳' : localStream ? '📸' : '⏸'}
            </button>
          </div>
          <div style={{
            fontSize: 11, fontWeight: 600,
            color: canShoot ? 'var(--text-quaternary)' : 'var(--accent)',
            textAlign: 'center',
          }}>
            {!localStream
              ? '⏳ Menunggu izin kamera...'
              : isRemote && !isConnected
              ? '⚠️ Sambungkan kamar privat untuk mulai berfoto'
              : shooting
              ? '⏳ Mengambil foto...'
              : `${4 - captures.length} foto tersisa · tekan untuk mulai`}
          </div>
        </div>

        {/* Thumbnails */}
        {captures.length > 0 && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
            {captures.map((c, i) => (
              <div key={i} className="thumb" onClick={() => setPreview(c.src)}>
                <img src={c.src} alt={`Foto ${i+1}`} />
                <div className="thumb-num">#{i+1}</div>
              </div>
            ))}
            {Array.from({ length: 4 - captures.length }).map((_, i) => (
              <div key={`e${i}`} className="thumb-empty">+</div>
            ))}
          </div>
        )}

        {/* Strip preview */}
        {strip && (
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: 14, display: 'flex', gap: 14, alignItems: 'center' }}>
            <img src={strip} alt="Strip" onClick={() => setPreview(strip)}
              style={{ width: 70, borderRadius: 10, border: '1px solid rgba(255,255,255,0.5)', cursor: 'pointer' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 3 }}>
                🎉 Strip Selesai!
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                {uploading ? '⬆️ Mengunggah ke galeri...' : '4 foto terabadikan. Klik untuk preview.'}
              </div>
            </div>
          </div>
        )}

        {/* Preview modal */}
        {preview && (
          <div className="overlay" onClick={() => setPreview(null)}>
            <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
              <img src={preview} alt="Preview"
                style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 20, boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }} />
              <button onClick={() => setPreview(null)} style={{
                position: 'absolute', top: -12, right: -12,
                width: 32, height: 32, borderRadius: '50%',
                border: 'none', background: '#fff', fontSize: 16,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}>✕</button>
            </div>
          </div>
        )}
      </div>

      {/* Gallery */}
      {roomCode && gallery.length > 0 && (
        <div className="glass" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            🌸 Galeri Foto Kamar ({gallery.length})
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
            {gallery.map(g => (
              <div key={g.id} onClick={() => setPreview(g.photo_data)} style={{
                width: 76, flexShrink: 0, aspectRatio: '1/3',
                borderRadius: 10, overflow: 'hidden',
                border: '1.5px solid rgba(255,255,255,0.6)',
                cursor: 'pointer', position: 'relative',
                boxShadow: '0 4px 12px rgba(140,60,80,0.06)',
              }}>
                <img src={g.photo_data} alt="Strip"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  fontSize: 10, color: 'var(--text-tertiary)',
  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
};
