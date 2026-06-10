"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Terjadi kesalahan. Coba lagi.");
    } else {
      setDone(true);
    }
  };

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
      background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(201,168,76,.12) 0%, transparent 70%), var(--dark)",
      position: "relative",
    }}>
      <div style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <Image src="/Logo CG.png" alt="Clemira Gold" width={32} height={32} style={{ objectFit: "contain" }} />
            <span className="fd" style={{ fontSize: "24px", fontWeight: 600, color: "var(--text)", letterSpacing: ".5px" }}>
              Clemira Gold
            </span>
          </Link>
        </div>

        {/* Card */}
        <div style={{
          background: "linear-gradient(135deg, rgba(201,168,76,.1), rgba(201,168,76,.03))",
          border: "1px solid rgba(201,168,76,.25)",
          borderRadius: "16px",
          padding: "36px",
          backdropFilter: "blur(8px)",
        }}>
          {done ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>✓</div>
              <p className="section-label" style={{ marginBottom: "8px" }}>Berhasil</p>
              <h1 className="fd" style={{ fontSize: "1.6rem", fontWeight: 300, color: "var(--text)", marginBottom: "16px" }}>
                Akun Berhasil Dibuat
              </h1>
              <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "28px" }}>
                Silakan masuk menggunakan email dan password Anda.
              </p>
              <button
                className="btn-gold"
                style={{ width: "100%" }}
                onClick={() => router.push("/login")}
              >
                Masuk Sekarang →
              </button>
            </div>
          ) : (
            <>
              <p className="section-label" style={{ marginBottom: "8px" }}>Buat Akun</p>
              <h1 className="fd" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--text)", marginBottom: "28px" }}>
                Daftar Clemira Gold
              </h1>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px", display: "block" }}>
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    className="ci"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>

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
                    Password <span style={{ color: "#5A4E3F" }}>(min. 8 karakter)</span>
                  </label>
                  <input
                    type="password"
                    className="ci"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px", display: "block" }}>
                    Konfirmasi Password
                  </label>
                  <input
                    type="password"
                    className="ci"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <p style={{ fontSize: "13px", color: "#F44336", textAlign: "center" }}>{error}</p>
                )}

                <button
                  type="submit"
                  className="btn-gold"
                  disabled={loading}
                  style={{ width: "100%", marginTop: "8px", opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Memproses..." : "Daftar →"}
                </button>
              </form>
            </>
          )}

          {!done && (
            <div style={{
              marginTop: "24px", paddingTop: "24px",
              borderTop: "1px solid rgba(201,168,76,.15)",
              textAlign: "center",
            }}>
              <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                Sudah punya akun?{" "}
                <Link href="/login" style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
                  Masuk
                </Link>
              </p>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "#3A342A", marginTop: "20px" }}>
          © 2026 Clemira Gold · Diawasi OJK
        </p>
      </div>
    </main>
  );
}
