import type { CSSProperties } from "react";
import GoldBarIcon from "./GoldBarIcon";
import { type PromoProduct, type BadgeType, formatRupiah } from "./promo-data";

const BADGE_STYLES: Record<BadgeType, CSSProperties> = {
  flash: {
    background: "linear-gradient(135deg,#C9A84C,#E8D49A)",
    color: "#1A1612",
    fontWeight: 700,
  },
  hot: {
    background: "rgba(239,83,80,.15)",
    border: "1px solid rgba(239,83,80,.4)",
    color: "#EF5350",
    fontWeight: 600,
  },
  available: {
    background: "rgba(76,175,80,.12)",
    border: "1px solid rgba(76,175,80,.3)",
    color: "#4CAF50",
    fontWeight: 600,
  },
  exclusive: {
    background: "rgba(201,168,76,.15)",
    border: "1px solid rgba(201,168,76,.4)",
    color: "#C9A84C",
    fontWeight: 600,
  },
};

export default function ProductCard({ p }: { p: PromoProduct }) {
  const stokColor = p.stok <= 2 ? "#EF5350" : p.stok <= 5 ? "#FF9800" : "#4CAF50";
  const waText = `Halo,%20saya%20tertarik%20dengan%20${encodeURIComponent(p.name)}%20seharga%20${encodeURIComponent(formatRupiah(p.hargaJual))}%20min!`;

  return (
    <div style={{
      background: "linear-gradient(160deg,rgba(201,168,76,.1),rgba(26,22,18,1) 70%)",
      border: "1px solid rgba(201,168,76,.25)",
      borderRadius: 14,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      transition: "transform .25s, border-color .25s",
    }} className="promo-card">

      {/* Photo area */}
      <div style={{
        background: "radial-gradient(ellipse at 50% 40%,rgba(201,168,76,.15) 0%,rgba(26,22,18,.8) 80%)",
        padding: "28px 32px 20px",
        position: "relative",
      }}>
        <div style={{ position: "absolute", top: 14, left: 14 }}>
          <span style={{
            ...BADGE_STYLES[p.badgeType],
            padding: "4px 12px",
            borderRadius: 20,
            fontSize: 10,
            letterSpacing: 1.5,
            display: "inline-block",
          }}>{p.badge}</span>
        </div>
        <div style={{ position: "absolute", top: 14, right: 14 }}>
          <span style={{
            background: "rgba(239,83,80,.15)",
            border: "1px solid rgba(239,83,80,.4)",
            color: "#EF5350",
            padding: "4px 10px",
            borderRadius: 20,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1,
          }}>-{p.diskon}%</span>
        </div>
        <div style={{ height: 110, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 170, height: 106 }}>
            <GoldBarIcon gram={p.gramasi} />
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <span style={{ fontSize: 11, color: stokColor, letterSpacing: 1 }}>
            {p.stok <= 2 ? "⚠ " : "● "}Stok: {p.stok} keping
          </span>
        </div>
      </div>

      {/* Info area */}
      <div style={{ padding: "20px 22px 22px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 className="fd" style={{ fontSize: "1.25rem", color: "#EDE8DE", fontWeight: 400, marginBottom: 8, lineHeight: 1.3 }}>
          {p.name}
        </h3>
        <p style={{ fontSize: 13, color: "#7A6E5F", lineHeight: 1.65, marginBottom: 14, flex: 1 }}>{p.desc}</p>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {p.tag.map(t => (
            <span key={t} style={{
              fontSize: 10,
              color: "#6A5E4F",
              background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 4,
              padding: "3px 8px",
              letterSpacing: .5,
            }}>{t}</span>
          ))}
        </div>

        {/* Price block */}
        <div style={{
          background: "rgba(201,168,76,.07)",
          border: "1px solid rgba(201,168,76,.18)",
          borderRadius: 8,
          padding: "12px 14px",
          marginBottom: 16,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <p style={{ fontSize: 10, color: "#5A5045", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>
                Harga Promo
              </p>
              <p className="fd" style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--gold)", lineHeight: 1 }}>
                {formatRupiah(p.hargaJual)}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 10, color: "#5A5045", letterSpacing: 1, marginBottom: 2 }}>Normal</p>
              <p style={{ fontSize: 13, color: "#5A5045", textDecoration: "line-through" }}>
                {formatRupiah(p.hargaNormal)}
              </p>
            </div>
          </div>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(201,168,76,.12)" }}>
            <p style={{ fontSize: 11, color: "#4CAF50" }}>
              Hemat {formatRupiah(p.hargaNormal - p.hargaJual)}
            </p>
          </div>
        </div>

        <a
          href={`https://wa.me/6285975459997?text=${waText}`}
          target="_blank"
          rel="noreferrer"
          className="btn-gold"
          style={{ width: "100%", fontSize: 14, padding: "12px 16px" }}
        >
          Pesan via WhatsApp →
        </a>
      </div>
    </div>
  );
}
