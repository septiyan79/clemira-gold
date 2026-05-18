import Link from "next/link";

const STEPS = [
  {
    num: "01",
    title: "Pantau Harga",
    desc: "Cek harga emas Antam hari ini secara real-time langsung dari dashboard kami. Tersedia grafik harian, bulanan, hingga tahunan.",
    action: { label: "Lihat Harga →", href: "/price" },
  },
  {
    num: "02",
    title: "Hitung Buyback",
    desc: "Gunakan kalkulator buyback kami untuk mengetahui estimasi nilai jual kembali emas yang Anda miliki secara instan.",
    action: { label: "Buka Kalkulator →", href: "/#kalkulator" },
  },
  {
    num: "03",
    title: "Hubungi Kami",
    desc: "Temukan produk yang sesuai di halaman promo, lalu hubungi tim kami via WhatsApp untuk konfirmasi stok dan proses transaksi.",
    action: { label: "Lihat Promo →", href: "/sale" },
  },
];

export default function HowItWorks() {
  return (
    <section style={{ padding: "72px 20px" }}>
      <div className="wrap">
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p className="section-label" style={{ marginBottom: 12 }}>Cara Kerja</p>
          <h2 className="fd" style={{
            fontSize: "clamp(2rem,3vw,2.6rem)",
            fontWeight: 300,
            color: "#EDE8DE",
          }}>
            Mulai dalam<br />
            <em style={{ color: "var(--gold)" }}>Tiga Langkah</em>
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
          position: "relative",
        }} className="steps-grid">
          {/* Connector line */}
          <div style={{
            position: "absolute",
            top: 36,
            left: "calc(16.66% + 10px)",
            right: "calc(16.66% + 10px)",
            height: 1,
            background: "linear-gradient(90deg,rgba(201,168,76,.4),rgba(201,168,76,.15),rgba(201,168,76,.4))",
            zIndex: 0,
          }} className="step-connector" />

          {STEPS.map((step) => (
            <div key={step.num} style={{
              background: "linear-gradient(160deg,rgba(201,168,76,.08),rgba(26,22,18,1) 70%)",
              border: "1px solid rgba(201,168,76,.2)",
              borderRadius: 14,
              padding: "32px 26px",
              position: "relative",
              zIndex: 1,
            }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#C9A84C,#8B6914)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}>
                <span className="fd" style={{ fontSize: "1.2rem", fontWeight: 600, color: "#1A1612" }}>{step.num}</span>
              </div>
              <h3 className="fd" style={{ fontSize: "1.3rem", fontWeight: 400, color: "#EDE8DE", marginBottom: 10 }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 13, color: "#6A5E4F", lineHeight: 1.7, marginBottom: 20 }}>{step.desc}</p>
              <Link href={step.action.href} className="step-link">
                {step.action.label}
              </Link>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .step-link{font-size:13px;color:var(--gold);text-decoration:none;font-weight:500}
        .step-link:hover{text-decoration:underline}
        @media(max-width:768px){
          .steps-grid{grid-template-columns:1fr !important}
          .step-connector{display:none !important}
        }
      `}</style>
    </section>
  );
}
