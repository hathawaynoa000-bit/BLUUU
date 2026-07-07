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
        <div style={{ fontSize: 54, marginBottom: 12 }}>🧿</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: 6 }}>
          Tentang BLUUU
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>A Place Where Distance Learns to Lose</p>
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
          Halo. <strong></strong>.
        </p>
        <p>
          Kalau kamu sedang membaca halaman ini, berarti ada sepotong cerita yang berhasil sampai kepadamu.
        </p>
        <p>

BLUUU bukan dibuat dari sebuah perusahaan besar, bukan juga dari ide bisnis yang disusun berlembar-lembar. Ia lahir dari sesuatu yang jauh lebih sederhana: rindu.

Aku membuat tempat ini untuk seseorang yang sangat berarti dalam hidupku—perempuan yang kucintai-perempuan yang membuat semua ini ada. Kami dipisahkan oleh jarak, menjalani hari-hari sebagai pasangan yang jauh di mata, belajar menerima bahwa tidak semua pelukan bisa dilakukan hari ini, dan tidak semua tawa bisa terdengar tanpa jeda.

Di antara panggilan video yang sering terputus, waktu yang tidak selalu sejalan, dan rasa ingin bertemu yang terus bertambah, muncul satu pertanyaan sederhana.

"Bagaimana kalau kami punya ruang kecil yang terasa seperti rumah, meski sedang berjauhan?"        


Dari pertanyaan itulah BLUUU mulai ada.

Tempat kecil ini dibangun agar orang yang saling mencintai tetap bisa menciptakan kenangan bersama. Mengambil foto strip seolah berada di sisi yang sama, menggambar di kanvas yang sama, saling melempar pertanyaan, tertawa, bercerita, dan sesekali terdiam sambil memandang layar—karena terkadang, kehadiran tidak selalu membutuhkan kata-kata.

Mungkin BLUUU tidak mampu menghapus ribuan kilometer yang memisahkan. Namun, jika ia bisa membuat seseorang tersenyum, merasa sedikit lebih dekat, atau menjadi alasan untuk berkata, "Hari ini terasa lebih ringan karena ada kamu," maka semua malam yang kuhabiskan untuk membuatnya sudah terbayar.

Karena pada akhirnya, ini bukan hanya tentang sebuah website.

Ini adalah surat cinta yang di tulis dalam code.

Surat yang kuharap bukan hanya bisa menemani kisah kami, tetapi juga menjadi tempat bagi banyak pasangan lain untuk menyimpan cerita mereka sendiri.
</p>
        <p style={{ fontStyle: 'italic', textAlign: 'center', margin: '10px 0', color: 'var(--accent-dark)', fontWeight: 600 }}>
          "Absence sharpens love, presence strengthens it." — Thomas Fuller
        </p>
        <p style={{ textAlign: 'right', marginTop: 10, fontSize: 13, color: 'var(--text-tertiary)' }}>
          Dengan penuh jarak,<br />
          <strong style={{ color: 'var(--text-primary)' }}>BLUUU 💖</strong>
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
