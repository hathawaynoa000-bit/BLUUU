import React, { useState, useEffect, useRef } from 'react';

export default function CoupleChat({ connectionData, isRemote }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'system',
      text: '🔒 Ruang Chat Terenkripsi End-to-End (P2P). Pesan mengalir langsung antar perangkat dan tidak disimpan di server.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isConnected = connectionData?.connState === 'connected' || !isRemote;
  const myRole = isRemote ? (connectionData?.isCreator ? 'Kreator' : 'Partner') : 'Kamu';

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  // Listen for incoming chat messages via custom event / data channel
  useEffect(() => {
    const handleChatData = (e) => {
      const data = e.detail;
      if (!data) return;

      if (data.type === 'CHAT_MSG') {
        setMessages((prev) => [...prev, { ...data.payload, isMe: false }]);
        if (!isOpen) {
          setUnreadCount((c) => c + 1);
        }
      } else if (data.type === 'CHAT_TYPING') {
        setIsPeerTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsPeerTyping(false), 2500);
      }
    };

    window.addEventListener('webrtc-chat-data', handleChatData);
    return () => window.removeEventListener('webrtc-chat-data', handleChatData);
  }, [isOpen]);

  const sendMessage = (textToSend) => {
    const content = (textToSend || inputText).trim();
    if (!content) return;

    const newMsg = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      sender: myRole,
      text: content,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    // Send P2P via WebRTC
    if (connectionData?.sendData) {
      connectionData.sendData({
        type: 'CHAT_MSG',
        payload: {
          id: newMsg.id,
          sender: myRole,
          text: content,
          time: newMsg.time,
        },
      });
    }

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (connectionData?.sendData) {
      connectionData.sendData({ type: 'CHAT_TYPING' });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickEmojis = ['💖', '📸', '😻', '💋', '🥺', '🎮', '🥂', '✨'];

  return (
    <>
      {/* Floating Toggle Button */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
        {!isOpen && (
          <button
            onClick={() => { setIsOpen(true); setUnreadCount(0); }}
            className="btn-glass"
            style={{
              padding: '12px 18px',
              borderRadius: 999,
              background: 'linear-gradient(135deg, rgba(232,68,106,0.9), rgba(255,107,138,0.9))',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              boxShadow: '0 8px 24px rgba(232,68,106,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid rgba(255,255,255,0.4)',
              cursor: 'pointer',
              transition: 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <span style={{ fontSize: 18 }}>💬</span>
            <span>Couple Chat</span>
            {unreadCount > 0 && (
              <span style={{
                background: '#fff',
                color: '#e8446a',
                fontSize: 11,
                fontWeight: 800,
                borderRadius: 999,
                padding: '2px 7px',
                marginLeft: 4,
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}>
                {unreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Chat Window Modal / Popup */}
      {isOpen && (
        <div
          className="glass"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 360,
            maxWidth: 'calc(100vw - 32px)',
            height: 490,
            maxHeight: 'calc(100vh - 100px)',
            borderRadius: 20,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10000,
            boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
            border: '1px solid var(--glass-border)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(24px)',
            overflow: 'hidden',
            animation: 'fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(232,68,106,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>💬</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)' }}>Couple Chat</div>
                <div style={{ fontSize: 10.5, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  {isConnected ? '🔒 E2EE P2P Direct' : 'Menunggu koneksi...'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 18,
                cursor: 'pointer',
                color: 'var(--text-tertiary)',
                padding: '4px 8px',
                borderRadius: 8,
              }}
            >
              ✕
            </button>
          </div>

          {/* Privacy Badge Banner */}
          <div style={{
            background: 'rgba(16,185,129,0.08)',
            padding: '6px 12px',
            fontSize: 10.5,
            color: 'var(--text-secondary)',
            textAlign: 'center',
            borderBottom: '1px solid rgba(16,185,129,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}>
            <span>🛡️</span>
            <span>Data P2P aman · Tidak disimpan di database server</span>
          </div>

          {/* Messages Body */}
          <div style={{
            flex: 1,
            padding: 14,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            {messages.map((m) => {
              if (m.sender === 'system') {
                return (
                  <div key={m.id} style={{
                    fontSize: 11,
                    color: 'var(--text-tertiary)',
                    textAlign: 'center',
                    background: 'rgba(0,0,0,0.03)',
                    padding: '8px 12px',
                    borderRadius: 12,
                    lineHeight: 1.5,
                  }}>
                    {m.text}
                  </div>
                );
              }

              const isMe = m.isMe;
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    padding: '9px 14px',
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isMe ? 'linear-gradient(135deg, #e8446a, #ff6b8a)' : 'var(--glass-bg)',
                    color: isMe ? '#fff' : 'var(--text-primary)',
                    fontSize: 13,
                    lineHeight: 1.45,
                    border: isMe ? 'none' : '1px solid var(--glass-border)',
                    boxShadow: isMe ? '0 4px 12px rgba(232,68,106,0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
                    wordBreak: 'break-word',
                  }}>
                    {m.text}
                  </div>
                  <span style={{ fontSize: 9.5, color: 'var(--text-tertiary)', marginTop: 3, padding: '0 4px' }}>
                    {m.time}
                  </span>
                </div>
              );
            })}

            {isPeerTyping && (
              <div style={{ alignSelf: 'flex-start', fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>Partner sedang mengetik</span>
                <span className="dot dot-amber" style={{ width: 6, height: 6 }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Emoji Bar */}
          <div style={{
            padding: '6px 10px',
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            borderTop: '1px solid var(--glass-border)',
            background: 'rgba(0,0,0,0.02)',
          }}>
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendMessage(emoji)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 16,
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: 6,
                  transition: 'transform 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div style={{
            padding: 10,
            borderTop: '1px solid var(--glass-border)',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            background: 'var(--glass-bg)',
          }}>
            <input
              type="text"
              className="field"
              placeholder={isConnected ? 'Ketik pesan cinta...' : 'Menunggu pasangan...'}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={!isConnected}
              style={{ flex: 1, padding: '8px 12px', fontSize: 13, borderRadius: 12 }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!isConnected || !inputText.trim()}
              className="btn btn-accent"
              style={{
                padding: '8px 14px',
                borderRadius: 12,
                fontSize: 13,
                opacity: !inputText.trim() ? 0.6 : 1,
              }}
            >
              Kirim
            </button>
          </div>
        </div>
      )}
    </>
  );
}
