const VALUES = [
  {
    icon: "◈",
    title: "Transparansi",
    desc: "Harga yang kami tampilkan adalah harga resmi Antam tanpa manipulasi. Tidak ada biaya tersembunyi dalam setiap transaksi.",
  },
  {
    icon: "◉",
    title: "Kepercayaan",
    desc: "Semua produk yang kami jual adalah emas Antam bersertifikat resmi dengan redmark dan kulit ari lengkap.",
  },
  {
    icon: "◎",
    title: "Kemudahan",
    desc: "Platform yang dirancang agar siapa pun dapat memantau harga, menghitung buyback, dan bertransaksi dengan mudah.",
  },
  {
    icon: "◆",
    title: "Kejujuran",
    desc: "Buyback yang kami tawarkan lebih tinggi dari harga butik Antam, tanpa potongan dan tanpa proses yang berbelit.",
  },
];

export default function OurValues() {
  return (
    <section style={{
      padding: "72px 20px",
      background: "rgba(0,0,0,.2)",
    }}>
      <div className="wrap">
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p className="section-label" style={{ marginBottom: 12 }}>Nilai Kami</p>
          <h2 className="fd" style={{
            fontSize: "clamp(2rem,3vw,2.6rem)",
            fontWeight: 300,
            color: "#EDE8DE",
          }}>
            Prinsip yang Kami<br />
            <em style={{ color: "var(--gold)" }}>Pegang Teguh</em>
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
        }} className="values-grid">
          {VALUES.map((v) => (
            <div key={v.title} style={{
              background: "rgba(255,255,255,.03)",
              border: "1px solid rgba(255,255,255,.06)",
              borderRadius: 12,
              padding: "28px 24px",
              transition: "all .3s",
              textAlign: "center",
            }} className="value-card">
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "rgba(201,168,76,.1)",
                border: "1px solid rgba(201,168,76,.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
                fontSize: 22,
                color: "var(--gold)",
              }}>{v.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 500, color: "#EDE8DE", marginBottom: 10 }}>{v.title}</h3>
              <p style={{ fontSize: 13, color: "#6A5E4F", lineHeight: 1.7 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .value-card:hover{
          background:rgba(201,168,76,.06) !important;
          border-color:rgba(201,168,76,.2) !important;
          transform:translateY(-3px);
        }
        @media(max-width:900px){
          .values-grid{grid-template-columns:repeat(2,1fr) !important}
        }
        @media(max-width:500px){
          .values-grid{grid-template-columns:1fr !important}
        }
      `}</style>
    </section>
  );
}
