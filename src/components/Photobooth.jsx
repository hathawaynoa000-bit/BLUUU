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
    drawPhotoFrame: (ctx, x, y, pw, ph, scale = 1) => {
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = Math.round(6 * scale);
      ctx.strokeRect(x, y, pw, ph);
    },
    drawHeader: (ctx, w, h, coupleName, scale = 1) => {
      ctx.fillStyle = '#e8446a';
      ctx.font = `bold ${Math.round(18 * scale)}px Poppins, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`💗  ${coupleName.toUpperCase()}  💗`, w / 2, Math.round(42 * scale));
    },
    drawFooter: (ctx, w, h, coupleName, scale = 1) => {
      ctx.fillStyle = '#e8446a';
      ctx.font = `bold ${Math.round(13 * scale)}px Poppins, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`BLUUU V3`, w / 2, h - Math.round(34 * scale));
      ctx.font = `${Math.round(10 * scale)}px Poppins, sans-serif`;
      ctx.fillStyle = '#a38890';
      ctx.fillText(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), w / 2, h - Math.round(16 * scale));
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
    drawPhotoFrame: (ctx, x, y, pw, ph, scale = 1) => {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = Math.round(2 * scale);
      ctx.strokeRect(x, y, pw, ph);
    },
    drawHeader: (ctx, w, h, coupleName, scale = 1) => {
      ctx.fillStyle = '#ffffff';
      ctx.font = `600 ${Math.round(12 * scale)}px Poppins, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`M O M E N T S  ·  ${coupleName.toUpperCase()}`, w / 2, Math.round(34 * scale));
    },
    drawFooter: (ctx, w, h, coupleName, scale = 1) => {
      ctx.fillStyle = '#888888';
      ctx.font = `${Math.round(9 * scale)}px Poppins, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(), w / 2, h - Math.round(22 * scale));
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
    drawBg: (ctx, w, h, scale = 1) => {
      ctx.fillStyle = '#f4ecd8';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = Math.round(1 * scale);
      const step = Math.round(40 * scale);
      for (let i = step; i < h; i += step) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
      }
    },
    drawPhotoFrame: (ctx, x, y, pw, ph, scale = 1) => {
      ctx.strokeStyle = '#222';
      ctx.lineWidth = Math.round(2 * scale);
      ctx.strokeRect(x, y, pw, ph);
      ctx.strokeStyle = '#222';
      ctx.lineWidth = Math.round(0.5 * scale);
      ctx.strokeRect(x - Math.round(4 * scale), y - Math.round(4 * scale), pw + Math.round(8 * scale), ph + Math.round(8 * scale));
    },
    drawHeader: (ctx, w, h, coupleName, scale = 1) => {
      ctx.fillStyle = '#111';
      ctx.textAlign = 'center';
      ctx.font = `900 ${Math.round(24 * scale)}px Georgia, serif`;
      ctx.fillText(coupleName.toUpperCase(), w / 2, Math.round(42 * scale));
      
      ctx.strokeStyle = '#111';
      ctx.lineWidth = Math.round(2 * scale);
      ctx.beginPath(); ctx.moveTo(Math.round(15 * scale), Math.round(54 * scale)); ctx.lineTo(w - Math.round(15 * scale), Math.round(54 * scale)); ctx.stroke();
      ctx.lineWidth = Math.round(0.8 * scale);
      ctx.beginPath(); ctx.moveTo(Math.round(15 * scale), Math.round(58 * scale)); ctx.lineTo(w - Math.round(15 * scale), Math.round(58 * scale)); ctx.stroke();
      
      ctx.fillStyle = '#333';
      ctx.font = `800 ${Math.round(9 * scale)}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText('EDISI SPESIAL', Math.round(20 * scale), Math.round(72 * scale));
      
      ctx.textAlign = 'right';
      ctx.fillText(new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase(), w - Math.round(20 * scale), Math.round(72 * scale));
      
      ctx.textAlign = 'center';
      ctx.font = `italic ${Math.round(10 * scale)}px Georgia, serif`;
      ctx.fillText('“Love story continues, beautiful person coming soon!”', w / 2, Math.round(92 * scale));
      
      ctx.strokeStyle = '#111';
      ctx.lineWidth = Math.round(0.8 * scale);
      ctx.beginPath(); ctx.moveTo(Math.round(15 * scale), Math.round(102 * scale)); ctx.lineTo(w - Math.round(15 * scale), Math.round(102 * scale)); ctx.stroke();
    },
    drawFooter: (ctx, w, h, coupleName, scale = 1) => {
      ctx.strokeStyle = '#111';
      ctx.lineWidth = Math.round(1 * scale);
      ctx.beginPath(); ctx.moveTo(Math.round(15 * scale), h - Math.round(48 * scale)); ctx.lineTo(w - Math.round(15 * scale), h - Math.round(48 * scale)); ctx.stroke();
      
      ctx.fillStyle = '#222';
      ctx.font = `bold ${Math.round(9 * scale)}px monospace`;
      ctx.textAlign = 'left';
      ctx.fillText('VOL. I  NO. 15', Math.round(20 * scale), h - Math.round(28 * scale));
      
      ctx.textAlign = 'right';
      ctx.fillText('BLUUU © 2026', w - Math.round(20 * scale), h - Math.round(28 * scale));
      
      ctx.fillStyle = '#111';
      const barW = Math.round(scale);
      ctx.fillRect(w / 2 - Math.round(20 * scale), h - Math.round(38 * scale), 3 * barW, Math.round(16 * scale));
      ctx.fillRect(w / 2 - Math.round(14 * scale), h - Math.round(38 * scale), 2 * barW, Math.round(16 * scale));
      ctx.fillRect(w / 2 - Math.round(10 * scale), h - Math.round(38 * scale), 4 * barW, Math.round(16 * scale));
      ctx.fillRect(w / 2 - Math.round(4 * scale), h - Math.round(38 * scale), 1 * barW, Math.round(16 * scale));
      ctx.fillRect(w / 2 - Math.round(1 * scale), h - Math.round(38 * scale), 3 * barW, Math.round(16 * scale));
      ctx.fillRect(w / 2 + Math.round(4 * scale), h - Math.round(38 * scale), 2 * barW, Math.round(16 * scale));
      ctx.fillRect(w / 2 + Math.round(8 * scale), h - Math.round(38 * scale), 4 * barW, Math.round(16 * scale));
      ctx.fillRect(w / 2 + Math.round(14 * scale), h - Math.round(38 * scale), 1 * barW, Math.round(16 * scale));
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
    drawBg: (ctx, w, h, scale = 1) => {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, w, h);
      
      ctx.fillStyle = '#0a0a0a';
      const holeW = Math.round(14 * scale);
      const holeH = Math.round(22 * scale);
      const step = Math.round(44 * scale);
      const r = Math.round(3 * scale);
      
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

      for (let y = Math.round(15 * scale); y < h - Math.round(15 * scale); y += step) {
        drawHole(Math.round(15 * scale), y);
        drawHole(w - Math.round(15 * scale) - holeW, y);
      }
    },
    drawPhotoFrame: (ctx, x, y, pw, ph, scale = 1) => {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.round(8 * scale);
      ctx.strokeRect(x, y, pw, ph);
    },
    drawHeader: (ctx, w, h, coupleName, scale = 1) => {
      ctx.fillStyle = '#999999';
      ctx.font = `bold ${Math.round(11 * scale)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(`KODAK PORTRA 400  ·  ${coupleName.toUpperCase()}`, w / 2, Math.round(32 * scale));
    },
    drawFooter: (ctx, w, h, coupleName, scale = 1) => {
      ctx.fillStyle = '#999999';
      ctx.font = `bold ${Math.round(10 * scale)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(`SAFETY FILM  ·  ${new Date().getFullYear()}`, w / 2, h - Math.round(22 * scale));
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
    drawPhotoFrame: (ctx, x, y, pw, ph, scale = 1) => {
      ctx.save();
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = Math.round(10 * scale);
      ctx.strokeStyle = '#ff007f';
      ctx.lineWidth = Math.round(3 * scale);
      ctx.strokeRect(x, y, pw, ph);
      ctx.restore();
    },
    drawHeader: (ctx, w, h, coupleName, scale = 1) => {
      ctx.save();
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = Math.round(8 * scale);
      ctx.fillStyle = '#00ffff';
      ctx.font = `bold ${Math.round(18 * scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`⚡  ${coupleName.toUpperCase()}  ⚡`, w / 2, Math.round(40 * scale));
      ctx.restore();
    },
    drawFooter: (ctx, w, h, coupleName, scale = 1) => {
      ctx.save();
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = Math.round(6 * scale);
      ctx.fillStyle = '#ff007f';
      ctx.font = `bold ${Math.round(12 * scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`NEON LIGHTS`, w / 2, h - Math.round(22 * scale));
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
    drawBg: (ctx, w, h, scale = 1) => {
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#e8d3b9');
      bg.addColorStop(1, '#cfae8b');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#8b5a2b';
      ctx.lineWidth = Math.round(1 * scale);
      ctx.strokeRect(Math.round(10 * scale), Math.round(10 * scale), w - Math.round(20 * scale), h - Math.round(20 * scale));
    },
    drawPhotoFrame: (ctx, x, y, pw, ph, scale = 1) => {
      ctx.strokeStyle = '#8b5a2b';
      ctx.lineWidth = Math.round(3 * scale);
      ctx.strokeRect(x, y, pw, ph);
      
      const size = Math.round(12 * scale);
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(x - Math.round(2 * scale), y - Math.round(2 * scale), size, Math.round(2 * scale));
      ctx.fillRect(x - Math.round(2 * scale), y - Math.round(2 * scale), Math.round(2 * scale), size);
      ctx.fillRect(x + pw + Math.round(2 * scale) - size, y - Math.round(2 * scale), size, Math.round(2 * scale));
      ctx.fillRect(x + pw, y - Math.round(2 * scale), Math.round(2 * scale), size);
      ctx.fillRect(x - Math.round(2 * scale), y + ph, size, Math.round(2 * scale));
      ctx.fillRect(x - Math.round(2 * scale), y + ph + Math.round(2 * scale) - size, Math.round(2 * scale), size);
      ctx.fillRect(x + pw + Math.round(2 * scale) - size, y + ph, size, Math.round(2 * scale));
      ctx.fillRect(x + pw, y + ph + Math.round(2 * scale) - size, Math.round(2 * scale), size);
    },
    drawHeader: (ctx, w, h, coupleName, scale = 1) => {
      ctx.fillStyle = '#5c3a21';
      ctx.font = `italic bold ${Math.round(20 * scale)}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillText(coupleName, w / 2, Math.round(45 * scale));
    },
    drawFooter: (ctx, w, h, coupleName, scale = 1) => {
      ctx.fillStyle = '#5c3a21';
      ctx.font = `${Math.round(11 * scale)}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillText(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), w / 2, h - Math.round(24 * scale));
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

export default function Photobooth({ connectionData, syncShutterState, triggerSyncCapture, remoteCamEnabled = true, remoteMicEnabled = true }) {
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
  const [customFramesList, setCustomFramesList] = useState([]);

  // Local media control states
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  // Sync local audio/video tracks on change and notify remote partner
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => { t.enabled = micEnabled; });
    }
    if (connectionData?.sendData) {
      connectionData.sendData({ type: 'MIC_STATUS', enabled: micEnabled });
    }
  }, [micEnabled, localStream, connectionData]);

  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => { t.enabled = camEnabled; });
    }
    if (connectionData?.sendData) {
      connectionData.sendData({ type: 'CAM_STATUS', enabled: camEnabled });
    }
  }, [camEnabled, localStream, connectionData]);

  const toggleMic = () => setMicEnabled(p => !p);
  const toggleCam = () => setCamEnabled(p => !p);

  // Fetch custom frames from API on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/frames`);
        if (res.ok) {
          setCustomFramesList(await res.json());
        }
      } catch (_) {}
    })();
  }, []);

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
      // Try video+audio, then video only fallback
      for (const constraints of [
        { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: true },
        { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: false },
        { video: true, audio: true },
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
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
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
      const headers = {};
      if (connectionData?.roomToken) headers['Authorization'] = `Bearer ${connectionData.roomToken}`;
      if (connectionData?.passcode) headers['x-room-passcode'] = connectionData.passcode;
      const res = await fetch(`${API}/photos/room/${roomCode}`, { headers });
      if (res.ok) setGallery(await res.json());
    } catch (_) {}
  };
    // Listen for P2P Photo Strip Sync from partner
  useEffect(() => {
    const handleP2PPhoto = (e) => {
      const data = e.detail;
      if (data?.type === 'SYNC_PHOTO_STRIP' && data.payload) {
        setGallery(prev => {
          if (prev.some(p => p.id === data.payload.id)) return prev;
          return [data.payload, ...prev];
        });
      }
    };
    window.addEventListener('webrtc-chat-data', handleP2PPhoto);
    return () => window.removeEventListener('webrtc-chat-data', handleP2PPhoto);
  }, []);

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

    // Always use landscape 4:3 canvas to prevent portrait stretch in final strip
    const CAPTURE_W = 640;
    const CAPTURE_H = 480;

    const canvas = document.createElement('canvas');
    canvas.width  = CAPTURE_W;
    canvas.height = CAPTURE_H;
    const ctx = canvas.getContext('2d');

    // Center-crop draw helper: fills destRect from videoEl without stretching
    // filterCss is applied inside so ctx.restore() never wipes it
    const vr = remoteStream ? remoteVideoRef.current : null;
    const filterCss = currentFilter.css || 'none';

    const drawFeed = (videoEl, destX, destY, destW, destH, mirror) => {
      ctx.save();
      ctx.filter = filterCss; // apply filter INSIDE save so restore doesn't lose it
      ctx.beginPath();
      ctx.rect(destX, destY, destW, destH);
      ctx.clip();

      const videoW = videoEl.videoWidth  > 0 ? videoEl.videoWidth  : 640;
      const videoH = videoEl.videoHeight > 0 ? videoEl.videoHeight : 480;
      const videoAspect = videoW / videoH;
      const targetAspect = destW / destH;

      let sx = 0, sy = 0, sw = videoW, sh = videoH;
      if (videoAspect > targetAspect) {
        // video wider than target: crop left & right
        sw = Math.round(videoH * targetAspect);
        sx = Math.round((videoW - sw) / 2);
      } else {
        // video taller than target: crop top & bottom
        sh = Math.round(videoW / targetAspect);
        sy = Math.round((videoH - sh) / 2);
      }

      if (mirror) {
        ctx.translate(destX + destW, destY);
        ctx.scale(-1, 1);
        ctx.drawImage(videoEl, sx, sy, sw, sh, 0, 0, destW, destH);
      } else {
        ctx.drawImage(videoEl, sx, sy, sw, sh, destX, destY, destW, destH);
      }
      ctx.restore();
    };

    if (vr) {
      // Side-by-side: Local (mirrored) on left, Remote on right
      drawFeed(v,  0,             0, CAPTURE_W / 2, CAPTURE_H, mirrorLocal);
      drawFeed(vr, CAPTURE_W / 2, 0, CAPTURE_W / 2, CAPTURE_H, mirrorRemote);
    } else {
      // Solo / local: full width
      drawFeed(v, 0, 0, CAPTURE_W, CAPTURE_H, mirrorLocal);
    }

    ctx.filter = 'none';

    // Note: Frames are drawn during strip layout compilation, not here
    const src  = canvas.toDataURL('image/jpeg', 0.92);
    const next = [...currentCaptures, { src, frame: currentFrame.name, filter: currentFilter.name }].slice(-4);
    capturesRef.current = next;
    setCaptures(next);
    if (next.length === 4) buildStrip(next);
  };

  const buildStrip = (shots) => {
    const W = 1050; // HD 2.5x Resolution width
    const currentFrame = frameRef.current;
    const scale = 2.5; // 2.5x HD scale multiplier

    if (currentFrame.isCustom) {
      // 📐 CUSTOM PNG OVERLAY FRAME COMPILATION
      const H = 3275;
      const canvas = document.createElement('canvas');
      canvas.width  = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');

      // Clear/fill standard background first
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      const px = 50;
      const pw = 950;
      const ph = 712;
      const py = [200, 937, 1674, 2411];

      let loaded = 0;
      shots.forEach((s, i) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, px, py[i], pw, ph);
          loaded++;

          if (loaded === 4) {
            // Load custom frame overlay image
            const frameImg = new Image();
            frameImg.onload = () => {
              ctx.drawImage(frameImg, 0, 0, W, H);
              const finalUrl = canvas.toDataURL('image/jpeg', 0.95);
              setStrip(finalUrl);
              if (roomCode) uploadPhoto(finalUrl);
            };
            frameImg.src = currentFrame.imageData;
          }
        };
        img.src = s.src;
      });
    } else {
      // 📐 NATIVE DYNAMIC SCALED TEMPLATE COMPILATION (Classic Pink, Dark, etc.)
      const pad = currentFrame.getPadding();
      const gap = currentFrame.getGap();
      const headH = currentFrame.getHeaderHeight();
      const footH = currentFrame.getFooterHeight();

      // Apply scale multiplier
      const scaledPad = {
        top: pad.top * scale,
        bottom: pad.bottom * scale,
        left: pad.left * scale,
        right: pad.right * scale
      };
      const scaledGap = gap * scale;
      const scaledHeadH = headH * scale;
      const scaledFootH = footH * scale;

      const pw = W - scaledPad.left - scaledPad.right;
      const ph = Math.round(pw * 0.74); // 4:3 landscape ratio

      const H = scaledPad.top + scaledHeadH + (ph * 4) + (scaledGap * 3) + scaledFootH + scaledPad.bottom;

      const canvas = document.createElement('canvas');
      canvas.width  = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');

      // Draw background
      currentFrame.drawBg(ctx, W, H, scale);

      // Draw header
      currentFrame.drawHeader(ctx, W, H, coupleNamesRef.current || 'Kita', scale);

      let loaded = 0;
      shots.forEach((s, i) => {
        const img = new Image();
        img.onload = () => {
          const y = scaledPad.top + scaledHeadH + i * (ph + scaledGap);
          const x = scaledPad.left;

          ctx.save();
          // Clip with rounded corners (Classic Pink and Vintage templates only)
          if (currentFrame.id === 'classic-pink' || currentFrame.id === 'vintage-brown') {
            const cr = 8 * scale;
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
          currentFrame.drawPhotoFrame(ctx, x, y, pw, ph, scale);

          loaded++;
          if (loaded === 4) {
            // Draw footer
            currentFrame.drawFooter(ctx, W, H, coupleNamesRef.current || 'Kita', scale);

            const finalUrl = canvas.toDataURL('image/jpeg', 0.95);
            setStrip(finalUrl);
            if (roomCode) uploadPhoto(finalUrl);
          }
        };
        img.src = s.src;
      });
    }
  };

  const uploadPhoto = (photoData) => {
    const photoItem = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      photo_data: photoData,
      couple_names: coupleNamesRef.current || 'Kita',
      created_at: new Date().toISOString(),
    };

    setGallery(prev => [photoItem, ...prev]);

    // Send P2P to partner via WebRTC DataChannel (0% server storage)
    if (connectionData?.sendData) {
      connectionData.sendData({
        type: 'SYNC_PHOTO_STRIP',
        payload: photoItem,
      });
    }
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
      <div className="glass workspace-card" style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'relative' }}>

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
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
        <div className={remoteStream ? "video-grid two-cols" : "video-grid"}>
          <div className="video-viewport" style={{ position: 'relative' }}>
            <video
              ref={localVideoRef}
              muted
              autoPlay
              playsInline
              style={{ filter: filter.css || undefined, transform: mirrorLocal ? 'scaleX(-1)' : 'none' }}
            />
            {/* Mirror Toggle */}
            <button
              type="button"
              className="mirror-toggle-btn"
              onClick={() => setMirrorLocal(p => !p)}
              style={{ top: 8, right: 8 }}
              title="Balik Kiri/Kanan"
            >
              ↔️
            </button>
            {/* Camera & Mic Controls for Local user */}
            <div style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              display: 'flex',
              gap: 6,
              zIndex: 10,
            }}>
              <button
                type="button"
                onClick={toggleMic}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: micEnabled ? 'rgba(0,0,0,0.55)' : '#ff3b30',
                  color: '#fff', border: '1px solid rgba(255,255,255,0.35)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, transition: 'all 0.2s', outline: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
                title={micEnabled ? "Mute Mic" : "Unmute Mic"}
              >
                {micEnabled ? '🎙️' : '🔇'}
              </button>
              <button
                type="button"
                onClick={toggleCam}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: camEnabled ? 'rgba(0,0,0,0.55)' : '#ff3b30',
                  color: '#fff', border: '1px solid rgba(255,255,255,0.35)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, transition: 'all 0.2s', outline: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
                title={camEnabled ? "Matikan Kamera" : "Nyalakan Kamera"}
              >
                {camEnabled ? '📷' : '🚫'}
              </button>
            </div>
            {/* Local Camera Off Placeholder */}
            {!camEnabled && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: '#0c0608',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-tertiary)',
                gap: 8,
                zIndex: 2,
              }}>
                <span style={{ fontSize: 26 }}>🚫</span>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '-0.02em' }}>Kamera Kamu Mati</span>
              </div>
            )}
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
                style={{ top: 8, right: 8 }}
                title="Balik Kiri/Kanan"
              >
                ↔️
              </button>
              {/* Remote Muted Tag */}
              {!remoteMicEnabled && (
                <div style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  background: 'rgba(255, 59, 48, 0.85)',
                  color: '#fff',
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  zIndex: 10,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }}>
                  <span>🔇</span> Muted
                </div>
              )}
              {/* Remote Camera Off Placeholder */}
              {!remoteCamEnabled && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: '#0c0608',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-tertiary)',
                  gap: 8,
                  zIndex: 2,
                }}>
                  <span style={{ fontSize: 26 }}>🚫</span>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '-0.02em' }}>Kamera Pasangan Mati</span>
                </div>
              )}
              <div className="video-tag"><div className="dot dot-pink" /> Pasangan</div>
            </div>
          )}
        </div>

        {/* Strip Templates */}
        <div>
          <div style={labelStyle}>Strip Template</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
            {[
              ...FRAMES,
              ...customFramesList.map(cf => ({
                id: `custom-${cf.id}`,
                name: cf.name,
                emoji: cf.emoji || '🖼️',
                preview: 'rgba(255,255,255,0.45)',
                isCustom: true,
                imageData: cf.image_data
              }))
            ].map(f => (
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
              ? '⚠️ Sambungkan Room privat untuk mulai berfoto'
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
                '4 foto terabadikan secara P2P. Klik untuk preview & unduh.'
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
        <div className="glass workspace-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            🌸 Galeri Sesi Lokal ({gallery.length}) · 🛡️ Privat (Tersimpan di Perangkat Anda)
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
