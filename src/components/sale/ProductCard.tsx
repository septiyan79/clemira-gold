import type { CSSProperties } from "react";
import GoldBarIcon from "./GoldBarIcon";
import { type DailyPromoItem, formatRupiah } from "./promo-data";
import WhatsAppPopover from "@/components/shared/WhatsAppPopover";

const BADGE_LABELS: Record<string, string> = {
  flash:     "FLASH SALE",
  hot:       "HOT DEAL",
  available: "TERSEDIA",
  exclusive: "EKSKLUSIF",
};

const BADGE_STYLES: Record<string, CSSProperties> = {
  flash: {
    background: "linear-gradient(135deg,#C9A84C,#F0DC9A)",
    color: "#1A1200",
    fontWeight: 800,
    boxShadow: "0 2px 12px rgba(201,168,76,.4)",
  },
  hot: {
    background: "rgba(239,83,80,.18)",
    border: "1px solid rgba(239,83,80,.5)",
    color: "#FF6B6B",
    fontWeight: 700,
  },
  available: {
    background: "rgba(76,175,80,.15)",
    border: "1px solid rgba(76,175,80,.4)",
    color: "#69F0AE",
    fontWeight: 700,
  },
  exclusive: {
    background: "rgba(201,168,76,.18)",
    border: "1px solid rgba(201,168,76,.5)",
    color: "#E8D49A",
    fontWeight: 700,
  },
};

export default function ProductCard({ p }: { p: DailyPromoItem }) {
  const isLowStock  = p.stok <= 2;
  const isMedStock  = p.stok <= 5;
  const stokColor   = isLowStock ? "#FF5252" : isMedStock ? "#FFB300" : "#69F0AE";
  const badgeStyle  = BADGE_STYLES[p.badgeType] ?? BADGE_STYLES.available;
  const badgeLabel  = BADGE_LABELS[p.badgeType] ?? p.badgeType.toUpperCase();
  const waMessage   = `Halo, saya tertarik dengan ${p.nama} ${p.gramasi} seharga ${formatRupiah(p.hargaJual)} min!`;
  const diskon      = p.hargaNormal ? Math.round((1 - p.hargaJual / p.hargaNormal) * 100) : null;

  return (
    <div style={{
      background: "linear-gradient(175deg,#201B13 0%,#161210 100%)",
      border: "1px solid rgba(201,168,76,.18)",
      borderRadius: 20,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 8px 32px rgba(0,0,0,.5)",
      transition: "transform .3s ease, box-shadow .3s ease, border-color .3s ease",
    }} className="promo-card">

      {/* ── Hero zone ─────────────────────────────── */}
      <div style={{
        position: "relative",
        padding: "22px 24px 18px",
        background: "radial-gradient(ellipse 90% 80% at 50% 110%, rgba(201,168,76,.22) 0%, transparent 65%)",
        borderBottom: "1px solid rgba(201,168,76,.1)",
        overflow: "hidden",
      }}>

        {/* Corner shimmer lines */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg,transparent,rgba(201,168,76,.4),transparent)",
        }} />

        {/* Badge */}
        <div style={{ position: "absolute", top: 14, left: 14, zIndex: 2 }}>
          <span style={{
            ...badgeStyle,
            padding: "4px 11px",
            borderRadius: 20,
            fontSize: 9,
            letterSpacing: 2,
            textTransform: "uppercase",
            display: "inline-block",
          }}>{badgeLabel}</span>
        </div>

        {/* Diskon bubble */}
        {diskon !== null && (
          <div style={{ position: "absolute", top: 14, right: 14, zIndex: 2 }}>
            <span style={{
              background: "linear-gradient(135deg,#EF5350,#B71C1C)",
              color: "#fff",
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: .5,
              boxShadow: "0 2px 10px rgba(239,83,80,.4)",
              display: "inline-block",
            }}>-{diskon}%</span>
          </div>
        )}

        {/* Gold bar + glow */}
        <div style={{
          height: 118,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          margin: "8px 0 6px",
        }}>
          {/* Radial glow behind bar */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 60% 55% at 50% 55%, rgba(201,168,76,.28) 0%, transparent 70%)",
            filter: "blur(8px)",
            pointerEvents: "none",
          }} />
          <div style={{ width: 164, height: 103, position: "relative", zIndex: 1, filter: "drop-shadow(0 6px 16px rgba(201,168,76,.25))" }}>
            <GoldBarIcon gram={p.gramasi} />
          </div>
        </div>

        {/* Gramasi pill  +  stock indicator */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{
            background: "linear-gradient(135deg,rgba(201,168,76,.2),rgba(201,168,76,.08))",
            border: "1px solid rgba(201,168,76,.35)",
            color: "#E8D49A",
            borderRadius: 20,
            padding: "4px 14px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.2,
          }}>{p.gramasi}</span>

          <span style={{ fontSize: 11, color: stokColor, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{
              width: 7, height: 7,
              borderRadius: "50%",
              background: stokColor,
              display: "inline-block",
              boxShadow: `0 0 8px ${stokColor}`,
              flexShrink: 0,
            }} />
            {isLowStock
              ? `Sisa ${p.stok} keping!`
              : isMedStock
                ? `${p.stok} keping tersisa`
                : `Stok: ${p.stok}`}
          </span>
        </div>
      </div>

      {/* ── Content zone ──────────────────────────── */}
      <div style={{ padding: "18px 20px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>

        {/* Product name */}
        <h3 className="fd" style={{
          fontSize: "1.2rem",
          color: "#EDE8DE",
          fontWeight: 400,
          lineHeight: 1.3,
          margin: 0,
        }}>
          {p.nama}
        </h3>

        {/* Tags */}
        {p.tags.length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {p.tags.map(t => (
              <span key={t} style={{
                fontSize: 10,
                color: "#C9A84C",
                background: "rgba(201,168,76,.08)",
                border: "1px solid rgba(201,168,76,.2)",
                borderRadius: 4,
                padding: "3px 8px",
                letterSpacing: .3,
              }}>✓ {t}</span>
            ))}
          </div>
        )}

        {/* Kondisi */}
        {p.kondisi && (
          <p style={{
            fontSize: 12, color: "#5A5045",
            margin: 0, display: "flex", alignItems: "flex-start", gap: 6,
          }}>
            <span style={{ color: "rgba(201,168,76,.45)", flexShrink: 0, marginTop: 1 }}>◆</span>
            <span>{p.kondisi}</span>
          </p>
        )}

        {/* Deskripsi */}
        {p.deskripsi && (
          <p style={{ fontSize: 12.5, color: "#6A5E4F", lineHeight: 1.65, margin: 0 }}>
            {p.deskripsi}
          </p>
        )}

        <div style={{ flex: 1 }} />

        {/* ── Price block ── */}
        <div style={{
          background: "linear-gradient(135deg,rgba(201,168,76,.1),rgba(201,168,76,.03))",
          border: "1px solid rgba(201,168,76,.2)",
          borderRadius: 12,
          padding: "14px 16px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Subtle top shine */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 1,
            background: "linear-gradient(90deg,transparent,rgba(201,168,76,.3),transparent)",
          }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <p className="fd" style={{
              fontSize: "1.7rem",
              fontWeight: 600,
              lineHeight: 1,
              margin: 0,
              background: "linear-gradient(135deg,#E8D49A,#C9A84C)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              {formatRupiah(p.hargaJual)}
            </p>
            {p.hargaNormal && (
              <p style={{ fontSize: 12, color: "#3A342A", textDecoration: "line-through", margin: 0 }}>
                {formatRupiah(p.hargaNormal)}
              </p>
            )}
          </div>

          {p.hargaNormal && (
            <p style={{ fontSize: 11, color: "#4CAF50", margin: "8px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
              <span>↓</span> Hemat {formatRupiah(p.hargaNormal - p.hargaJual)}
            </p>
          )}
        </div>

        {/* ── WhatsApp CTA ── */}
        <WhatsAppPopover
          message={waMessage}
          label="Pesan via WhatsApp"
          className=""
          style={{
            width: "100%",
            padding: "13px 16px",
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: .4,
            background: "linear-gradient(135deg,rgba(37,211,102,.18),rgba(37,211,102,.08))",
            border: "1px solid rgba(37,211,102,.35)",
            borderRadius: 10,
            color: "#4ADE80",
            cursor: "pointer",
            fontFamily: "var(--font-dm-sans), sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
}
