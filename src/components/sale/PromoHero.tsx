import { PRODUCTS } from "./promo-data";

export default function PromoHero() {
  const stats = [
    // { label: `${PRODUCTS.length} Produk`, sub: "Tersedia" },
    { label: "Coming Soon!", sub: "Sebentar lagi fitur ini hadir untuk kamu" },
    // { label: "Buyback", sub: "Tinggi" },
  ];

  return (
    <section style={{
      padding: "64px 20px 48px",
      background: "radial-gradient(ellipse 70% 60% at 50% 0%,rgba(201,168,76,.13) 0%,transparent 70%),var(--dark)",
      textAlign: "center",
    }}>
      <div className="wrap">
        <p className="section-label fu d1" style={{ marginBottom: 14 }}>Penawaran Terbatas</p>
        <h1 className="fd fu d2" style={{ fontSize: "clamp(2.4rem,5vw,4rem)", fontWeight: 300, color: "#EDE8DE", lineHeight: 1.1, marginBottom: 16 }}>
          Promo <em style={{ color: "var(--gold)" }}>Emas Hari Ini</em>
        </h1>
        <p className="fu d3" style={{ fontSize: 15, color: "#7A6E5F", maxWidth: 520, margin: "0 auto 32px", lineHeight: 1.75 }}>
          Daftar produk emas Antam bersertifikat yang tersedia dengan harga spesial.
          Stok terbatas — hubungi kami segera sebelum kehabisan.
        </p>
        <div className="fu d3" style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {stats.map(s => (
            <div key={s.sub} style={{
              background: "rgba(201,168,76,.08)",
              border: "1px solid rgba(201,168,76,.2)",
              borderRadius: 8,
              padding: "10px 20px",
              minWidth: 110,
            }}>
              <div className="fd" style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--gold)", lineHeight: 1 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "#5A5045", marginTop: 4, letterSpacing: 1 }}>{s.sub.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
