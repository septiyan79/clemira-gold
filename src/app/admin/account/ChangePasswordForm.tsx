"use client";

import { useState, useTransition } from "react";
import { changePassword } from "./actions";

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (next !== confirm) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }
    if (next.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }

    startTransition(async () => {
      const res = await changePassword(current, next);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setCurrent("");
        setNext("");
        setConfirm("");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <label style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px", display: "block" }}>
          Password Saat Ini
        </label>
        <input
          type="password"
          className="ci"
          placeholder="••••••••"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      <div>
        <label style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px", display: "block" }}>
          Password Baru <span style={{ color: "#5A4E3F" }}>(min. 8 karakter)</span>
        </label>
        <input
          type="password"
          className="ci"
          placeholder="••••••••"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
          autoComplete="new-password"
        />
      </div>

      <div>
        <label style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px", display: "block" }}>
          Konfirmasi Password Baru
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
        <p style={{ fontSize: "13px", color: "#F44336", margin: 0 }}>{error}</p>
      )}
      {success && (
        <p style={{ fontSize: "13px", color: "#4CAF50", margin: 0 }}>Password berhasil diubah.</p>
      )}

      <button
        type="submit"
        className="btn-gold"
        disabled={isPending}
        style={{ alignSelf: "flex-start", opacity: isPending ? 0.7 : 1 }}
      >
        {isPending ? "Menyimpan..." : "Simpan Password Baru"}
      </button>
    </form>
  );
}
