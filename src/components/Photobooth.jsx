import React, { useState, useEffect, useRef } from 'react';
import { API } from '../lib/api.js';

/* ─── Strip Templates definitions ─── */
const FRAMES = [
  {
    id: 'classic-pink',
    name: 'Classic Pink',
    emoji: '💗',
    preview: '#ffd4de',
    getHeaderHeight: () => 60,
    getFooterHeight: () => 60,
    getPadding: () => ({ top: 18, bottom: 18, left: 18, right: 18 }),
    getGap: () => 8,
    drawBg: (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#fff5f7');
      bg.addColorStop(1, '#ffd4de');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
    },
    drawPhotoFrame: (ctx, x, y, pw, ph) => {
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 6;
      ctx.strokeRect(x, y, pw, ph);
    },
    drawHeader: (ctx, w, h, coupleName) => {
      ctx.fillStyle = '#e8446a';
      ctx.font = 'bold 18px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`💗  ${coupleName.toUpperCase()}  💗`, w / 2, 42);
    },
    drawFooter: (ctx, w, h, coupleName) => {
      ctx.fillStyle = '#e8446a';
      ctx.font = 'bold 13px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`BLUUU V3`, w / 2, h - 34);
      ctx.font = '10px Poppins, sans-serif';
      ctx.fillStyle = '#a38890';
      ctx.fillText(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), w / 2, h - 16);
    }
  },
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    emoji: '🖤',
    preview: '#121212',
    getHeaderHeight: () => 50,
    getFooterHeight: () => 50,
    getPadding: () => ({ top: 15, bottom: 15, left: 20, right: 20 }),
    getGap: () => 10,
    drawBg: (ctx, w, h) => {
      ctx.fillStyle = '#121212';
      ctx.fillRect(0, 0, w, h);
    },
    drawPhotoFrame: (ctx, x, y, pw, ph) => {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, pw, ph);
    },
    drawHeader: (ctx, w, h, coupleName) => {
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 12px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`M O M E N T S  ·  ${coupleName.toUpperCase()}`, w / 2, 34);
    },
    drawFooter: (ctx, w, h, coupleName) => {
      ctx.fillStyle = '#888888';
      ctx.font = '9px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(), w / 2, h - 22);
    }
  },
  {
    id: 'newspaper',
    name: 'Newspaper',
    emoji: '📰',
    preview: '#f4ecd8',
    getHeaderHeight: () => 110,
    getFooterHeight: () => 60,
    getPadding: () => ({ top: 15, bottom: 15, left: 20, right: 20 }),
    getGap: () => 12,
    drawBg: (ctx, w, h) => {
      ctx.fillStyle = '#f4ecd8';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      for (let i = 40; i < h; i += 40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
      }
    },
    drawPhotoFrame: (ctx, x, y, pw, ph) => {
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, pw, ph);
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x - 4, y - 4, pw + 8, ph + 8);
    },
    drawHeader: (ctx, w, h, coupleName) => {
      ctx.fillStyle = '#111';
      ctx.textAlign = 'center';
      ctx.font = '900 24px Georgia, serif';
      ctx.fillText(coupleName.toUpperCase(), w / 2, 42);
      
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(15, 54); ctx.lineTo(w - 15, 54); ctx.stroke();
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(15, 58); ctx.lineTo(w - 15, 58); ctx.stroke();
      
      ctx.fillStyle = '#333';
      ctx.font = '800 9px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('EDISI SPESIAL', 20, 72);
      
      ctx.textAlign = 'right';
      ctx.fillText(new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase(), w - 20, 72);
      
      ctx.textAlign = 'center';
      ctx.font = 'italic 10px Georgia, serif';
      ctx.fillText('“Love story continues, beautiful person coming soon!”', w / 2, 92);
      
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(15, 102); ctx.lineTo(w - 15, 102); ctx.stroke();
    },
    drawFooter: (ctx, w, h, coupleName) => {
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(15, h - 48); ctx.lineTo(w - 15, h - 48); ctx.stroke();
      
      ctx.fillStyle = '#222';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('VOL. I  NO. 15', 20, h - 28);
      
      ctx.textAlign = 'right';
      ctx.fillText('BLUUU © 2026', w - 20, h - 28);
      
      ctx.fillStyle = '#111';
      ctx.fillRect(w / 2 - 20, h - 38, 3, 16);
      ctx.fillRect(w / 2 - 14, h - 38, 2, 16);
      ctx.fillRect(w / 2 - 10, h - 38, 4, 16);
      ctx.fillRect(w / 2 - 4, h - 38, 1, 16);
      ctx.fillRect(w / 2 - 1, h - 38, 3, 16);
      ctx.fillRect(w / 2 + 4, h - 38, 2, 16);
      ctx.fillRect(w / 2 + 8, h - 38, 4, 16);
      ctx.fillRect(w / 2 + 14, h - 38, 1, 16);
    }
  },
  {
    id: 'film-strip',
    name: 'Film Strip',
    emoji: '🎞️',
    preview: '#262626',
    getHeaderHeight: () => 50,
    getFooterHeight: () => 50,
    getPadding: () => ({ top: 10, bottom: 10, left: 45, right: 45 }),
    getGap: () => 14,
    drawBg: (ctx, w, h) => {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, w, h);
      
      ctx.fillStyle = '#0a0a0a';
      const holeW = 14;
      const holeH = 22;
      const step = 44;
      const r = 3;
      
      const drawHole = (x, y) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + holeW - r, y);
        ctx.quadraticCurveTo(x + holeW, y, x + holeW, y + r);
        ctx.lineTo(x + holeW, y + holeH - r);
        ctx.quadraticCurveTo(x + holeW, y + holeH, x + holeW - r, y + holeH);
        ctx.lineTo(x + r, y + holeH);
        ctx.quadraticCurveTo(x, y + holeH, x, y + holeH - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
      };

      for (let y = 15; y < h - 15; y += step) {
        drawHole(15, y);
        drawHole(w - 15 - holeW, y);
      }
    },
    drawPhotoFrame: (ctx, x, y, pw, ph) => {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 8;
      ctx.strokeRect(x, y, pw, ph);
    },
    drawHeader: (ctx, w, h, coupleName) => {
      ctx.fillStyle = '#999999';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`KODAK PORTRA 400  ·  ${coupleName.toUpperCase()}`, w / 2, 32);
    },
    drawFooter: (ctx, w, h, coupleName) => {
      ctx.fillStyle = '#999999';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`SAFETY FILM  ·  ${new Date().getFullYear()}`, w / 2, h - 22);
    }
  },
  {
    id: 'neon-glow',
    name: 'Neon Glow',
    emoji: '✨',
    preview: '#090d16',
    getHeaderHeight: () => 60,
    getFooterHeight: () => 50,
    getPadding: () => ({ top: 15, bottom: 15, left: 22, right: 22 }),
    getGap: () => 10,
    drawBg: (ctx, w, h) => {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);
    },
    drawPhotoFrame: (ctx, x, y, pw, ph) => {
      ctx.save();
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#ff007f';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, pw, ph);
      ctx.restore();
    },
    drawHeader: (ctx, w, h, coupleName) => {
      ctx.save();
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⚡  ${coupleName.toUpperCase()}  ⚡`, w / 2, 40);
      ctx.restore();
    },
    drawFooter: (ctx, w, h, coupleName) => {
      ctx.save();
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#ff007f';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`NEON LIGHTS`, w / 2, h - 22);
      ctx.restore();
    }
  },
  {
    id: 'vintage-brown',
    name: 'Vintage Brown',
    emoji: '🤎',
    preview: '#cfae8b',
    getHeaderHeight: () => 70,
    getFooterHeight: () => 56,
    getPadding: () => ({ top: 15, bottom: 15, left: 20, right: 20 }),
    getGap: () => 8,
    drawBg: (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#e8d3b9');
      bg.addColorStop(1, '#cfae8b');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#8b5a2b';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, w - 20, h - 20);
    },
    drawPhotoFrame: (ctx, x, y, pw, ph) => {
      ctx.strokeStyle = '#8b5a2b';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, pw, ph);
      
      const size = 12;
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(x - 2, y - 2, size, 2);
      ctx.fillRect(x - 2, y - 2, 2, size);
      ctx.fillRect(x + pw + 2 - size, y - 2, size, 2);
      ctx.fillRect(x + pw, y - 2, 2, size);
      ctx.fillRect(x - 2, y + ph, size, 2);
      ctx.fillRect(x - 2, y + ph + 2 - size, 2, size);
      ctx.fillRect(x + pw + 2 - size, y + ph, size, 2);
      ctx.fillRect(x + pw, y + ph + 2 - size, 2, size);
    },
    drawHeader: (ctx, w, h, coupleName) => {
      ctx.fillStyle = '#5c3a21';
      ctx.font = 'italic bold 20px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(coupleName, w / 2, 45);
    },
    drawFooter: (ctx, w, h, coupleName) => {
      ctx.fillStyle = '#5c3a21';
      ctx.font = '11px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), w / 2, h - 24);
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
  const [mirrorLocal, setMirrorLocal] = useState(true);
  const [mirrorRemote, setMirrorRemote] = useState(false);
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

    // Note: Frames are no longer drawn directly on the raw capture; 
    // instead they are generated dynamically during strip layout compilation!

    const src  = canvas.toDataURL('image/jpeg', 0.92);
    const next = [...currentCaptures, { src, frame: currentFrame.name, filter: currentFilter.name }].slice(-4);
    capturesRef.current = next;
    setCaptures(next);
    if (next.length === 4) buildStrip(next);
  };

  const buildStrip = (shots) => {
    const W = 420;
    const currentFrame = frameRef.current;

    const pad = currentFrame.getPadding();
    const gap = currentFrame.getGap();
    const headH = currentFrame.getHeaderHeight();
    const footH = currentFrame.getFooterHeight();

    const pw = W - pad.left - pad.right;
    const ph = Math.round(pw * 0.74); // 4:3 landscape ratio

    const H = pad.top + headH + (ph * 4) + (gap * 3) + footH + pad.bottom;

    const canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Draw background
    currentFrame.drawBg(ctx, W, H);

    // Draw header
    currentFrame.drawHeader(ctx, W, H, coupleNamesRef.current || 'Kita');

    let loaded = 0;
    shots.forEach((s, i) => {
      const img = new Image();
      img.onload = () => {
        const y = pad.top + headH + i * (ph + gap);
        const x = pad.left;

        ctx.save();
        // Clip with rounded corners (Classic Pink and Vintage templates only)
        if (currentFrame.id === 'classic-pink' || currentFrame.id === 'vintage-brown') {
          const cr = 8;
          ctx.beginPath();
          ctx.moveTo(x + cr, y); ctx.lineTo(x + pw - cr, y);
          ctx.quadraticCurveTo(x + pw, y, x + pw, y + cr);
          ctx.lineTo(x + pw, y + ph - cr); ctx.quadraticCurveTo(x + pw, y + ph, x + pw - cr, y + ph);
          ctx.lineTo(x + cr, y + ph); ctx.quadraticCurveTo(x, y + ph, x, y + ph - cr);
          ctx.lineTo(x, y + cr); ctx.quadraticCurveTo(x, y, x + cr, y);
          ctx.closePath(); ctx.clip();
        }

        ctx.drawImage(img, x, y, pw, ph);
        ctx.restore();

        // Draw photo border/deco on top
        currentFrame.drawPhotoFrame(ctx, x, y, pw, ph);

        loaded++;
        if (loaded === 4) {
          // Draw footer
          currentFrame.drawFooter(ctx, W, H, coupleNamesRef.current || 'Kita');

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
          <div className="video-viewport" style={{ position: 'relative' }}>
            <video
              ref={localVideoRef}
              muted
              autoPlay
              playsInline
              style={{ filter: filter.css || undefined, transform: mirrorLocal ? 'scaleX(-1)' : 'none' }}
            />
            <button
              type="button"
              className="mirror-toggle-btn"
              onClick={() => setMirrorLocal(p => !p)}
              title="Balik Kiri/Kanan"
            >
              ↔️
            </button>
            <div className="video-tag"><div className="dot dot-green" /> Kamu</div>
          </div>
          {remoteStream && (
            <div className="video-viewport" style={{ position: 'relative' }}>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{ filter: filter.css || undefined, transform: mirrorRemote ? 'scaleX(-1)' : 'none' }}
              />
              <button
                type="button"
                className="mirror-toggle-btn"
                onClick={() => setMirrorRemote(p => !p)}
                title="Balik Kiri/Kanan"
              >
                ↔️
              </button>
              <div className="video-tag"><div className="dot dot-pink" /> Pasangan</div>
            </div>
          )}
        </div>

        {/* Strip Templates */}
        <div>
          <div style={labelStyle}>Strip Template</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
            {FRAMES.map(f => (
              <button key={f.id} onClick={() => setFrame(f)} style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 16,
                border: `1.5px solid ${frame.id === f.id ? 'var(--accent)' : 'rgba(255,255,255,0.45)'}`,
                background: frame.id === f.id ? 'rgba(232,68,106,0.06)' : 'rgba(255,255,255,0.25)',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.25s',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: f.preview,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, border: '1px solid rgba(0,0,0,0.08)'
                }}>
                  {f.emoji}
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: frame.id === f.id ? 'var(--accent-dark)' : 'var(--text-primary)' }}>{f.name}</span>
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
