import Link from "next/link";
import LogoSmall from "./LogoSmall";

export default function PromoCTA() {
  return (
    <section style={{ padding: "72px 20px", textAlign: "center" }}>
      <div style={{ position: "relative", maxWidth: 500, margin: "0 auto" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 70% 70% at 50% 50%,rgba(201,168,76,.1) 0%,transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative" }}>
          <div style={{
            width: 50,
            height: 50,
            margin: "0 auto 20px",
            borderRadius: 12,
            background: "rgba(201,168,76,.1)",
            border: "1px solid rgba(201,168,76,.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <LogoSmall />
          </div>
          <h2 className="fd" style={{ fontSize: "2.2rem", fontWeight: 300, color: "#EDE8DE", lineHeight: 1.2, marginBottom: 14 }}>
            Ada Pertanyaan?<br />
            <em style={{ color: "var(--gold)" }}>Hubungi Kami.</em>
          </h2>
          <p style={{ fontSize: 14, color: "#6A5E4F", lineHeight: 1.75, marginBottom: 28 }}>
            Tim kami siap membantu Anda memilih produk yang sesuai, mengkonfirmasi stok terkini,
            dan menjawab pertanyaan seputar harga serta proses transaksi.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="https://wa.me/6285975459997?text=Halo,%20saya%20mau%20tanya%20info%20promo%20emas%20hari%20ini!"
              target="_blank"
              rel="noreferrer"
              className="btn-gold"
            >
              ☏ Chat WhatsApp
            </a>
            <Link href="/price" className="btn-outline">Lihat Harga Emas</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
