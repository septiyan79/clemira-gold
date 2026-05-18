"use client";

import { useState, useEffect } from "react";

type Period = "1m" | "3m" | "1y";
type DataPoint = { date: string; sell: number | null; bb: number | null };

const SVG_W = 900;
const SVG_H = 280;

function toX(i: number, n: number) {
  return n <= 1 ? SVG_W / 2 : (i / (n - 1)) * SVG_W;
}

function toY(val: number, lo: number, hi: number) {
  return 20 + ((hi - val) / (hi - lo || 1)) * 240;
}

function buildLine(data: DataPoint[], key: "sell" | "bb", n: number, lo: number, hi: number): string {
  let path = "";
  let fresh = true;
  for (let i = 0; i < data.length; i++) {
    const val = data[i][key];
    if (val === null) { fresh = true; continue; }
    const x = toX(i, n).toFixed(1);
    const y = toY(val, lo, hi).toFixed(1);
    path += fresh ? `M${x},${y}` : ` L${x},${y}`;
    fresh = false;
  }
  return path;
}

function buildArea(data: DataPoint[], key: "sell" | "bb", n: number, lo: number, hi: number): string {
  const line = buildLine(data, key, n, lo, hi);
  if (!line) return "";
  const pts = data
    .map((d, i) => d[key] !== null ? { x: toX(i, n), y: toY(d[key]!, lo, hi) } : null)
    .filter((p): p is { x: number; y: number } => p !== null);
  if (pts.length < 2) return "";
  const last = pts[pts.length - 1];
  const first = pts[0];
  return `${line} L${last.x.toFixed(1)},${SVG_H} L${first.x.toFixed(1)},${SVG_H} Z`;
}

function formatRp(v: number) {
  return "Rp " + v.toLocaleString("id-ID");
}

export default function PriceChart() {
  const [period, setPeriod] = useState<Period>("1m");
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/chart-data?period=${period}`)
      .then((r) => r.json())
      .then((d: DataPoint[]) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const sells = data.map((d) => d.sell).filter((v): v is number => v !== null);
  const bbs   = data.map((d) => d.bb).filter((v): v is number => v !== null);
  const all   = [...sells, ...bbs];

  const rawMin = all.length ? Math.min(...all) : 0;
  const rawMax = all.length ? Math.max(...all) : 1;
  const pad = (rawMax - rawMin) * 0.08;
  const lo = rawMin - pad;
  const hi = rawMax + pad;

  const n = data.length;

  const lineSell = buildLine(data, "sell", n, lo, hi);
  const areaSell = buildArea(data, "sell", n, lo, hi);
  const lineBb   = buildLine(data, "bb",   n, lo, hi);

  const lastSellPt = data.reduceRight<{ x: number; y: number } | null>((acc, d, i) => {
    if (acc || d.sell === null) return acc;
    return { x: toX(i, n), y: toY(d.sell, lo, hi) };
  }, null);

  const firstSell = sells[0] ?? null;
  const lastSell  = sells[sells.length - 1] ?? null;
  const lastBb    = bbs[bbs.length - 1] ?? null;

  const changePct = firstSell && lastSell && firstSell > 0
    ? ((lastSell - firstSell) / firstSell) * 100
    : null;
  const changeAmt = firstSell && lastSell ? lastSell - firstSell : null;

  const periodLabel = period === "1m" ? "1 Bln" : period === "3m" ? "3 Bln" : "1 Thn";

  return (
    <section id="harga" style={{ padding: "64px 20px" }}>
      <div className="wrap">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36, flexWrap: "wrap", gap: 16 }}>
          <div>
            <p className="section-label">Pergerakan Harga</p>
            <h2 className="fd" style={{ fontSize: "2.2rem", fontWeight: 300, marginTop: 10, color: "#EDE8DE" }}>
              Tren Harga <em style={{ color: "var(--gold)" }}>Antam 1g</em>
            </h2>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["1m", "3m", "1y"] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: "8px 18px", borderRadius: 6, fontSize: 13,
                fontFamily: "var(--font-dm-sans), sans-serif", cursor: "pointer",
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
          {/* Legend */}
          <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="28" height="10"><line x1="0" y1="5" x2="28" y2="5" stroke="#C9A84C" strokeWidth="2.5" /></svg>
              <span style={{ fontSize: 12, color: "#9A8E7E" }}>Harga Jual</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="28" height="10"><line x1="0" y1="5" x2="28" y2="5" stroke="rgba(107,175,120,0.8)" strokeWidth="1.8" strokeDasharray="5 3" /></svg>
              <span style={{ fontSize: 12, color: "#9A8E7E" }}>Buyback</span>
            </div>
          </div>

          {/* Chart */}
          <div style={{ opacity: loading ? 0.4 : 1, transition: "opacity .3s" }}>
            <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: "100%", height: "auto", minHeight: 180, overflow: "visible" }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C9A84C" stopOpacity=".22" />
                  <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75].map((f) => {
                const y = 20 + f * 240;
                return <line key={f} x1="0" y1={y} x2={SVG_W} y2={y} stroke="rgba(255,255,255,.04)" strokeWidth="1" />;
              })}
              {areaSell && <path d={areaSell} fill="url(#goldGrad)" />}
              {lineSell  && <path d={lineSell}  fill="none" stroke="#C9A84C"              strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
              {lineBb    && <path d={lineBb}    fill="none" stroke="rgba(107,175,120,.8)" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="5 3" />}
              {lastSellPt && (
                <>
                  <circle cx={lastSellPt.x} cy={lastSellPt.y} r="5"  fill="#C9A84C" />
                  <circle cx={lastSellPt.x} cy={lastSellPt.y} r="10" fill="rgba(201,168,76,.2)" />
                </>
              )}
            </svg>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.06)" }}>
            <div>
              <p style={{ fontSize: 11, color: "#5A5045", marginBottom: 5 }}>Terendah {periodLabel}</p>
              <p className="fd" style={{ fontSize: "1.1rem", color: "#EDE8DE" }}>{sells.length ? formatRp(Math.min(...sells)) : "—"}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: "#5A5045", marginBottom: 5 }}>Tertinggi {periodLabel}</p>
              <p className="fd" style={{ fontSize: "1.1rem", color: "#EDE8DE" }}>{sells.length ? formatRp(Math.max(...sells)) : "—"}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: "#5A5045", marginBottom: 5 }}>Perubahan {periodLabel}</p>
              <p className="fd" style={{ fontSize: "1.1rem" }}>
                {changePct !== null && changeAmt !== null ? (
                  <span style={{ color: changePct >= 0 ? "#4CAF50" : "#EF5350" }}>
                    {changePct >= 0 ? "▲" : "▼"} {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
                    <br />
                    <span style={{ fontSize: "0.85rem" }}>
                      ({changeAmt >= 0 ? "+" : "-"}Rp {Math.abs(changeAmt).toLocaleString("id-ID")})
                    </span>
                  </span>
                ) : "—"}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: "#5A5045", marginBottom: 5 }}>Buyback 1g Terkini</p>
              <p className="fd" style={{ fontSize: "1.1rem", color: "#EDE8DE" }}>{lastBb ? formatRp(lastBb) : "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
