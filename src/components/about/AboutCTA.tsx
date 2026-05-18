import Link from "next/link";

export default function AboutCTA() {
  return (
    <section style={{
      padding: "80px 20px",
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse 70% 70% at 50% 50%,rgba(201,168,76,.12) 0%,transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{ position: "relative", maxWidth: 560, margin: "0 auto" }}>
        <p className="section-label" style={{ marginBottom: 14 }}>Mulai Sekarang</p>
        <h2 className="fd" style={{
          fontSize: "clamp(2.2rem,4vw,3.2rem)",
          fontWeight: 300,
          color: "#EDE8DE",
          lineHeight: 1.15,
          marginBottom: 18,
        }}>
          Siap Memantau<br />
          <em style={{ color: "var(--gold)" }}>Emas Anda?</em>
        </h2>
        <p style={{ fontSize: 15, color: "#7A6E5F", lineHeight: 1.75, marginBottom: 36 }}>
          Mulai pantau harga emas Antam hari ini secara gratis.
          Tidak perlu daftar, tidak ada biaya tersembunyi.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
          <Link href="/price" className="btn-gold">Pantau Harga Sekarang</Link>
          <a
            href="https://wa.me/6285975459997?text=Halo,%20saya%20ingin%20tahu%20lebih%20tentang%20Clemira%20Gold!"
            target="_blank"
            rel="noreferrer"
            className="btn-outline"
          >
            ☏ Hubungi Kami
          </a>
        </div>
        <p style={{ fontSize: 12, color: "#4A4035" }}>
          Update harga harian · Kalkulator buyback gratis · Produk bersertifikat
        </p>
      </div>
    </section>
  );
}
