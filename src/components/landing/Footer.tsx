import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";

export default async function Footer() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;

  return (
    <>
      <div className="shimmer-line" />
      <footer style={{ padding: "44px 20px 28px", borderTop: "1px solid rgba(201,168,76,.15)", background: "rgba(0,0,0,.3)" }}>
        <div className="wrap">
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 36 }} className="foot-grid">
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Image src="/Logo CG.png" alt="Clemira Gold" width={24} height={24} style={{ objectFit: "contain" }} />
                <span className="fd" style={{ fontSize: 16, color: "#EDE8DE" }}>Clemira Gold</span>
              </div>
              <p style={{ fontSize: 13, color: "#5A5045", lineHeight: 1.7, maxWidth: 220 }}>
                Platform pantau harga emas Antam bersertifikat. Jujur, transparan, dan mudah diakses.
              </p>
              <p style={{ fontSize: 12, color: "#3A342A", marginTop: 12 }}>📍 Indonesia</p>
            </div>

            {/* Platform */}
            <div>
              <p style={{ fontSize: 11, letterSpacing: 2, color: "#5A5045", textTransform: "uppercase", marginBottom: 14 }}>Platform</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[["Harga Emas", "/price"], ["Kalkulator", "/calculator"], ["Tentang Kami", "/about"]].map(([label, href]) => (
                  <Link key={href} href={href} style={{ fontSize: 14, color: "#6A5E4F", textDecoration: "none" }}>{label}</Link>
                ))}
              </div>
            </div>

            {/* Fitur */}
            <div>
              <p style={{ fontSize: 11, letterSpacing: 2, color: "#5A5045", textTransform: "uppercase", marginBottom: 14 }}>Fitur</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[["Grafik Harga", "/price"], ["Buyback Kalkulator", "/calculator"], ["Promo", "/sale"]].map(([label, href]) => (
                  <Link key={label} href={href} style={{ fontSize: 14, color: "#6A5E4F", textDecoration: "none" }}>{label}</Link>
                ))}
              </div>
            </div>

            {/* Kontak */}
            <div>
              <p style={{ fontSize: 11, letterSpacing: 2, color: "#5A5045", textTransform: "uppercase", marginBottom: 14 }}>Kontak</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a href="https://wa.me/6285975459997" target="_blank" rel="noreferrer"
                  style={{ fontSize: 14, color: "var(--gold)", textDecoration: "none" }}>WhatsApp</a>
                {!session ? (
                  <Link href="/login" style={{ fontSize: 14, color: "#6A5E4F", textDecoration: "none" }}>Masuk</Link>
                ) : role === "admin" ? (
                  <Link href="/admin" style={{ fontSize: 14, color: "var(--gold)", textDecoration: "none" }}>Admin Panel</Link>
                ) : (
                  <Link href="/profile" style={{ fontSize: 14, color: "#6A5E4F", textDecoration: "none" }}>Profil</Link>
                )}
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,.05)", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <p style={{ fontSize: 12, color: "#3A342A" }}>© 2026 Clemira Gold. Hak Cipta Dilindungi.</p>
            <p style={{ fontSize: 12, color: "#3A342A", fontStyle: "italic" }}>Emasmu, Kendalimu.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @media(max-width:900px){.foot-grid{grid-template-columns:1fr 1fr !important;gap:28px !important}}
        @media(max-width:600px){.foot-grid{grid-template-columns:1fr 1fr !important}}
      `}</style>
    </>
  );
}
