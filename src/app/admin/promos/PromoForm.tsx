"use client";

import { useState, useTransition } from "react";
import { createPromos, type PromoInput } from "./actions";

const GRAMASI_OPTIONS = ["0.5g", "1g", "2g", "5g", "10g", "25g", "50g", "100g"];
const BADGE_OPTIONS = [
  { value: "flash",     label: "FLASH SALE" },
  { value: "hot",       label: "HOT DEAL"   },
  { value: "available", label: "TERSEDIA"   },
  { value: "exclusive", label: "EKSKLUSIF"  },
];

const DEFAULT_DESKRIPSI =
  "Harga spesial hari ini saja. Stok dan penawaran diperbarui setiap hari — hubungi kami segera untuk konfirmasi ketersediaan.";

type RowState = {
  key: string;
  nama: string;
  gramasi: string;
  badgeType: string;
  hargaJual: string;
  stok: string;
  kondisi: string;
  deskripsi: string;
  tags: string;
};

function makeRow(): RowState {
  return {
    key: Math.random().toString(36).slice(2),
    nama: "",
    gramasi: "1g",
    badgeType: "available",
    hargaJual: "",
    stok: "1",
    kondisi: "",
    deskripsi: DEFAULT_DESKRIPSI,
    tags: "",
  };
}

const inp: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,.04)",
  border: "1px solid rgba(201,168,76,.2)",
  borderRadius: 8,
  color: "#EDE8DE",
  padding: "9px 12px",
  fontSize: 13,
  fontFamily: "var(--font-dm-sans), sans-serif",
  boxSizing: "border-box",
};

const lbl: React.CSSProperties = {
  fontSize: 11,
  color: "#7A6E5F",
  letterSpacing: 1,
  textTransform: "uppercase",
  marginBottom: 5,
  display: "block",
};

function RowCard({
  row, index, canDelete, onChange, onDelete,
}: {
  row: RowState;
  index: number;
  canDelete: boolean;
  onChange: (field: keyof Omit<RowState, "key">, val: string) => void;
  onDelete: () => void;
}) {
  return (
    <div style={{
      background: "rgba(201,168,76,.03)",
      border: "1px solid rgba(201,168,76,.15)",
      borderRadius: 12,
      padding: "16px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: "#5A5045", letterSpacing: 1, textTransform: "uppercase" }}>
          Item #{index + 1}
        </span>
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            style={{
              background: "none",
              border: "1px solid rgba(239,83,80,.3)",
              borderRadius: 6,
              color: "#EF5350",
              cursor: "pointer",
              fontSize: 11,
              padding: "3px 10px",
              fontFamily: "var(--font-dm-sans), sans-serif",
            }}
          >
            Hapus
          </button>
        )}
      </div>

      {/* Line 1: Nama, Gramasi, Badge */}
      <div className="pf-g1">
        <div className="pf-g1-nama">
          <label style={lbl}>Nama Produk *</label>
          <input
            value={row.nama}
            onChange={e => onChange("nama", e.target.value)}
            placeholder="cth: Antam 1g Certicard"
            style={inp}
          />
        </div>
        <div>
          <label style={lbl}>Gramasi *</label>
          <select
            value={row.gramasi}
            onChange={e => onChange("gramasi", e.target.value)}
            style={{ ...inp, cursor: "pointer" }}
          >
            {GRAMASI_OPTIONS.map(g => (
              <option key={g} value={g} style={{ background: "#1A1612", color: "#EDE8DE" }}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={lbl}>Badge *</label>
          <select
            value={row.badgeType}
            onChange={e => onChange("badgeType", e.target.value)}
            style={{ ...inp, cursor: "pointer" }}
          >
            {BADGE_OPTIONS.map(b => (
              <option key={b.value} value={b.value} style={{ background: "#1A1612", color: "#EDE8DE" }}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Line 2: Harga, Stok, Kondisi */}
      <div className="pf-g2">
        <div>
          <label style={lbl}>Harga Jual (Rp) *</label>
          <input
            type="number"
            min={1}
            value={row.hargaJual}
            onChange={e => onChange("hargaJual", e.target.value)}
            placeholder="1285000"
            style={inp}
          />
        </div>
        <div>
          <label style={lbl}>Stok (keping)</label>
          <input
            type="number"
            min={1}
            value={row.stok}
            onChange={e => onChange("stok", e.target.value)}
            style={inp}
          />
        </div>
        <div className="pf-g2-kondisi">
          <label style={lbl}>Kondisi Fisik</label>
          <input
            value={row.kondisi}
            onChange={e => onChange("kondisi", e.target.value)}
            placeholder="cth: kulit ari mulus / ada sedikit goresan"
            style={inp}
          />
        </div>
      </div>

      {/* Line 3: Deskripsi, Tags */}
      <div className="pf-g3">
        <div>
          <label style={lbl}>Deskripsi</label>
          <textarea
            rows={2}
            value={row.deskripsi}
            onChange={e => onChange("deskripsi", e.target.value)}
            style={{ ...inp, resize: "vertical" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={lbl}>Tags (pisah koma)</label>
          <input
            value={row.tags}
            onChange={e => onChange("tags", e.target.value)}
            placeholder="cth: Bersertifikat, Redmark"
            style={{ ...inp, flex: 1 }}
          />
        </div>
      </div>
    </div>
  );
}

export default function PromoForm() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<RowState[]>([makeRow()]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleOpen() {
    setRows([makeRow()]);
    setError(null);
    setOpen(true);
  }

  function handleClose() {
    if (pending) return;
    setOpen(false);
  }

  function addRow() {
    setRows(r => [...r, makeRow()]);
  }

  function removeRow(key: string) {
    setRows(r => r.filter(row => row.key !== key));
  }

  function updateRow(key: string, field: keyof Omit<RowState, "key">, val: string) {
    setRows(r => r.map(row => row.key === key ? { ...row, [field]: val } : row));
  }

  function handleSubmit() {
    const items: PromoInput[] = rows.map(r => ({
      nama: r.nama.trim(),
      gramasi: r.gramasi,
      badgeType: r.badgeType,
      hargaJual: parseFloat(r.hargaJual),
      stok: Math.max(1, parseInt(r.stok) || 1),
      kondisi: r.kondisi.trim() || null,
      deskripsi: r.deskripsi.trim() || null,
      tags: r.tags ? r.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
    }));

    const badIdx = items.findIndex(item => !item.nama || isNaN(item.hargaJual) || item.hargaJual <= 0);
    if (badIdx !== -1) {
      setError(`Item #${badIdx + 1}: nama dan harga jual wajib diisi`);
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await createPromos(items);
      if ("error" in result) {
        setError(result.error);
      } else {
        setOpen(false);
        setRows([makeRow()]);
      }
    });
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="btn-gold"
        style={{ padding: "10px 24px", fontSize: 14, marginBottom: 32 }}
      >
        + Tambah Item Promo
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.78)",
            zIndex: 1000,
            overflowY: "auto",
            padding: "16px 12px",
          }}
          onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <style>{`
            .pf-g1 { display:grid; grid-template-columns:2fr 1fr 1fr; gap:12px; margin-bottom:12px; }
            .pf-g2 { display:grid; grid-template-columns:1fr 0.7fr 2fr; gap:12px; margin-bottom:12px; }
            .pf-g3 { display:grid; grid-template-columns:2fr 1fr; gap:12px; }
            @media (max-width:640px) {
              .pf-g1 { grid-template-columns:1fr 1fr; }
              .pf-g1-nama { grid-column:1/3; }
              .pf-g2 { grid-template-columns:1fr 1fr; }
              .pf-g2-kondisi { grid-column:1/3; }
              .pf-g3 { grid-template-columns:1fr; }
            }
          `}</style>
          <div style={{
            background: "#1E1A14",
            border: "1px solid rgba(201,168,76,.25)",
            borderRadius: 16,
            width: "100%",
            maxWidth: 980,
            margin: "0 auto",
            boxShadow: "0 32px 80px rgba(0,0,0,.8)",
          }}>

            {/* Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px",
              borderBottom: "1px solid rgba(201,168,76,.12)",
            }}>
              <h2 className="fd" style={{ fontSize: "1.25rem", color: "#EDE8DE", fontWeight: 400, margin: 0 }}>
                Tambah Item Promo
              </h2>
              <button
                onClick={handleClose}
                disabled={pending}
                style={{ background: "none", border: "none", color: "#5A5045", cursor: "pointer", fontSize: 24, lineHeight: 1, padding: "0 4px" }}
              >
                ×
              </button>
            </div>

            {/* Rows */}
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
              {rows.map((row, idx) => (
                <RowCard
                  key={row.key}
                  row={row}
                  index={idx}
                  canDelete={rows.length > 1}
                  onChange={(field, val) => updateRow(row.key, field, val)}
                  onDelete={() => removeRow(row.key)}
                />
              ))}

              <button
                type="button"
                onClick={addRow}
                style={{
                  background: "rgba(201,168,76,.04)",
                  border: "1px dashed rgba(201,168,76,.28)",
                  borderRadius: 10,
                  color: "#C9A84C",
                  padding: "12px",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  width: "100%",
                  letterSpacing: 0.3,
                }}
              >
                + Tambah Baris
              </button>
            </div>

            {/* Footer */}
            <div style={{
              padding: "14px 16px",
              borderTop: "1px solid rgba(201,168,76,.12)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                {error && <p style={{ color: "#EF5350", fontSize: 13, margin: 0 }}>{error}</p>}
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={handleClose}
                  disabled={pending}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,.1)",
                    color: "#7A6E5F",
                    borderRadius: 8,
                    padding: "10px 20px",
                    fontSize: 14,
                    cursor: "pointer",
                    fontFamily: "var(--font-dm-sans), sans-serif",
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={pending}
                  className="btn-gold"
                  style={{ padding: "10px 24px", fontSize: 14, opacity: pending ? 0.6 : 1 }}
                >
                  {pending ? "Menyimpan…" : `Simpan ${rows.length} Item`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
