"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const links = [
  { href: "/price", label: "Harga" },
  { href: "/calculator", label: "Kalkulator" },
  { href: "/sale", label: "Promo" },
  { href: "/about", label: "Tentang" },
];

function AuthButton({ style }: { style?: React.CSSProperties }) {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (!session) {
    return (
      <Link href="/login" className="btn-gold" style={style}>Masuk</Link>
    );
  }

  const role = (session.user as { role?: string })?.role;

  if (role === "admin") {
    return (
      <Link href="/admin" className="btn-gold" style={style}>Admin Panel</Link>
    );
  }

  return (
    <Link href="/profile" className="btn-outline" style={style}>
      {session.user?.name ?? "Profil"}
    </Link>
  );
}

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(26,22,18,.9)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(201,168,76,.15)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
              <polygon points="14,2 26,9 26,21 14,26 2,21 2,9" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
              <polygon points="14,7 21,11 21,19 14,22 7,19 7,11" fill="rgba(201,168,76,.15)" stroke="#C9A84C" strokeWidth=".8" />
              <text x="14" y="17" textAnchor="middle" fontSize="8" fill="#C9A84C" fontFamily="serif" fontWeight="600">Au</text>
            </svg>
            <span className="fd" style={{ fontSize: 20, fontWeight: 600, color: "#EDE8DE", letterSpacing: ".5px" }}>Clemira Gold</span>
          </Link>

          {/* Desktop links */}
          <div style={{ display: "flex", gap: 28, alignItems: "center" }} className="nav-desktop">
            {links.map(l => {
              const active = pathname.startsWith(l.href);
              return (
                <Link key={l.href} href={l.href} className={`nav-link${active ? " active" : ""}`}>
                  {l.label}
                </Link>
              );
            })}
            <AuthButton style={{ padding: "10px 22px", fontSize: 14 }} />
          </div>

          {/* Hamburger */}
          <button onClick={() => setOpen(!open)} style={{ display: "none", flexDirection: "column", gap: 5, cursor: "pointer", padding: 8, background: "none", border: "none" }} className="ham-btn" aria-label="Menu">
            <span style={{ display: "block", width: 22, height: 1.5, background: "#EDE8DE", transition: "all .3s", borderRadius: 1, transform: open ? "translateY(6.5px) rotate(45deg)" : "none" }} />
            <span style={{ display: "block", width: 22, height: 1.5, background: "#EDE8DE", transition: "all .3s", borderRadius: 1, opacity: open ? 0 : 1 }} />
            <span style={{ display: "block", width: 22, height: 1.5, background: "#EDE8DE", transition: "all .3s", borderRadius: 1, transform: open ? "translateY(-6.5px) rotate(-45deg)" : "none" }} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div onClick={() => setOpen(false)} style={{
          display: "flex", position: "fixed", top: 60, left: 0, right: 0, bottom: 0, zIndex: 99,
          background: "rgba(26,22,18,.97)", backdropFilter: "blur(20px)",
          flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32,
          borderTop: "1px solid rgba(201,168,76,.15)",
        }}>
          {links.map(l => {
            const active = pathname.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} className={`nav-link-mob${active ? " active" : ""}`}>{l.label}</Link>
            );
          })}
          <AuthButton style={{ width: 200, textAlign: "center" }} />
        </div>
      )}

      <style>{`
        .nav-link{font-size:14px;color:#9A8E7E;text-decoration:none;transition:color .2s;position:relative;padding-bottom:2px}
        .nav-link::after{content:'';position:absolute;bottom:-2px;left:0;right:0;height:1px;background:var(--gold);transform:scaleX(0);transition:transform .2s}
        .nav-link:hover{color:#C9A84C}
        .nav-link.active{color:#C9A84C}
        .nav-link.active::after{transform:scaleX(1)}
        .nav-link-mob{font-size:22px;color:#9A8E7E;text-decoration:none;letter-spacing:1px;transition:color .2s}
        .nav-link-mob.active{color:#C9A84C}
        @media (max-width: 600px) {
          .nav-desktop { display: none !important; }
          .ham-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
