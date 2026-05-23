"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Email atau password salah.");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background:
          "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(201,168,76,.12) 0%, transparent 70%), var(--dark)",
        position: "relative",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }} className="fu d1">
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <Image src="/Logo CG.png" alt="Clemira Gold" width={32} height={32} style={{ objectFit: "contain" }} />
            <span className="fd" style={{ fontSize: "24px", fontWeight: 600, color: "var(--text)", letterSpacing: ".5px" }}>
              Clemira Gold
            </span>
          </Link>
        </div>

        {/* Card */}
        <div
          className="fu d2"
          style={{
            background: "linear-gradient(135deg, rgba(201,168,76,.1), rgba(201,168,76,.03))",
            border: "1px solid rgba(201,168,76,.25)",
            borderRadius: "16px",
            padding: "36px",
            backdropFilter: "blur(8px)",
          }}
        >
          <p className="section-label" style={{ marginBottom: "8px" }}>Selamat Datang</p>
          <h1 className="fd" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--text)", marginBottom: "28px" }}>
            Masuk ke Akun Anda
          </h1>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px", display: "block" }}>
                Email
              </label>
              <input
                type="email"
                className="ci"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px", display: "block" }}>
                Password
              </label>
              <input
                type="password"
                className="ci"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p style={{ fontSize: "13px", color: "#F44336", textAlign: "center" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-gold"
              disabled={loading}
              style={{ width: "100%", marginTop: "8px", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Memproses..." : "Masuk →"}
            </button>
          </form>

          <div
            style={{
              marginTop: "24px",
              paddingTop: "24px",
              borderTop: "1px solid rgba(201,168,76,.15)",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "13px", color: "var(--muted)" }}>
              Belum punya akun?{" "}
              <Link href="/" style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
                Daftar Sekarang
              </Link>
            </p>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "#3A342A", marginTop: "20px" }} className="fu d3">
          © 2026 Clemira Gold · Diawasi OJK
        </p>
      </div>
    </main>
  );
}
