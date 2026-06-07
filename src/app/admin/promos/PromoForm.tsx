"use client";

import { useState, useTransition, useRef } from "react";
import { createPromo } from "./actions";

const GRAMASI_OPTIONS = ["0.5g", "1g", "2g", "5g", "10g", "25g", "50g", "100g"];
const BADGE_OPTIONS = [
  { value: "flash",     label: "FLASH SALE" },
  { value: "hot",       label: "HOT DEAL"   },
  { value: "available", label: "TERSEDIA"   },
  { value: "exclusive", label: "EKSKLUSIF"  },
];

export default function PromoForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createPromo(formData);
      if ("error" in result) {
        setError(result.error);
        setSuccess(false);
      } else {
        setError(null);
        setSuccess(true);
        formRef.current?.reset();
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  }

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(201,168,76,.2)",
    borderRadius: 8,
    color: "#EDE8DE",
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: "var(--font-dm-sans), sans-serif",
    boxSizing: "border-box" as const,
  };
  const labelStyle = {
    fontSize: 12,
    color: "#7A6E5F",
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    marginBottom: 6,
    display: "block",
  };

  return (
    <div style={{
      background: "rgba(201,168,76,.05)",
      border: "1px solid rgba(201,168,76,.15)",
      borderRadius: 12,
      padding: "24px",
      marginBottom: 32,
    }}>
      <h2 className="fd" style={{ fontSize: "1.2rem", color: "#EDE8DE", fontWeight: 400, marginBottom: 20 }}>
        Tambah Item Promo
      </h2>

      <form ref={formRef} onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
          {/* Nama */}
          <div style={{ gridColumn: "1 / 3" }}>
            <label style={labelStyle}>Nama Produk *</label>
            <input name="nama" required placeholder="cth: Antam 1g Certicard" style={inputStyle} />
          </div>

          {/* Badge */}
          <div>
            <label style={labelStyle}>Badge *</label>
            <select name="badgeType" required style={{ ...inputStyle, cursor: "pointer" }}>
              {BADGE_OPTIONS.map(b => (
                <option key={b.value} value={b.value} style={{ background: "#1A1612", color: "#EDE8DE" }}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          {/* Gramasi */}
          <div>
            <label style={labelStyle}>Gramasi *</label>
            <select name="gramasi" required style={{ ...inputStyle, cursor: "pointer" }}>
              {GRAMASI_OPTIONS.map(g => (
                <option key={g} value={g} style={{ background: "#1A1612", color: "#EDE8DE" }}>{g}</option>
              ))}
            </select>
          </div>

          {/* Harga Jual */}
          <div>
            <label style={labelStyle}>Harga Jual (Rp) *</label>
            <input name="hargaJual" type="number" required min={1} placeholder="cth: 1285000" style={inputStyle} />
          </div>

          {/* Stok */}
          <div>
            <label style={labelStyle}>Stok (keping)</label>
            <input name="stok" type="number" min={1} defaultValue={1} style={inputStyle} />
          </div>

          {/* Kondisi */}
          <div style={{ gridColumn: "1 / 4" }}>
            <label style={labelStyle}>Kondisi Fisik</label>
            <input name="kondisi" placeholder="cth: kulit ari mulus / ada sedikit goresan / retak pada kemasan certicard" style={inputStyle} />
          </div>

          {/* Deskripsi */}
          <div style={{ gridColumn: "1 / 3" }}>
            <label style={labelStyle}>Deskripsi</label>
            <textarea name="deskripsi" rows={2} placeholder="Deskripsi singkat produk..." style={{ ...inputStyle, resize: "vertical" as const }} />
          </div>

          {/* Tags */}
          <div>
            <label style={labelStyle}>Tags (pisah koma)</label>
            <input name="tags" placeholder="cth: Bersertifikat, Redmark" style={inputStyle} />
          </div>
        </div>

        {error && (
          <p style={{ color: "#EF5350", fontSize: 13, marginBottom: 12 }}>{error}</p>
        )}
        {success && (
          <p style={{ color: "#4CAF50", fontSize: 13, marginBottom: 12 }}>Item promo berhasil ditambahkan.</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn-gold"
          style={{ padding: "10px 24px", fontSize: 14, opacity: pending ? 0.6 : 1 }}
        >
          {pending ? "Menyimpan…" : "+ Tambah Item"}
        </button>
      </form>
    </div>
  );
}
