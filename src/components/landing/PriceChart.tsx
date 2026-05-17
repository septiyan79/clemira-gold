"use client";

import { useState } from "react";

type Period = "1m" | "3m" | "1y";

const chartData: Record<Period, { line: string; area: string; low: string; high: string; pct1m: string; pct1y: string }> = {
  "1m": {
    line: "M0,200 L75,180 L150,190 L225,160 L300,150 L375,140 L450,160 L525,130 L600,110 L675,95 L750,80 L825,70 L900,65",
    area: "M0,200 L75,180 L150,190 L225,160 L300,150 L375,140 L450,160 L525,130 L600,110 L675,95 L750,80 L825,70 L900,65 L900,300 L0,300 Z",
    low: "Rp 1.095.000", high: "Rp 1.215.000", pct1m: "+8.2%", pct1y: "+21.4%",
  },
  "3m": {
    line: "M0,230 L112,210 L225,190 L337,175 L450,155 L562,130 L675,100 L787,80 L900,65",
    area: "M0,230 L112,210 L225,190 L337,175 L450,155 L562,130 L675,100 L787,80 L900,65 L900,300 L0,300 Z",
    low: "Rp 1.050.000", high: "Rp 1.215.000", pct1m: "+15.7%", pct1y: "+21.4%",
  },
  "1y": {
    line: "M0,260 L112,240 L225,220 L337,230 L450,200 L562,170 L675,140 L787,100 L900,65",
    area: "M0,260 L112,240 L225,220 L337,230 L450,200 L562,170 L675,140 L787,100 L900,65 L900,300 L0,300 Z",
    low: "Rp 975.000", high: "Rp 1.215.000", pct1m: "+8.2%", pct1y: "+21.4%",
  },
};

export default function PriceChart() {
  const [period, setPeriod] = useState<Period>("1m");
  const d = chartData[period];

  return (
    <section id="harga" style={{ padding: "64px 20px" }}>
      <div className="wrap">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36, flexWrap: "wrap", gap: 16 }}>
          <div>
            <p className="section-label">Pergerakan Harga</p>
            <h2 className="fd" style={{ fontSize: "2.2rem", fontWeight: 300, marginTop: 10, color: "#EDE8DE" }}>
              Tren Harga <em style={{ color: "var(--gold)" }}>Bulanan</em>
            </h2>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["1m", "3m", "1y"] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: "8px 18px", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-dm-sans), sans-serif", cursor: "pointer",
                border: period === p ? "1px solid rgba(201,168,76,.5)" : "1px solid rgba(255,255,255,.1)",
                background: period === p ? "rgba(201,168,76,.15)" : "transparent",
                color: period === p ? "var(--gold)" : "#7A6E5F",
                transition: "all .2s",
              }}>
                {p === "1m" ? "1 Bln" : p === "3m" ? "3 Bln" : "1 Thn"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, padding: 28, overflow: "hidden" }}>
          <svg viewBox="0 0 900 300" style={{ width: "100%", height: "auto", minHeight: 180, overflow: "visible" }}>
            <defs>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C9A84C" stopOpacity=".3" />
                <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[60, 120, 180, 240].map(y => <line key={y} x1="0" y1={y} x2="900" y2={y} stroke="rgba(255,255,255,.04)" strokeWidth="1" />)}
            <path d={d.area} fill="url(#goldGrad)" />
            <path d={d.line} fill="none" stroke="#C9A84C" strokeWidth="2.5" strokeLinejoin="round" />
            <circle cx="900" cy="65" r="5" fill="#C9A84C" />
            <circle cx="900" cy="65" r="10" fill="rgba(201,168,76,.2)" />
          </svg>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.06)" }}>
            {[
              { label: "Terendah", value: d.low },
              { label: "Tertinggi", value: d.high },
              { label: `Perubahan ${period === "1m" ? "1 Bln" : period === "3m" ? "3 Bln" : "1 Thn"}`, value: <span style={{ color: "#4CAF50" }}>▲ {d.pct1m}</span> },
              { label: "Perubahan 1 Thn", value: <span style={{ color: "#4CAF50" }}>▲ {d.pct1y}</span> },
            ].map(item => (
              <div key={item.label}>
                <p style={{ fontSize: 11, color: "#5A5045", marginBottom: 5 }}>{item.label}</p>
                <p className="fd" style={{ fontSize: "1.2rem", color: "#EDE8DE" }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
