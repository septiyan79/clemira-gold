"use client";

import { useState } from "react";

interface SharePriceButtonProps {
  date: string;
  sell1g: number | null;
  bb1g: number | null;
}

export default function SharePriceButton({ date, sell1g, bb1g }: SharePriceButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!date || (sell1g === null && bb1g === null)) return null;

  const handleShare = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/share-price-image?date=${date}`);
      if (!res.ok) throw new Error("Gagal mengambil gambar");

      const blob = await res.blob();
      const file = new File([blob], `clemira-gold-${date}.png`, { type: "image/png" });

      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Harga Emas Antam",
          text: `Update harga emas Antam dari Clemira Gold — ${date}`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `clemira-gold-${date}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError("Gagal membuat gambar. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, margin: "20px 0" }}>
      <button
        onClick={handleShare}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 28px",
          borderRadius: 8,
          background: loading ? "rgba(201,168,76,0.4)" : "linear-gradient(135deg, #C9A84C 0%, #E8D49A 50%, #C9A84C 100%)",
          color: "#1A1510",
          fontSize: 14,
          fontWeight: 500,
          cursor: loading ? "wait" : "pointer",
          border: "none",
          letterSpacing: 0.5,
          transition: "opacity 0.2s",
        }}
      >
        {loading ? (
          "Menyiapkan gambar..."
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            Bagikan ke WhatsApp
          </>
        )}
      </button>
      {error && (
        <p style={{ fontSize: 12, color: "#EF5350", margin: 0 }}>{error}</p>
      )}
      <p style={{ fontSize: 11, color: "#4A3E2E", margin: 0, letterSpacing: 0.5 }}>
        Gambar diunduh lalu dibagikan ke WhatsApp
      </p>
    </div>
  );
}
