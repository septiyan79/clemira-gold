import Link from "next/link";
import LogoSmall from "./LogoSmall";

export default function PromoFooter() {
  return (
    <footer style={{ padding: "40px 20px 24px", borderTop: "1px solid rgba(201,168,76,.15)", background: "rgba(0,0,0,.3)" }}>
      <div className="wrap">
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 36, marginBottom: 32 }} className="foot-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <LogoSmall />
              <span className="fd" style={{ fontSize: 16, color: "#EDE8DE" }}>Clemira Gold</span>
            </div>
            <p style={{ fontSize: 13, color: "#5A5045", lineHeight: 1.7, maxWidth: 220 }}>
              Platform pantau harga emas Antam bersertifikat. Jujur, transparan, dan mudah diakses.
            </p>
          </div>
          <div>
            <p style={{ fontSize: 11, letterSpacing: 2, color: "#5A5045", textTransform: "uppercase", marginBottom: 12 }}>Platform</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {([["Harga Emas", "/price"], ["Promo", "/sale"], ["Tentang Kami", "/about"]] as [string, string][]).map(([label, href]) => (
                <Link key={href} href={href} style={{ fontSize: 14, color: "#6A5E4F", textDecoration: "none" }}>{label}</Link>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 11, letterSpacing: 2, color: "#5A5045", textTransform: "uppercase", marginBottom: 12 }}>Fitur</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {([["Kalkulator", "/#kalkulator"], ["Grafik Harga", "/price"], ["Admin Panel", "/admin"]] as [string, string][]).map(([label, href]) => (
                <Link key={href} href={href} style={{ fontSize: 14, color: "#6A5E4F", textDecoration: "none" }}>{label}</Link>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 11, letterSpacing: 2, color: "#5A5045", textTransform: "uppercase", marginBottom: 12 }}>Kontak</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a href="https://wa.me/6285975459997" target="_blank" rel="noreferrer" style={{ fontSize: 14, color: "var(--gold)", textDecoration: "none" }}>WhatsApp</a>
              <Link href="/login" style={{ fontSize: 14, color: "#6A5E4F", textDecoration: "none" }}>Masuk</Link>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,.05)", paddingTop: 18, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <p style={{ fontSize: 12, color: "#3A342A" }}>© 2026 Clemira Gold. Hak Cipta Dilindungi.</p>
          <p style={{ fontSize: 12, color: "#3A342A", fontStyle: "italic" }}>Emasmu, Kendalimu.</p>
        </div>
      </div>
    </footer>
  );
}
