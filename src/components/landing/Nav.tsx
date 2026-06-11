"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

const links = [
  { href: "/price", label: "Harga" },
  { href: "/calculator", label: "Kalkulator" },
  { href: "/sale", label: "Promo" },
  { href: "/about", label: "Tentang" },
];

function ProfileDropdown({ mobile }: { mobile?: boolean }) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (status === "loading") return null;

  if (!session) {
    return (
      <Link href="/login" className="btn-gold" style={mobile ? { width: 200, textAlign: "center" } : { padding: "10px 22px", fontSize: 14 }}>
        Masuk
      </Link>
    );
  }

  const role = (session.user as { role?: string })?.role;
  const name = session.user?.name ?? session.user?.email ?? "Akun";
  const initial = name.charAt(0).toUpperCase();

  if (mobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 15, color: "var(--text)" }}>{name}</span>
        {role === "admin" && (
          <Link href="/admin" className="btn-gold" style={{ width: 200, textAlign: "center" }} onClick={() => setOpen(false)}>
            Admin Panel
          </Link>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          style={{
            width: 200, padding: "12px 0", background: "transparent",
            border: "1px solid rgba(201,168,76,.25)", color: "var(--muted)",
            borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 14,
          }}
        >
          Keluar
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "transparent", border: "1px solid rgba(201,168,76,.25)",
          borderRadius: 20, padding: "6px 12px 6px 6px",
          cursor: "pointer", transition: "border-color .2s",
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(201,168,76,.3), rgba(201,168,76,.1))",
          border: "1px solid rgba(201,168,76,.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 600, color: "var(--gold)",
        }}>
          {initial}
        </div>
        <span style={{ fontSize: 13, color: "var(--text)", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transition: "transform .2s", transform: open ? "rotate(180deg)" : "none", opacity: 0.5 }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="#EDE8DE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          background: "#1A1612", border: "1px solid rgba(201,168,76,.2)",
          borderRadius: 10, minWidth: 180, overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,.4)",
          zIndex: 200,
        }}>
          {/* User info */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(201,168,76,.1)" }}>
            <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{name}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{session.user?.email}</div>
          </div>

          {/* Menu items */}
          {role === "admin" && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              style={{
                display: "block", padding: "10px 16px", fontSize: 13,
                color: "var(--gold)", textDecoration: "none",
                transition: "background .15s",
              }}
              className="adm-tr-hover"
            >
              Admin Panel
            </Link>
          )}

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{
              display: "block", width: "100%", padding: "10px 16px",
              fontSize: 13, color: "#9A8E7F", textAlign: "left",
              background: "transparent", border: "none", cursor: "pointer",
              fontFamily: "inherit", transition: "background .15s",
              borderTop: role === "admin" ? "1px solid rgba(201,168,76,.08)" : "none",
            }}
            className="adm-tr-hover"
          >
            Keluar
          </button>
        </div>
      )}
    </div>
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
            <Image src="/Logo CG.png" alt="Clemira Gold" width={26} height={26} style={{ objectFit: "contain" }} />
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
            <ProfileDropdown />
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
          <ProfileDropdown mobile />
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
