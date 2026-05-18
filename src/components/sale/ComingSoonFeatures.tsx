const FEATURES = [
  {
    icon: "◎",
    title: "Filter & Cari Produk",
    desc: "Cari produk berdasarkan gramasi, harga, atau kondisi secara real-time.",
  },
  {
    icon: "◷",
    title: "Notifikasi Promo",
    desc: "Dapatkan notifikasi otomatis ketika ada promo baru atau stok hampir habis.",
  },
  {
    icon: "◈",
    title: "Riwayat Transaksi",
    desc: "Pantau histori pembelian dan pertumbuhan portofolio emas Anda.",
  },
];

export default function ComingSoonFeatures() {
  return (
    <section style={{
      padding: "56px 20px",
      background: "rgba(0,0,0,.25)",
      borderTop: "1px solid rgba(201,168,76,.1)",
      borderBottom: "1px solid rgba(201,168,76,.1)",
    }}>
      <div className="wrap">
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <span style={{
            display: "inline-block",
            background: "rgba(201,168,76,.12)",
            border: "1px solid rgba(201,168,76,.3)",
            color: "var(--gold)",
            borderRadius: 20,
            padding: "5px 18px",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 2,
            marginBottom: 16,
          }}>SEGERA HADIR</span>
          <h2 className="fd" style={{ fontSize: "2rem", fontWeight: 300, color: "#EDE8DE", marginBottom: 10 }}>
            Fitur <em style={{ color: "var(--gold)" }}>Yang Sedang Disiapkan</em>
          </h2>
          <p style={{ fontSize: 14, color: "#5A5045", maxWidth: 480, margin: "0 auto" }}>
            Kami sedang mengembangkan pengalaman berbelanja emas yang lebih mudah dan transparan.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="cs-grid">
          {FEATURES.map(f => (
            <div key={f.title} style={{
              background: "rgba(255,255,255,.02)",
              border: "1px dashed rgba(201,168,76,.2)",
              borderRadius: 12,
              padding: "24px 22px",
              opacity: 0.7,
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "rgba(201,168,76,.08)",
                border: "1px solid rgba(201,168,76,.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                color: "var(--gold)",
                marginBottom: 14,
                opacity: 0.6,
              }}>{f.icon}</div>
              <h3 style={{ fontSize: 14, fontWeight: 500, color: "#9A8E7E", marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: "#4A4035", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
