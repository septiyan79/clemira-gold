"use client";

import { useState } from "react";

type PriceEntry = { jual: number | null; buyback: number | null };

interface Props {
  prices: Record<string, PriceEntry>;
}

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

interface CalcResult {
  gram: number;
  antamGross: number;
  pph: number;
  meterai: number;
  antamNet: number;
  clemira: number;
  selisih: number;
}

function hitungBuyback(gram: number, bb1g: number): CalcResult {
  const antamGross = bb1g * gram;
  const pph       = antamGross > 10_000_000 ? antamGross * 0.015 : 0;
  const meterai   = antamGross > 5_000_000  ? 10_000 : 0;
  const antamNet  = antamGross - pph - meterai;
  const clemira   = bb1g * 1.02 * gram;
  const selisih   = clemira - antamNet;
  return { gram, antamGross, pph, meterai, antamNet, clemira, selisih };
}

export default function Calculator({ prices }: Props) {
  const bb1g = prices["1"]?.buyback ?? null;

  const [grams, setGrams]   = useState("");
  const [result, setResult] = useState<CalcResult | null>(null);

  const handleHitung = () => {
    const g = parseFloat(grams);
    if (!g || g <= 0 || !bb1g) return;
    setResult(hitungBuyback(g, bb1g));
  };

  const noData = bb1g === null;

  return (
    <section id="kalkulator" style={{ padding: "64px 20px", background: "radial-gradient(ellipse 80% 60% at 50% 50%,rgba(201,168,76,.06) 0%,transparent 70%)" }}>
      <div className="wrap">

        {/* Header + Form */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "flex-start" }} className="kalk-grid">

          {/* Kiri */}
          <div>
            <p className="section-label">Kalkulator Buyback</p>
            <h2 className="fd" style={{ fontSize: "2.2rem", fontWeight: 300, margin: "14px 0", color: "#EDE8DE", lineHeight: 1.2 }}>
              Hitung Estimasi <em style={{ color: "var(--gold)" }}>Buyback</em><br />Emas Anda
            </h2>
            <p style={{ color: "#7A6E5F", lineHeight: 1.75, fontSize: 15, marginBottom: 28 }}>
              Bandingkan hasil jual kembali emas Antam antara prosedur resmi Antam dan Clemira Gold — lebih transparan, tanpa biaya tersembunyi.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "#7A6E5F", marginBottom: 8, display: "block" }}>
                  Total Gram yang Dijual
                </label>
                <input
                  type="number"
                  className="ci"
                  placeholder="Contoh: 5"
                  value={grams}
                  min={0.1}
                  step={0.1}
                  onChange={(e) => { setGrams(e.target.value); setResult(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleHitung()}
                />
              </div>

              {bb1g && (
                <p style={{ fontSize: 12, color: "#5A5045" }}>
                  Harga buyback terkini: <span style={{ color: "var(--gold)" }}>{fmt(bb1g)}</span> / gram
                </p>
              )}

              <button
                onClick={handleHitung}
                disabled={noData || !grams}
                className="btn-gold"
                style={{ alignSelf: "flex-start", cursor: noData ? "not-allowed" : "pointer", opacity: noData ? 0.5 : 1 }}
              >
                {noData ? "Data belum tersedia" : "Hitung Sekarang"}
              </button>
            </div>
          </div>

          {/* Kanan — placeholder sebelum hitung */}
          {!result && (
            <div className="price-card" style={{ borderRadius: 16, padding: 32, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: 240, gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "var(--gold)" }}>◎</div>
              <p style={{ fontSize: 14, color: "#5A5045", textAlign: "center", lineHeight: 1.7 }}>
                Masukkan jumlah gram<br />dan klik <strong style={{ color: "#7A6E5F" }}>Hitung Sekarang</strong>
              </p>
            </div>
          )}

          {/* Kanan — hasil hitung */}
          {result && (
            <div className="price-card" style={{ borderRadius: 16, padding: 28 }}>
              <p style={{ fontSize: 11, letterSpacing: 2, color: "#5A5045", textTransform: "uppercase", marginBottom: 20 }}>
                Estimasi Penerimaan · {result.gram} gram
              </p>

              {/* Antam */}
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                <p style={{ fontSize: 12, color: "#7A6E5F", marginBottom: 10, fontWeight: 500 }}>Buyback Antam</p>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6A5E4F", marginBottom: 5 }}>
                  <span>Harga ({result.gram} gr)</span>
                  <span>{fmt(result.antamGross)}</span>
                </div>
                {result.pph > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#EF5350", marginBottom: 5 }}>
                    <span>PPh 22 <span style={{ color: "#5A5045" }}>(1.5%)</span></span>
                    <span>- {fmt(result.pph)}</span>
                  </div>
                )}
                {result.meterai > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#EF5350", marginBottom: 5 }}>
                    <span>Meterai</span>
                    <span>- {fmt(result.meterai)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, color: "#9A8E7E", fontWeight: 600, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,.05)", marginTop: 4 }}>
                  <span>Total Diterima</span>
                  <span className="fd">{fmt(result.antamNet)}</span>
                </div>
              </div>

              {/* Clemira */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <p style={{ fontSize: 12, color: "#7A6E5F", fontWeight: 500 }}>Buyback Clemira Gold</p>
                  <span style={{ fontSize: 10, background: "rgba(201,168,76,.15)", border: "1px solid rgba(201,168,76,.3)", borderRadius: 4, padding: "2px 8px", color: "var(--gold)", letterSpacing: 1 }}>+2% · TANPA POTONGAN</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6A5E4F", marginBottom: 5 }}>
                  <span>Harga ({result.gram} gr)</span>
                  <span>{fmt(result.clemira)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#5A5045", marginBottom: 5 }}>
                  <span>PPh 22</span><span>Rp 0</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#5A5045", marginBottom: 8 }}>
                  <span>Meterai</span><span>Rp 0</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.5rem", fontWeight: 600, paddingTop: 8, borderTop: "1px solid rgba(201,168,76,.15)" }}>
                  <span style={{ fontSize: 14, color: "#7A6E5F", alignSelf: "center" }}>Total Diterima</span>
                  <span className="fd" style={{ color: "var(--gold)" }}>{fmt(result.clemira)}</span>
                </div>
              </div>

              {/* Selisih */}
              <div style={{ background: "rgba(76,175,80,.08)", border: "1px solid rgba(76,175,80,.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#4CAF50" }}>Keuntungan vs Antam</span>
                <span className="fd" style={{ fontSize: 15, color: "#4CAF50", fontWeight: 600 }}>+ {fmt(result.selisih)}</span>
              </div>

              <a
                href="https://wa.me/6285975459997?text=Halo,%20Mau%20info%20Buyback%20Antam%20nya%20min!"
                target="_blank"
                rel="noreferrer"
                className="btn-gold"
                style={{ width: "100%", display: "block" }}
              >
                ☏ Hubungi Kami →
              </a>
            </div>
          )}
        </div>
      </div>
      <style>{`@media(max-width:900px){.kalk-grid{grid-template-columns:1fr !important;gap:32px !important}}`}</style>
    </section>
  );
}
