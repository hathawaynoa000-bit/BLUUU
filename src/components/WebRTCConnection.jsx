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
  const [roomToken, setRoomToken] = useState(() => sessionStorage.getItem('bluuu_room_token') || '');
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
  const keepaliveRef = useRef(null);

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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (_) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
        return stream;
      } catch (_) {
        setErrorMsg('Gagal mengakses kamera. Pastikan izin browser diberikan.');
        return null;
      }
    }
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
      setRoomToken('');
      sessionStorage.removeItem('bluuu_room_token');
    }
    return () => {
      stopCamera();
      peerRef.current?.destroy();
      clearInterval(pollRef.current);
      clearInterval(keepaliveRef.current);
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
      roomToken,
      passcode,
      isCreator,
      isRemote: mode === CONNECTION_MODES.REMOTE,
    });
  }, [localStream, remoteStream, connState, mode, roomCode, roomToken, isCreator, passcode]);

  // ─── sendData helper ──────────────────────────────────────────────────────
  const sendData = (data) => connRef.current?.open ? (connRef.current.send(data), true) : false;

  // ─── Keepalive ping ───────────────────────────────────────────────────────
  const startKeepalive = () => {
    if (keepaliveRef.current) clearInterval(keepaliveRef.current);
    keepaliveRef.current = setInterval(() => {
      if (connRef.current?.open) {
        try { connRef.current.send({ type: 'PING' }); } catch (_) {}
      }
    }, 20000);
  };

  // ─── Data channel setup ───────────────────────────────────────────────────
  const setupDataChannel = (conn) => {
    connRef.current = conn;
    conn.on('data', d => {
      if (d?.type === 'PING') return;
      if (d?.type === 'CHAT_MSG' || d?.type === 'CHAT_TYPING') {
        window.dispatchEvent(new CustomEvent('webrtc-chat-data', { detail: d }));
      }
      onDataReceived?.(d);
    });
    conn.on('open', () => {
      startKeepalive();
    });
    conn.on('close', () => {
      setConnState('disconnected');
      setRemoteStream(null);
      connRef.current = null;
      if (keepaliveRef.current) { clearInterval(keepaliveRef.current); keepaliveRef.current = null; }
    });
    conn.on('error', (e) => {
      console.warn('[DataChannel] error:', e);
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
  const initPeer = async (room, role, stream, token, currentPass) => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const id = `bl-${role}-${room.toLowerCase()}-${rand}`;
    const peer = new Peer(id, {
      debug: 0,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
          { urls: 'stun:stun.cloudflare.com:3478' },
        ],
        iceTransportPolicy: 'all',
      },
    });
    peerRef.current = peer;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-room-passcode': currentPass || passcode,
    };

    peer.on('open', async (pid) => {
      console.log(`[PeerJS] Open: ${pid}`);
      try {
        await fetch(`${API}/rooms/update-peer`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ roomCode: room, peerId: pid, role }),
        });
      } catch (_) {}

      if (role === 'creator') {
        setSuccessMsg('🔒 Room aktif & terproteksi sandi! Kirim kode & sandi ke pasanganmu.');
        pollRef.current = setInterval(async () => {
          try {
            const r = await fetch(`${API}/rooms/peers/${room}`, { headers });
            if (r.ok) {
              const d = await r.json();
              if (d.joiner_peer_id) {
                clearInterval(pollRef.current);
                makeCall(d.joiner_peer_id, stream);
              }
            }
          } catch (_) {}
        }, 1500);
      } else {
        joinAndConnect(room, stream, 0, token, currentPass);
      }
    });

    peer.on('call', call => handleIncomingCall(call));

    peer.on('connection', (conn) => {
      setupDataChannel(conn);
      setConnState('connected');
      setSuccessMsg('🔒 Terhubung secara E2EE! Selamat bermain bersama 💕');
      setErrorMsg('');
    });

    peer.on('error', (e) => {
      console.error('[PeerJS] Error:', e);
      setErrorMsg('WebRTC error: ' + e.type);
      setConnState('error');
    });
  };

  // ─── Joiner connects to creator ───────────────────────────────────────────
  const joinAndConnect = async (room, stream, attempt = 0, token, currentPass) => {
    if (attempt > 20) {
      setErrorMsg('Tidak dapat menemukan Room. Pastikan kreator sudah aktif.');
      return;
    }
    const headers = {
      'Authorization': `Bearer ${token || roomToken}`,
      'x-room-passcode': currentPass || passcode,
    };
    try {
      const r  = await fetch(`${API}/rooms/peers/${room}`, { headers });
      if (!r.ok) throw new Error();
      const d  = await r.json();
      const creatorId = d.creator_peer_id;

      if (!creatorId) {
        setTimeout(() => joinAndConnect(room, stream, attempt + 1, token, currentPass), 2000);
        return;
      }

      setConnState('connecting');
      const conn = peerRef.current.connect(creatorId, { reliable: true });
      setupDataChannel(conn);

      conn.on('open', () => {
        setConnState('connected');
        setSuccessMsg('🔒 Terhubung secara E2EE! Selamat bermain bersama 💕');
        setErrorMsg('');
        makeCall(creatorId, stream);
      });
    } catch (e) {
      setTimeout(() => joinAndConnect(room, stream, attempt + 1, token, currentPass), 2000);
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
      setIsCreator(true);
      setRoomActive(true);
      setRoomToken(d.roomToken || '');
      if (d.roomToken) sessionStorage.setItem('bluuu_room_token', d.roomToken);

      const stream = await startCamera();
      if (stream) initPeer(d.roomCode, 'creator', stream, d.roomToken, passcode);
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
      setIsCreator(false);
      setRoomActive(true);
      setRoomToken(d.roomToken || '');
      if (d.roomToken) sessionStorage.setItem('bluuu_room_token', d.roomToken);

      const stream = await startCamera();
      if (stream) initPeer(d.roomCode, 'joiner', stream, d.roomToken, passcode);
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {/* Local Mode Card */}
          <button onClick={() => setMode(CONNECTION_MODES.LOCAL)} className="glass-interactive mode-card" style={{
            padding: 24, borderRadius: 20, textAlign: 'left',
            display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.4)',
            background: 'var(--glass-bg)',
            transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
          }}>
            <span style={{ fontSize: 32 }}>📸</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Satu Layar (Lokal)</span>
            <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
              Gunakan 1 perangkat bersama. Langsung aktifkan kamera tanpa setup room.
            </span>
            <span className="pill pill-pink" style={{ alignSelf: 'flex-start', marginTop: 4 }}>Mulai Cepat ⚡</span>
          </button>

          {/* Remote Mode Card */}
          <button onClick={() => setMode(CONNECTION_MODES.REMOTE)} className="glass-interactive mode-card" style={{
            padding: 24, borderRadius: 20, textAlign: 'left',
            display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(232,68,106,0.85) 0%, rgba(255,107,138,0.75) 100%)',
            border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: '0 8px 32px rgba(232,68,106,0.25), 0 1px 0 rgba(255,255,255,0.3) inset',
            transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
          }}>
            <span style={{ fontSize: 32 }}>📡</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>Jarak Jauh (LDR)</span>
            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
              Hubungkan 2 HP/Laptop secara terenkripsi P2P dengan kode room & sandi privat.
            </span>
            <span className="pill" style={{ alignSelf: 'flex-start', marginTop: 4, background: 'rgba(255,255,255,0.25)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
              🔒 E2EE WebRTC
            </span>
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
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{mode === CONNECTION_MODES.LOCAL ? 'Mode Berdua Langsung' : 'Mode Room Privat Terenkripsi'}</span>
              {mode === CONNECTION_MODES.REMOTE && connState === 'connected' && (
                <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '2px 6px', borderRadius: 6, fontWeight: 800 }}>
                  🔒 E2EE
                </span>
              )}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
              {connState === 'connected'  ? `Terhubung · ${roomCode.toUpperCase()}` :
               connState === 'connecting' ? 'Menghubungkan via P2P...' :
               mode === CONNECTION_MODES.LOCAL ? 'Kamera aktif' : 'Belum terhubung'}
            </div>
          </div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => setMode(CONNECTION_MODES.NONE)}>← Ganti Mode</button>
      </div>

      {/* Remote: create / join forms */}
      {mode === CONNECTION_MODES.REMOTE && !roomActive && (
        <div className="connection-forms-grid">
          {/* Create */}
          <form onSubmit={handleCreate} className="connection-form-item-left">
            <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>✨ Buat Room Baru (Terenkripsi)</div>
            <label style={labelStyle}>Kode Room</label>
            <input className="field" placeholder="BLUUU-1502" value={roomCode} onChange={e => setRoomCode(e.target.value)} required />
            <label style={labelStyle}>Kata Sandi Kamar</label>
            <input className="field" type="password" placeholder="••••••••" value={passcode} onChange={e => setPasscode(e.target.value)} required />
            <button type="submit" className="btn btn-accent" disabled={submitting} style={{ marginTop: 4 }}>
              {submitting ? 'Membuat...' : '🚀 Buat & Amankan'}
            </button>
          </form>

          {/* Join */}
          <form onSubmit={handleJoin} className="connection-form-item-right">
            <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>🔑 Masuk Room Privat</div>
            <label style={labelStyle}>Kode Room</label>
            <input className="field" placeholder="BLUUU-1502" value={roomCode} onChange={e => setRoomCode(e.target.value)} required />
            <label style={labelStyle}>Kata Sandi Kamar</label>
            <input className="field" type="password" placeholder="••••••••" value={passcode} onChange={e => setPasscode(e.target.value)} required />
            <button type="submit" className="btn btn-glass" disabled={submitting}
              style={{ marginTop: 4, border: '1.5px solid rgba(232,68,106,0.2)', color: 'var(--accent-dark)' }}>
              {submitting ? 'Bergabung...' : '🔑 Masuk Terenkripsi'}
            </button>
          </form>
        </div>
      )}

      {/* Active room code display */}
      {mode === CONNECTION_MODES.REMOTE && roomActive && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: 14 }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>🔒 Room Privat:</span>
          <code style={{ fontWeight: 800, fontSize: 13, color: 'var(--accent-dark)', background: 'rgba(232,68,106,0.08)', padding: '3px 12px', borderRadius: 8 }}>
            {roomCode.toUpperCase()}
          </code>
          <button className="btn btn-glass btn-sm" onClick={copyCode}>{copied ? '✅ Tersalin' : '📋 Salin Kode'}</button>
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
