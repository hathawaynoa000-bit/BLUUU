import React from 'react';

export default function AboutPage({ onBack }) {
  return (
    <div className="glass" style={{
      maxWidth: 600,
      margin: '40px auto 60px',
      padding: '40px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: 28,
      animation: 'fadeIn 0.5s ease-out'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 54, marginBottom: 12 }}>💖</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: 6 }}>
          Tentang BLUUU
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>A Space to Capture Your Moments together</p>
      </div>

      <div style={{
        lineHeight: 1.7,
        fontSize: 14,
        color: 'var(--text-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        background: 'rgba(255,255,255,0.3)',
        padding: '24px 28px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(255,255,255,0.4)',
        textAlign: 'justify'
      }}>
        <p>
          Halo! Terima kasih banyak sudah singgah dan menggunakan <strong>BLUUU V3</strong>.
        </p>
        <p>
          Platform ini dirancang khusus untuk memfasilitasi pasangan—baik yang sedang bersenang-senang di satu layar bersama, maupun pasangan pejuang jarak jauh (LDR) yang ingin merasakan kedekatan secara real-time via WebRTC.
        </p>
        <p>
          Melalui interaksi sederhana seperti mengambil foto strip 4-cut bersama, saling menggambar di kanvas secara langsung, serta menjawab pertanyaan game kuis yang mendalam, diharapkan BLUUU dapat membantu mendekatkan hati kalian dan merawat kenangan manis bersama.
        </p>
        <p style={{ fontStyle: 'italic', textAlign: 'center', margin: '10px 0', color: 'var(--accent-dark)', fontWeight: 600 }}>
          "Cinta sejati tidak pernah dibatasi oleh koordinat jarak atau waktu. Ia selalu menemukan jalannya."
        </p>
        <p style={{ textAlign: 'right', marginTop: 10, fontSize: 13, color: 'var(--text-tertiary)' }}>
          Dengan penuh cinta,<br />
          <strong style={{ color: 'var(--text-primary)' }}>Author BLUUU 💖</strong>
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button className="btn btn-accent" onClick={onBack} style={{ padding: '12px 36px' }}>
          ← Kembali ke Beranda
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
