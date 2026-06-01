"use client";

import { useRef, useState, useTransition } from "react";
import { createProduct } from "./actions";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,.04)",
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 8,
  padding: "8px 12px",
  color: "#EDE8DE",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: "#5A5045",
  marginBottom: 6,
};

const BRAND_OPTIONS  = ["antam", "ubs", "galeri24", "lotus"];
const SERIES_OPTIONS = ["regular", "gift", "batik", "seri khusus"];
const GRAM_OPTIONS   = [0.5, 1, 2, 3, 5, 10, 25, 50, 100];

export default function ProductForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await createProduct(fd);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(true);
        formRef.current?.reset();
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  }

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Toggle button */}
      <button
        onClick={() => { setOpen(o => !o); setError(null); setSuccess(false); }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer",
          background: open ? "rgba(255,255,255,.04)" : "rgba(201,168,76,.12)",
          border: open ? "1px solid rgba(255,255,255,.08)" : "1px solid rgba(201,168,76,.3)",
          color: open ? "#5A5045" : "var(--gold)",
          transition: "all .15s",
        }}
      >
        {open ? "✕ Tutup" : "+ Tambah Produk"}
      </button>

      {/* Form */}
      {open && (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          style={{
            marginTop: 16,
            background: "rgba(255,255,255,.02)",
            border: "1px solid rgba(255,255,255,.06)",
            borderRadius: 12,
            padding: "24px",
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 500, color: "#EDE8DE", marginBottom: 20 }}>
            Produk Baru
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {/* SKU */}
            <div>
              <label style={labelStyle}>SKU <span style={{ color: "#EF5350" }}>*</span></label>
              <input name="sku" required placeholder="LM-ANTAM-1GR" style={inputStyle} />
            </div>

            {/* Nama */}
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Nama Produk <span style={{ color: "#EF5350" }}>*</span></label>
              <input name="name" required placeholder="LM Antam 1gr Regular" style={inputStyle} />
            </div>

            {/* Brand */}
            <div>
              <label style={labelStyle}>Brand</label>
              <input
                name="brand"
                list="brand-options"
                placeholder="antam"
                style={inputStyle}
              />
              <datalist id="brand-options">
                {BRAND_OPTIONS.map(b => <option key={b} value={b} />)}
              </datalist>
            </div>

            {/* Gramasi */}
            <div>
              <label style={labelStyle}>Gramasi (gr) <span style={{ color: "#EF5350" }}>*</span></label>
              <input
                name="weightGram"
                type="number"
                required
                step="0.001"
                min="0.001"
                list="gram-options"
                placeholder="1"
                style={inputStyle}
              />
              <datalist id="gram-options">
                {GRAM_OPTIONS.map(g => <option key={g} value={g} />)}
              </datalist>
            </div>

            {/* Purity */}
            <div>
              <label style={labelStyle}>Purity</label>
              <input name="purity" placeholder="999.9" defaultValue="999.9" style={inputStyle} />
            </div>

            {/* Series */}
            <div>
              <label style={labelStyle}>Series</label>
              <input
                name="series"
                list="series-options"
                placeholder="regular"
                style={inputStyle}
              />
              <datalist id="series-options">
                {SERIES_OPTIONS.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>

          {/* Feedback */}
          {error && (
            <div style={{
              marginTop: 16, padding: "10px 14px", borderRadius: 8,
              background: "rgba(239,83,80,.08)", border: "1px solid rgba(239,83,80,.2)",
              color: "#EF5350", fontSize: 13,
            }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{
              marginTop: 16, padding: "10px 14px", borderRadius: 8,
              background: "rgba(76,175,80,.08)", border: "1px solid rgba(76,175,80,.2)",
              color: "#4CAF50", fontSize: 13,
            }}>
              ✓ Produk berhasil ditambahkan
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button
              type="submit"
              disabled={isPending}
              style={{
                padding: "9px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                background: isPending ? "rgba(201,168,76,.4)" : "rgba(201,168,76,.15)",
                border: "1px solid rgba(201,168,76,.4)",
                color: "var(--gold)", fontWeight: 500,
                opacity: isPending ? 0.7 : 1,
              }}
            >
              {isPending ? "Menyimpan…" : "Simpan Produk"}
            </button>
            <button
              type="button"
              onClick={() => { formRef.current?.reset(); setError(null); setSuccess(false); }}
              style={{
                padding: "9px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                background: "transparent", border: "1px solid rgba(255,255,255,.06)",
                color: "#5A5045",
              }}
            >
              Reset
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
