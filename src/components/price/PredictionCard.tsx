"use client";

import { fmt, formatDateShort, DiffCell } from "./shared";
import type { PredictionData } from "./shared";

interface PredictionCardProps extends PredictionData {
  todaySell?: number | null;
}

export default function PredictionCard({
  predictedDate,
  predictedSell,
  lower,
  upper,
  basedOnDate,
  todaySell,
}: PredictionCardProps) {
  const diff = todaySell != null ? predictedSell - todaySell : null;
  const up = diff == null || diff >= 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    <div
      style={{
        padding: "16px 20px",
        borderRadius: 10,
        background: "rgba(100,120,200,.06)",
        border: "1px dashed rgba(100,120,200,.3)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <div>
        <p
          style={{
            fontSize: 11,
            letterSpacing: 1.5,
            color: "#5A5045",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          Prediksi {formatDateShort(predictedDate)}
        </p>
        <p
          className="fd"
          style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            color: up ? "rgba(150,170,240,.9)" : "rgba(240,150,150,.9)",
            marginBottom: 6,
          }}
        >
          {fmt(predictedSell)}
        </p>
        <p style={{ fontSize: 11, color: "#4A3E2E", marginBottom: 6 }}>
          Range: {fmt(lower)} – {fmt(upper)}
        </p>
        <DiffCell diff={diff} />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 11,
            padding: "3px 8px",
            borderRadius: 20,
            border: "1px solid rgba(100,120,200,.3)",
            color: "rgba(150,170,240,.7)",
            whiteSpace: "nowrap",
          }}
        >
          Estimasi
        </span>
        <span
          style={{
            fontSize: 10,
            color: "#4A3E2E",
            marginTop: "auto",
            textAlign: "right",
          }}
        >
          Berdasarkan data
          <br />
          {formatDateShort(basedOnDate)}
        </span>
      </div>
    </div>
    <p style={{ fontSize: 11, color: "rgba(255,200,50,.7)", lineHeight: 1.5 }}>
      ⚠ Prediksi menggunakan Holt&apos;s Double Exponential Smoothing. Bukan saran investasi.
    </p>
    </div>
  );
}
