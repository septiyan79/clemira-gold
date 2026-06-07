"use client";

import { useTransition } from "react";
import { deletePromo, type PromoRow } from "./actions";

const BADGE_LABELS: Record<string, string> = {
  flash:     "FLASH SALE",
  hot:       "HOT DEAL",
  available: "TERSEDIA",
  exclusive: "EKSKLUSIF",
};

const BADGE_COLORS: Record<string, { color: string; background: string; border: string }> = {
  flash:     { color: "#1A1612",   background: "linear-gradient(135deg,#C9A84C,#E8D49A)", border: "none" },
  hot:       { color: "#EF5350",   background: "rgba(239,83,80,.15)",  border: "1px solid rgba(239,83,80,.4)"   },
  available: { color: "#4CAF50",   background: "rgba(76,175,80,.12)",  border: "1px solid rgba(76,175,80,.3)"   },
  exclusive: { color: "#C9A84C",   background: "rgba(201,168,76,.15)", border: "1px solid rgba(201,168,76,.4)"  },
};

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function PromoTable({ promos }: { promos: PromoRow[] }) {
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
        <p style={{ fontSize: 12 }}>Tambahkan item menggunakan form di atas.</p>
      </div>
    );
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deletePromo(id);
    });
  }

  return (
    <div style={{ overflowX: "auto" }}>
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
          {promos.map(p => {
            const badge = BADGE_COLORS[p.badgeType] ?? BADGE_COLORS.available;
            return (
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
                    ...badge,
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontSize: 10,
                    letterSpacing: 1.2,
                    fontWeight: 700,
                    display: "inline-block",
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
