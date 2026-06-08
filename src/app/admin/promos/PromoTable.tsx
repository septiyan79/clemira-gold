"use client";

import { useState, useTransition } from "react";
import { deletePromo, updatePromo, type PromoRow } from "./actions";

const GRAMASI_OPTIONS = ["0.5g", "1g", "2g", "5g", "10g", "25g", "50g", "100g"];
const BADGE_OPTIONS = [
  { value: "flash",     label: "FLASH SALE" },
  { value: "hot",       label: "HOT DEAL"   },
  { value: "available", label: "TERSEDIA"   },
  { value: "exclusive", label: "EKSKLUSIF"  },
];

const BADGE_LABELS: Record<string, string> = {
  flash:     "FLASH SALE",
  hot:       "HOT DEAL",
  available: "TERSEDIA",
  exclusive: "EKSKLUSIF",
};

const BADGE_COLORS: Record<string, { color: string; background: string; border: string }> = {
  flash:     { color: "#1A1612",  background: "linear-gradient(135deg,#C9A84C,#E8D49A)", border: "none"                        },
  hot:       { color: "#EF5350",  background: "rgba(239,83,80,.15)",                     border: "1px solid rgba(239,83,80,.4)"  },
  available: { color: "#4CAF50",  background: "rgba(76,175,80,.12)",                     border: "1px solid rgba(76,175,80,.3)"  },
  exclusive: { color: "#C9A84C",  background: "rgba(201,168,76,.15)",                    border: "1px solid rgba(201,168,76,.4)" },
};

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,.04)",
  border: "1px solid rgba(201,168,76,.2)",
  borderRadius: 6,
  color: "#EDE8DE",
  padding: "7px 10px",
  fontSize: 13,
  fontFamily: "var(--font-dm-sans), sans-serif",
  boxSizing: "border-box",
};

const lbl10: React.CSSProperties = {
  fontSize: 10,
  color: "#5A5045",
  letterSpacing: 1,
  textTransform: "uppercase",
  display: "block",
  marginBottom: 4,
};

// Shared edit form — twoCol=true for mobile 2-column layout
function EditPromoForm({ promo, onDone, twoCol }: { promo: PromoRow; onDone: () => void; twoCol?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updatePromo(promo.id, formData);
      if ("error" in result) setError(result.error);
      else onDone();
    });
  }

  const g1cols = twoCol ? "1fr 1fr" : "2fr 1fr 1fr 1fr 1fr";
  const g2cols = twoCol ? "1fr 1fr" : "2fr 2fr 1fr";

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "grid", gridTemplateColumns: g1cols, gap: 10, marginBottom: 10 }}>
        <div style={twoCol ? { gridColumn: "1 / 3" } : {}}>
          <label style={lbl10}>Nama *</label>
          <input name="nama" required defaultValue={promo.nama} style={inputStyle} />
        </div>
        <div>
          <label style={lbl10}>Gramasi *</label>
          <select name="gramasi" required defaultValue={promo.gramasi} style={{ ...inputStyle, cursor: "pointer" }}>
            {GRAMASI_OPTIONS.map(g => (
              <option key={g} value={g} style={{ background: "#1A1612", color: "#EDE8DE" }}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={lbl10}>Badge *</label>
          <select name="badgeType" required defaultValue={promo.badgeType} style={{ ...inputStyle, cursor: "pointer" }}>
            {BADGE_OPTIONS.map(b => (
              <option key={b.value} value={b.value} style={{ background: "#1A1612", color: "#EDE8DE" }}>{b.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={lbl10}>Harga Jual *</label>
          <input name="hargaJual" type="number" required min={1} defaultValue={promo.hargaJual} style={inputStyle} />
        </div>
        <div>
          <label style={lbl10}>Stok</label>
          <input name="stok" type="number" min={1} defaultValue={promo.stok} style={inputStyle} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: g2cols, gap: 10, marginBottom: 12 }}>
        <div>
          <label style={lbl10}>Kondisi Fisik</label>
          <input name="kondisi" defaultValue={promo.kondisi ?? ""} placeholder="kulit ari mulus / ada goresan" style={inputStyle} />
        </div>
        <div>
          <label style={lbl10}>Deskripsi</label>
          <input name="deskripsi" defaultValue={promo.deskripsi ?? ""} style={inputStyle} />
        </div>
        <div style={twoCol ? { gridColumn: "1 / 3" } : {}}>
          <label style={lbl10}>Tags (pisah koma)</label>
          <input name="tags" defaultValue={promo.tags.join(", ")} style={inputStyle} />
        </div>
      </div>

      {error && <p style={{ color: "#EF5350", fontSize: 12, marginBottom: 10 }}>{error}</p>}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="submit"
          disabled={pending}
          className="btn-gold"
          style={{ padding: "7px 20px", fontSize: 13, opacity: pending ? 0.6 : 1 }}
        >
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={pending}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,.12)",
            color: "#7A6E5F",
            borderRadius: 6,
            padding: "7px 16px",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "var(--font-dm-sans), sans-serif",
          }}
        >
          Batal
        </button>
      </div>
    </form>
  );
}

// Desktop: edit row expands inside the table
function EditRow({ promo, onDone }: { promo: PromoRow; onDone: () => void }) {
  return (
    <tr style={{ background: "rgba(201,168,76,.04)", borderBottom: "2px solid rgba(201,168,76,.25)" }}>
      <td colSpan={7} style={{ padding: "16px 12px" }}>
        <EditPromoForm promo={promo} onDone={onDone} />
      </td>
    </tr>
  );
}

// Mobile: edit form as a card
function MobileEditCard({ promo, onDone }: { promo: PromoRow; onDone: () => void }) {
  return (
    <div style={{
      background: "rgba(201,168,76,.04)",
      border: "2px solid rgba(201,168,76,.25)",
      borderRadius: 12,
      padding: "16px",
    }}>
      <p style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 1, textTransform: "uppercase", margin: "0 0 12px" }}>
        Edit Item
      </p>
      <EditPromoForm promo={promo} onDone={onDone} twoCol />
    </div>
  );
}

// Mobile: display card
function PromoCard({ p, onEdit, onDelete, isPending }: {
  p: PromoRow;
  onEdit: () => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  const bc = BADGE_COLORS[p.badgeType] ?? BADGE_COLORS.available;
  const bl = BADGE_LABELS[p.badgeType] ?? p.badgeType.toUpperCase();
  const stokColor = p.stok <= 2 ? "#EF5350" : p.stok <= 5 ? "#FF9800" : "#4CAF50";

  return (
    <div style={{
      background: "rgba(255,255,255,.02)",
      border: "1px solid rgba(201,168,76,.12)",
      borderRadius: 12,
      padding: "16px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span style={{
          ...bc,
          padding: "2px 7px",
          borderRadius: 20,
          fontSize: 8,
          letterSpacing: 1,
          fontWeight: 700,
          display: "inline-block",
          textTransform: "uppercase",
        }}>{bl}</span>
        <span style={{ color: "var(--gold)", fontWeight: 600, fontSize: 15 }}>
          {formatRp(p.hargaJual)}
        </span>
      </div>

      <p style={{ color: "#EDE8DE", fontWeight: 500, fontSize: 14, margin: "0 0 6px" }}>{p.nama}</p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "#7A6E5F" }}>{p.gramasi}</span>
        <span style={{ fontSize: 11, color: stokColor }}>
          {p.stok <= 2 ? `Sisa ${p.stok} keping!` : `${p.stok} keping`}
        </span>
      </div>

      {p.kondisi && (
        <p style={{ fontSize: 12, color: "#5A5045", margin: "0 0 6px" }}>{p.kondisi}</p>
      )}

      {p.tags.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 4 }}>
          {p.tags.map(t => (
            <span key={t} style={{
              fontSize: 10, color: "#6A5E4F",
              background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 4, padding: "2px 6px",
            }}>{t}</span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12, borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 12 }}>
        <button
          onClick={onEdit}
          disabled={isPending}
          style={{
            flex: 1,
            background: "rgba(201,168,76,.1)",
            border: "1px solid rgba(201,168,76,.3)",
            color: "var(--gold)",
            borderRadius: 8,
            padding: "8px",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "var(--font-dm-sans), sans-serif",
            opacity: isPending ? 0.5 : 1,
          }}
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          disabled={isPending}
          style={{
            flex: 1,
            background: "rgba(239,83,80,.1)",
            border: "1px solid rgba(239,83,80,.3)",
            color: "#EF5350",
            borderRadius: 8,
            padding: "8px",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "var(--font-dm-sans), sans-serif",
            opacity: isPending ? 0.5 : 1,
          }}
        >
          Hapus
        </button>
      </div>
    </div>
  );
}

export default function PromoTable({ promos }: { promos: PromoRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (promos.length === 0) {
    return (
      <div style={{
        textAlign: "center",
        padding: "48px 24px",
        color: "#5A5045",
        background: "rgba(255,255,255,.02)",
        border: "1px solid rgba(201,168,76,.1)",
        borderRadius: 12,
      }}>
        <p style={{ fontSize: 14, marginBottom: 8 }}>Belum ada item promo hari ini.</p>
        <p style={{ fontSize: 12 }}>Tambahkan item menggunakan tombol di atas.</p>
      </div>
    );
  }

  function handleDelete(id: string) {
    startTransition(async () => { await deletePromo(id); });
  }

  return (
    <>
      <style>{`
        .promo-tbl  { display: block; }
        .promo-cards { display: none;  }
        @media (max-width: 640px) {
          .promo-tbl  { display: none; }
          .promo-cards { display: flex; flex-direction: column; gap: 12px; }
        }
      `}</style>

      {/* ── Desktop table ── */}
      <div className="promo-tbl" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(201,168,76,.15)" }}>
              {["Nama", "Gramasi", "Badge", "Harga Jual", "Stok", "Kondisi", ""].map(h => (
                <th key={h} style={{
                  padding: "10px 12px",
                  textAlign: "left",
                  fontSize: 11,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  color: "#5A5045",
                  fontWeight: 600,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {promos.map(p => (
              <>
                {editingId === p.id ? (
                  <EditRow key={`edit-${p.id}`} promo={p} onDone={() => setEditingId(null)} />
                ) : (
                  <tr key={p.id} className="adm-tr-hover" style={{ borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                    <td style={{ padding: "12px", color: "#EDE8DE" }}>
                      <div style={{ fontWeight: 500 }}>{p.nama}</div>
                      {p.deskripsi && (
                        <div style={{ fontSize: 12, color: "#5A5045", marginTop: 3 }}>{p.deskripsi}</div>
                      )}
                      {p.tags.length > 0 && (
                        <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                          {p.tags.map(t => (
                            <span key={t} style={{
                              fontSize: 10, color: "#6A5E4F",
                              background: "rgba(255,255,255,.04)",
                              border: "1px solid rgba(255,255,255,.08)",
                              borderRadius: 4, padding: "2px 6px",
                            }}>{t}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px", color: "#EDE8DE" }}>{p.gramasi}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        ...(BADGE_COLORS[p.badgeType] ?? BADGE_COLORS.available),
                        padding: "2px 7px",
                        borderRadius: 20,
                        fontSize: 8,
                        letterSpacing: 1,
                        fontWeight: 700,
                        display: "inline-block",
                        textTransform: "uppercase",
                      }}>
                        {BADGE_LABELS[p.badgeType] ?? p.badgeType.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "12px", color: "var(--gold)", fontWeight: 600 }}>
                      {formatRp(p.hargaJual)}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ color: p.stok <= 2 ? "#EF5350" : p.stok <= 5 ? "#FF9800" : "#4CAF50" }}>
                        {p.stok} keping
                      </span>
                    </td>
                    <td style={{ padding: "12px", color: "#7A6E5F", fontSize: 13 }}>
                      {p.kondisi ?? "—"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => setEditingId(p.id)}
                          disabled={pending}
                          style={{
                            background: "rgba(201,168,76,.1)",
                            border: "1px solid rgba(201,168,76,.3)",
                            color: "var(--gold)",
                            borderRadius: 6,
                            padding: "5px 12px",
                            fontSize: 12,
                            cursor: "pointer",
                            opacity: pending ? 0.5 : 1,
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={pending}
                          style={{
                            background: "rgba(239,83,80,.12)",
                            border: "1px solid rgba(239,83,80,.3)",
                            color: "#EF5350",
                            borderRadius: 6,
                            padding: "5px 12px",
                            fontSize: 12,
                            cursor: "pointer",
                            opacity: pending ? 0.5 : 1,
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ── */}
      <div className="promo-cards">
        {promos.map(p => (
          editingId === p.id
            ? <MobileEditCard key={p.id} promo={p} onDone={() => setEditingId(null)} />
            : <PromoCard
                key={p.id}
                p={p}
                onEdit={() => setEditingId(p.id)}
                onDelete={() => handleDelete(p.id)}
                isPending={pending}
              />
        ))}
      </div>
    </>
  );
}
