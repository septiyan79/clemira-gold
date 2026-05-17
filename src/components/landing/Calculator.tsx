"use client";

import { useState } from "react";

const prices: Record<string, { jual: number; buyback: number }> = {
  "0.5": { jual: 610000, buyback: 555000 },
  "1":   { jual: 1185000, buyback: 1090000 },
  "2":   { jual: 2295000, buyback: 2105000 },
  "5":   { jual: 5660000, buyback: 5210000 },
  "10":  { jual: 11200000, buyback: 10300000 },
  "25":  { jual: 27700000, buyback: 25500000 },
  "50":  { jual: 55000000, buyback: 50500000 },
  "100": { jual: 109500000, buyback: 100800000 },
};

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

export default function Calculator() {
  const [weight, setWeight] = useState("1");
  const [qty, setQty] = useState(1);

  const p = prices[weight];
  const total = p.buyback * qty;
  const jual = p.jual * qty;
  const selisih = total - jual;
  const pct = Math.round(Math.abs(selisih) / jual * 100);

  return (
    <section id="kalkulator" style={{ padding: "64px 20px", background: "radial-gradient(ellipse 80% 60% at 50% 50%,rgba(201,168,76,.06) 0%,transparent 70%)" }}>
      <div className="wrap">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }} className="kalk-grid">
          <div>
            <p className="section-label">Kalkulator Buyback</p>
            <h2 className="fd" style={{ fontSize: "2.2rem", fontWeight: 300, margin: "14px 0", color: "#EDE8DE", lineHeight: 1.2 }}>
              Hitung Estimasi <em style={{ color: "var(--gold)" }}>Buyback</em><br />Emas Anda
            </h2>
            <p style={{ color: "#7A6E5F", lineHeight: 1.75, fontSize: 15, marginBottom: 28 }}>
              Hitung berapa yang Anda terima jika menjual emas Antam hari ini. Transparan, tanpa biaya tersembunyi.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "#7A6E5F", marginBottom: 8, display: "block" }}>Berat Emas</label>
                <select className="ci" value={weight} onChange={e => setWeight(e.target.value)}>
                  {Object.keys(prices).map(w => <option key={w} value={w}>{w} gram</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#7A6E5F", marginBottom: 8, display: "block" }}>Jumlah Keping</label>
                <input type="number" className="ci" value={qty} min={1} max={100} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))} />
              </div>
            </div>
          </div>

          <div className="price-card" style={{ borderRadius: 16, padding: 32 }}>
            <p style={{ fontSize: 11, letterSpacing: 2, color: "#5A5045", textTransform: "uppercase", marginBottom: 24 }}>Estimasi Penerimaan</p>
            <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid rgba(201,168,76,.15)" }}>
              <p style={{ fontSize: 12, color: "#7A6E5F", marginBottom: 6 }}>Total Harga Beli</p>
              <p className="fd" style={{ fontSize: "1.6rem", color: "#EDE8DE" }}>{fmt(jual)}</p>
            </div>
            <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid rgba(201,168,76,.15)" }}>
              <p style={{ fontSize: 12, color: "#7A6E5F", marginBottom: 6 }}>Harga Buyback / keping</p>
              <p className="fd" style={{ fontSize: "1.6rem", color: "#9A8E7E" }}>{fmt(p.buyback)}</p>
            </div>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 12, color: "#7A6E5F", marginBottom: 6 }}>Total Anda Terima</p>
              <p className="fd" style={{ fontSize: "2.4rem", fontWeight: 600, color: "var(--gold)" }}>{fmt(total)}</p>
              <p style={{ fontSize: 12, color: "#F44336", marginTop: 5 }}>Selisih: Rp {Math.abs(selisih).toLocaleString("id-ID")} ({pct}%)</p>
            </div>
            <a href="https://wa.me/6285975459997?text=Halo,%20Mau%20info%20Sale%20Antam%20nya%20min!" target="_blank" rel="noreferrer" className="btn-gold" style={{ width: "100%", display: "block" }}>
              Tanya Harga Sekarang →
            </a>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:900px){.kalk-grid{grid-template-columns:1fr !important;gap:32px !important}}`}</style>
    </section>
  );
}
