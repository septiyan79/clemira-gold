"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSubmitted(true);
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
          {submitted ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>✉</div>
              <p className="section-label" style={{ marginBottom: "8px" }}>Email Terkirim</p>
              <h1 className="fd" style={{ fontSize: "1.6rem", fontWeight: 300, color: "var(--text)", marginBottom: "16px" }}>
                Cek Inbox Anda
              </h1>
              <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "28px", lineHeight: 1.6 }}>
                Jika email terdaftar, link reset password akan dikirim ke inbox Anda. Link berlaku selama 1 jam.
              </p>
              <Link href="/login" style={{ color: "var(--gold)", fontSize: "14px", textDecoration: "none", fontWeight: 500 }}>
                ← Kembali ke Login
              </Link>
            </div>
          ) : (
            <>
              <p className="section-label" style={{ marginBottom: "8px" }}>Lupa Password</p>
              <h1 className="fd" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--text)", marginBottom: "12px" }}>
                Reset Password
              </h1>
              <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "28px", lineHeight: 1.6 }}>
                Masukkan email akun Anda. Kami akan mengirimkan link untuk membuat password baru.
              </p>

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

                <button
                  type="submit"
                  className="btn-gold"
                  disabled={loading}
                  style={{ width: "100%", marginTop: "8px", opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Memproses..." : "Kirim Link Reset →"}
                </button>
              </form>
            </>
          )}

          {!submitted && (
            <div style={{
              marginTop: "24px", paddingTop: "24px",
              borderTop: "1px solid rgba(201,168,76,.15)",
              textAlign: "center",
            }}>
              <Link href="/login" style={{ fontSize: "13px", color: "var(--muted)", textDecoration: "none" }}>
                ← Kembali ke Login
              </Link>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "#3A342A", marginTop: "20px" }}>
          © 2026 Clemira Gold
        </p>
      </div>
    </main>
  );
}
