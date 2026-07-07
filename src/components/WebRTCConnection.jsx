import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { API } from '../lib/api.js';

export const CONNECTION_MODES = {
  NONE: 'NONE',
  LOCAL: 'LOCAL',
  REMOTE: 'REMOTE',
};

export default function WebRTCConnection({ mode, setMode, onConnectionReady, onDataReceived }) {
  const [roomCode, setRoomCode] = useState('');
  const [passcode, setPasscode] = useState('');
  const [isCreator, setIsCreator] = useState(false);
  const [roomActive, setRoomActive] = useState(false);
  const [connState, setConnState] = useState('disconnected');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const peerRef      = useRef(null);
  const connRef      = useRef(null);
  const localStreamRef = useRef(null);
  const pollRef      = useRef(null);

  const [localStream,  setLocalStream]  = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // ─── Camera helpers ───────────────────────────────────────────────────────
  const stopCamera = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
  };

  const startCamera = async () => {
    // Try video+audio, fall back to video-only
    for (const constraints of [
      { video: { width: 640, height: 480, facingMode: 'user' }, audio: true },
      { video: { width: 640, height: 480, facingMode: 'user' }, audio: false },
    ]) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;
        setLocalStream(stream);
        return stream;
      } catch (_) { /* try next */ }
    }
    setErrorMsg('Gagal mengakses kamera. Pastikan izin browser diberikan.');
    return null;
  };

  // ─── Mode change effects ───────────────────────────────────────────────────
  useEffect(() => {
    if (mode === CONNECTION_MODES.LOCAL) {
      startCamera();
    } else if (mode === CONNECTION_MODES.NONE) {
      stopCamera();
      peerRef.current?.destroy();
      peerRef.current = null;
      clearInterval(pollRef.current);
      setRoomActive(false);
      setConnState('disconnected');
      setErrorMsg('');
      setSuccessMsg('');
      setRoomCode('');
      setPasscode('');
    }
    return () => {
      stopCamera();
      peerRef.current?.destroy();
      clearInterval(pollRef.current);
    };
  }, [mode]);

  // ─── Notify parent whenever connection state changes ───────────────────────
  useEffect(() => {
    onConnectionReady?.({
      localStream,
      remoteStream,
      connState,
      sendData,
      roomCode: roomCode.toUpperCase(),
      isRemote: mode === CONNECTION_MODES.REMOTE,
    });
  }, [localStream, remoteStream, connState, mode, roomCode]);

  // ─── sendData helper (stable ref) ─────────────────────────────────────────
  const sendData = (data) => connRef.current?.open ? (connRef.current.send(data), true) : false;

  // ─── Data channel setup ───────────────────────────────────────────────────
  const setupDataChannel = (conn) => {
    connRef.current = conn;
    conn.on('data', d => onDataReceived?.(d));
    conn.on('close', () => {
      setConnState('disconnected');
      setRemoteStream(null);
      connRef.current = null;
    });
  };

  // ─── Make an outgoing video call to a peer ────────────────────────────────
  const makeCall = (remotePeerId, stream) => {
    if (!peerRef.current || !stream) return;
    const call = peerRef.current.call(remotePeerId, stream);
    call.on('stream', rs => setRemoteStream(rs));
    call.on('error', e => console.error('Call error:', e));
  };

  // ─── Answer any incoming call ─────────────────────────────────────────────
  const handleIncomingCall = (call) => {
    const stream = localStreamRef.current;
    if (stream) {
      call.answer(stream);
    } else {
      startCamera().then(s => s && call.answer(s));
    }
    call.on('stream', rs => setRemoteStream(rs));
    call.on('error', e => console.error('Incoming call error:', e));
  };

  // ─── Init PeerJS ──────────────────────────────────────────────────────────
  const initPeer = async (room, role, stream) => {
    // Unique peer ID based on room + role to avoid collision
    const rand = Math.floor(1000 + Math.random() * 9000);
    const id = `bl-${role}-${room.toLowerCase()}-${rand}`;
    const peer = new Peer(id, {
      debug: 0,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });
    peerRef.current = peer;

    peer.on('open', async (pid) => {
      console.log(`[PeerJS] Open: ${pid}`);
      // Register our peer ID in DB
      await fetch(`${API}/rooms/update-peer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: room, peerId: pid, role }),
      });

      if (role === 'creator') {
        setSuccessMsg('Kamar aktif! Kirim kode & sandi ke pasanganmu.');
        // Creator waits: poll until joiner registers, then call them
        pollRef.current = setInterval(async () => {
          try {
            const r = await fetch(`${API}/rooms/peers/${room}`);
            const d = await r.json();
            if (d.joiner_peer_id) {
              clearInterval(pollRef.current);
              // Initiate video call to joiner
              makeCall(d.joiner_peer_id, stream);
            }
          } catch (_) {}
        }, 1500);
      } else {
        // Joiner: fetch creator peer and initiate data+video connection
        joinAndConnect(room, stream);
      }
    });

    // Listen for incoming calls (both sides answer)
    peer.on('call', call => handleIncomingCall(call));

    // Listen for incoming data connections (creator receives)
    peer.on('connection', (conn) => {
      setupDataChannel(conn);
      setConnState('connected');
      setSuccessMsg('Terhubung! Selamat bermain bersama 💕');
      setErrorMsg('');
    });

    peer.on('error', (e) => {
      console.error('[PeerJS] Error:', e);
      setErrorMsg('WebRTC error: ' + e.type);
      setConnState('error');
    });
  };

  // ─── Joiner connects to creator ───────────────────────────────────────────
  const joinAndConnect = async (room, stream, attempt = 0) => {
    if (attempt > 20) {
      setErrorMsg('Tidak dapat menemukan kamar. Pastikan kreator sudah aktif.');
      return;
    }
    try {
      const r  = await fetch(`${API}/rooms/peers/${room}`);
      const d  = await r.json();
      const creatorId = d.creator_peer_id;

      if (!creatorId) {
        // Creator not ready yet, retry
        setTimeout(() => joinAndConnect(room, stream, attempt + 1), 2000);
        return;
      }

      setConnState('connecting');
      const conn = peerRef.current.connect(creatorId, { reliable: true });
      setupDataChannel(conn);

      conn.on('open', () => {
        setConnState('connected');
        setSuccessMsg('Terhubung! Selamat bermain bersama 💕');
        setErrorMsg('');
        // Joiner also calls creator for redundancy (both sides call each other)
        // This ensures video flows even if creator's outgoing call was blocked
        makeCall(creatorId, stream);
      });
    } catch (e) {
      setTimeout(() => joinAndConnect(room, stream, attempt + 1), 2000);
    }
  };

  // ─── Form handlers ────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!roomCode.trim() || !passcode.trim()) return;
    setSubmitting(true); setErrorMsg('');
    try {
      const r = await fetch(`${API}/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, passcode }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setIsCreator(true); setRoomActive(true);
      const stream = await startCamera();
      if (stream) initPeer(d.roomCode, 'creator', stream);
    } catch (e) { setErrorMsg(e.message); }
    finally { setSubmitting(false); }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!roomCode.trim() || !passcode.trim()) return;
    setSubmitting(true); setErrorMsg('');
    try {
      const r = await fetch(`${API}/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, passcode }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setIsCreator(false); setRoomActive(true);
      const stream = await startCamera();
      if (stream) initPeer(d.roomCode, 'joiner', stream);
    } catch (e) { setErrorMsg(e.message); }
    finally { setSubmitting(false); }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode.toUpperCase());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ═══════════════════════════════════════════
     LANDING: mode picker cards
     ═══════════════════════════════════════════ */
  if (mode === CONNECTION_MODES.NONE) {
    return (
      <div className="glass" style={{
        maxWidth: 500, margin: '0 auto', padding: '36px 32px',
        display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', textAlign: 'center',
      }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 6 }}>
            Pilih Mode
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Bagaimana Anda bermain bersama hari ini?</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
          {/* Local */}
          <button onClick={() => setMode(CONNECTION_MODES.LOCAL)} className="glass" style={{
            padding: '24px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
            gap: 10, alignItems: 'center', fontFamily: 'inherit', border: '1.5px solid rgba(255,255,255,0.5)',
          }}>
            <span style={{ fontSize: 32 }}>💻</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Berdua Langsung</span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Satu layar, lebih intim</span>
          </button>

          {/* Remote */}
          <button onClick={() => setMode(CONNECTION_MODES.REMOTE)} style={{
            padding: '24px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
            gap: 10, alignItems: 'center', fontFamily: 'inherit',
            background: 'linear-gradient(180deg, #ff6b8a 0%, #e8446a 100%)',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 'var(--radius-xl)',
            boxShadow: '0 8px 28px rgba(232,68,106,0.35), 0 0.5px 0 rgba(255,255,255,0.3) inset',
            transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
          }}>
            <span style={{ fontSize: 32 }}>📡</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>Jarak Jauh (LDR)</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>WebRTC + kode privat</span>
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     ACTIVE: connection status bar + forms
     ═══════════════════════════════════════════ */
  return (
    <div className="glass" style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className={`dot ${
            connState === 'connected'  ? 'dot-green' :
            connState === 'connecting' ? 'dot-amber' :
            mode === CONNECTION_MODES.LOCAL ? 'dot-green' : 'dot-red'
          }`} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
              {mode === CONNECTION_MODES.LOCAL ? 'Mode Berdua Langsung' : 'Mode Kamar Privat'}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
              {connState === 'connected'  ? `Terhubung · ${roomCode.toUpperCase()}` :
               connState === 'connecting' ? 'Menghubungkan...' :
               mode === CONNECTION_MODES.LOCAL ? 'Kamera aktif' : 'Belum terhubung'}
            </div>
          </div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => setMode(CONNECTION_MODES.NONE)}>← Ganti Mode</button>
      </div>

      {/* Remote: create / join forms */}
      {mode === CONNECTION_MODES.REMOTE && !roomActive && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: 18 }}>
          {/* Create */}
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>✨ Buat Kamar Baru</div>
            <label style={labelStyle}>Kode Kamar</label>
            <input className="field" placeholder="BLUUU-1502" value={roomCode} onChange={e => setRoomCode(e.target.value)} required />
            <label style={labelStyle}>Kata Sandi</label>
            <input className="field" type="password" placeholder="••••••••" value={passcode} onChange={e => setPasscode(e.target.value)} required />
            <button type="submit" className="btn btn-accent" disabled={submitting} style={{ marginTop: 4 }}>
              {submitting ? 'Membuat...' : '🚀 Buat & Aktifkan'}
            </button>
          </form>

          {/* Join */}
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 10, borderLeft: '1px solid rgba(0,0,0,0.04)', paddingLeft: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>🔑 Masuk Kamar</div>
            <label style={labelStyle}>Kode Kamar</label>
            <input className="field" placeholder="BLUUU-1502" value={roomCode} onChange={e => setRoomCode(e.target.value)} required />
            <label style={labelStyle}>Kata Sandi</label>
            <input className="field" type="password" placeholder="••••••••" value={passcode} onChange={e => setPasscode(e.target.value)} required />
            <button type="submit" className="btn btn-glass" disabled={submitting}
              style={{ marginTop: 4, border: '1.5px solid rgba(232,68,106,0.2)', color: 'var(--accent-dark)' }}>
              {submitting ? 'Bergabung...' : '💕 Bergabung'}
            </button>
          </form>
        </div>
      )}

      {/* Active room code display */}
      {mode === CONNECTION_MODES.REMOTE && roomActive && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: 14 }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>🔒 Kamar:</span>
          <code style={{ fontWeight: 800, fontSize: 13, color: 'var(--accent-dark)', background: 'rgba(232,68,106,0.08)', padding: '3px 12px', borderRadius: 8 }}>
            {roomCode.toUpperCase()}
          </code>
          <button className="btn btn-glass btn-sm" onClick={copyCode}>{copied ? '✅ Tersalin' : '📋 Salin'}</button>
        </div>
      )}

      {errorMsg   && <div className="notice notice-error">{errorMsg}</div>}
      {successMsg && <div className="notice notice-success">{successMsg}</div>}
    </div>
  );
}

const labelStyle = {
  fontSize: 11, color: 'var(--text-tertiary)',
  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
};
