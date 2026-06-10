"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) setError("Token tidak ditemukan. Minta link reset baru.");
  }, [token]);

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
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: password }),
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
            Password Diperbarui
          </h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "28px" }}>
            Password Anda berhasil diubah. Silakan masuk dengan password baru.
          </p>
          <button className="btn-gold" style={{ width: "100%" }} onClick={() => router.push("/login")}>
            Masuk Sekarang →
          </button>
        </div>
      ) : (
        <>
          <p className="section-label" style={{ marginBottom: "8px" }}>Reset Password</p>
          <h1 className="fd" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--text)", marginBottom: "28px" }}>
            Buat Password Baru
          </h1>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px", display: "block" }}>
                Password Baru <span style={{ color: "#5A4E3F" }}>(min. 8 karakter)</span>
              </label>
              <input
                type="password"
                className="ci"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={!token}
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
                disabled={!token}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p style={{ fontSize: "13px", color: "#F44336", textAlign: "center" }}>{error}</p>
            )}

            {error && error.includes("Token") && (
              <Link href="/forgot-password" style={{
                fontSize: "13px", color: "var(--gold)", textDecoration: "none",
                textAlign: "center", display: "block",
              }}>
                Minta link reset baru →
              </Link>
            )}

            <button
              type="submit"
              className="btn-gold"
              disabled={loading || !token}
              style={{ width: "100%", marginTop: "8px", opacity: (loading || !token) ? 0.7 : 1 }}
            >
              {loading ? "Memproses..." : "Simpan Password Baru →"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
      background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(201,168,76,.12) 0%, transparent 70%), var(--dark)",
      position: "relative",
    }}>
      <div style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <Image src="/Logo CG.png" alt="Clemira Gold" width={32} height={32} style={{ objectFit: "contain" }} />
            <span className="fd" style={{ fontSize: "24px", fontWeight: 600, color: "var(--text)", letterSpacing: ".5px" }}>
              Clemira Gold
            </span>
          </Link>
        </div>

        <Suspense fallback={
          <div style={{
            background: "linear-gradient(135deg, rgba(201,168,76,.1), rgba(201,168,76,.03))",
            border: "1px solid rgba(201,168,76,.25)",
            borderRadius: "16px",
            padding: "36px",
            textAlign: "center",
            color: "var(--muted)",
            fontSize: "14px",
          }}>
            Memuat...
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>

        <p style={{ textAlign: "center", fontSize: "12px", color: "#3A342A", marginTop: "20px" }}>
          © 2026 Clemira Gold · Diawasi OJK
        </p>
      </div>
    </main>
  );
}
