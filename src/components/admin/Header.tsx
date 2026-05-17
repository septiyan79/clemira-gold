"use client";

import { signOut } from "next-auth/react";
import type { User } from "next-auth";

export default function AdminHeader({ user }: { user: User | undefined }) {
  return (
    <header style={{
      height: "60px",
      background: "rgba(26,22,18,0.9)",
      borderBottom: "1px solid rgba(201,168,76,0.15)",
      backdropFilter: "blur(16px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 28px",
      flexShrink: 0,
    }}>
      <div style={{ fontSize: "14px", color: "var(--muted)" }}>
        Selamat datang, <span style={{ color: "var(--text)" }}>{user?.name ?? user?.email}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{
          fontSize: "12px",
          color: "var(--gold)",
          background: "rgba(201,168,76,0.1)",
          border: "1px solid rgba(201,168,76,0.25)",
          borderRadius: "20px",
          padding: "4px 12px",
        }}>
          Admin
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            fontSize: "13px",
            color: "var(--muted)",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "6px",
            padding: "6px 14px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; e.currentTarget.style.color = "var(--gold)"; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "var(--muted)"; }}
        >
          Keluar
        </button>
      </div>
    </header>
  );
}
