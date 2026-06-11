"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function VerifyContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  const isSuccess = status === "success";
  const isInvalid = status === "invalid";

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(201,168,76,.1), rgba(201,168,76,.03))",
      border: "1px solid rgba(201,168,76,.25)",
      borderRadius: "16px",
      padding: "36px",
      backdropFilter: "blur(8px)",
      textAlign: "center",
    }}>
      {isSuccess && (
        <>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>✓</div>
          <p className="section-label" style={{ marginBottom: "8px" }}>Berhasil</p>
          <h1 className="fd" style={{ fontSize: "1.6rem", fontWeight: 300, color: "var(--text)", marginBottom: "16px" }}>
            Email Terverifikasi
          </h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "28px", lineHeight: 1.6 }}>
            Akun Anda sudah aktif. Silakan masuk untuk mulai menggunakan Clemira Gold.
          </p>
          <Link href="/login" className="btn-gold" style={{ display: "inline-block" }}>
            Masuk Sekarang →
          </Link>
        </>
      )}

      {isInvalid && (
        <>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>✕</div>
          <p className="section-label" style={{ marginBottom: "8px" }}>Gagal</p>
          <h1 className="fd" style={{ fontSize: "1.6rem", fontWeight: 300, color: "var(--text)", marginBottom: "16px" }}>
            Link Tidak Valid
          </h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "28px", lineHeight: 1.6 }}>
            Link verifikasi sudah kadaluarsa atau sudah pernah digunakan. Silakan daftar ulang atau hubungi admin.
          </p>
          <Link href="/register" style={{ color: "var(--gold)", fontSize: "14px", textDecoration: "none", fontWeight: 500 }}>
            Daftar Ulang →
          </Link>
        </>
      )}

      {!isSuccess && !isInvalid && (
        <>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>⏳</div>
          <p style={{ fontSize: "14px", color: "var(--muted)" }}>Memverifikasi...</p>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
      background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(201,168,76,.12) 0%, transparent 70%), var(--dark)",
    }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
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
            borderRadius: "16px", padding: "36px",
            textAlign: "center", color: "var(--muted)", fontSize: "14px",
          }}>
            Memuat...
          </div>
        }>
          <VerifyContent />
        </Suspense>

        <p style={{ textAlign: "center", fontSize: "12px", color: "#3A342A", marginTop: "20px" }}>
          © 2026 Clemira Gold
        </p>
      </div>
    </main>
  );
}
