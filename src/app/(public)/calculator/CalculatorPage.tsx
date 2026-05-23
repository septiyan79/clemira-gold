"use client";

import { useState } from "react";

export type PriceEntry = {
  gram: number;
  jual: number | null;
  buyback: number | null;
};

type Tab = "beli" | "buyback";

const fmt = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");
const fmtG = (g: number) =>
  (g % 1 === 0 ? String(g) : g.toLocaleString("id-ID", { maximumFractionDigits: 2 })) + " gram";

function hitungBuyback(gram: number, bb1g: number) {
  const antamGross = bb1g * gram;
  const pph        = antamGross > 10_000_000 ? antamGross * 0.015 : 0;
  const meterai    = antamGross > 5_000_000  ? 10_000 : 0;
  const antamNet   = antamGross - pph - meterai;
  const clemira    = bb1g * 1.02 * gram;
  return { gram, antamGross, pph, meterai, antamNet, clemira, selisih: clemira - antamNet };
}

export default function CalculatorPage({ entries, date }: { entries: PriceEntry[]; date: string | null }) {
  const [tab, setTab] = useState<Tab>("beli");

  const tabs: { key: Tab; label: string }[] = [
    { key: "beli",    label: "Kalkulator Beli"    },
    { key: "buyback", label: "Kalkulator Buyback" },
  ];

  return (
    <>
      <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, overflow: "hidden" }}>
        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "12px 24px", fontSize: 14, cursor: "pointer",
              fontFamily: "var(--font-dm-sans), sans-serif",
              background: "transparent", border: "none", marginBottom: -1, transition: "all .2s",
              borderBottom: tab === t.key ? "2px solid var(--gold)" : "2px solid transparent",
              color: tab === t.key ? "var(--gold)" : "#5A5045",
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ padding: "28px 24px" }}>
          {date && (
            <p style={{ fontSize: 12, color: "#3A342A", marginBottom: 20 }}>
              Harga per:{" "}
              {new Date(date + "T00:00:00Z").toLocaleDateString("id-ID", {
                weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
              })}
            </p>
          )}
          {tab === "beli" ? <BeliTab entries={entries} /> : <BuybackTab entries={entries} />}
        </div>
      </div>

      <style>{`
        .ci{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:10px 14px;color:#EDE8DE;font-size:14px;outline:none;width:100%;box-sizing:border-box;font-family:var(--font-dm-sans),sans-serif}
        .ci:focus{border-color:rgba(201,168,76,.5)}
        .ci[type=number]::-webkit-inner-spin-button{opacity:.4}
      `}</style>
    </>
  );
}

/* ══════════════════════════════════════
   Tab Beli — Shopping Cart
══════════════════════════════════════ */
function BeliTab({ entries }: { entries: PriceEntry[] }) {
  const available = entries.filter(e => e.jual !== null);
  const [cart, setCart] = useState<Map<number, number>>(new Map());

  if (available.length === 0) return <Empty msg="Data harga belum tersedia." />;

  function addToCart(gram: number) {
    setCart(prev => new Map(prev).set(gram, (prev.get(gram) ?? 0) + 1));
  }

  function updateQty(gram: number, qty: number) {
    setCart(prev => {
      const next = new Map(prev);
      if (qty <= 0) next.delete(gram);
      else next.set(gram, qty);
      return next;
    });
  }

  function removeItem(gram: number) {
    setCart(prev => { const n = new Map(prev); n.delete(gram); return n; });
  }

  const cartItems = [...cart.entries()].map(([gram, qty]) => {
    const jual = available.find(e => e.gram === gram)?.jual ?? 0;
    return { gram, qty, jual, subtotal: jual * qty };
  });
  const grandTotal = cartItems.reduce((s, i) => s + i.subtotal, 0);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }} className="beli-layout">

        {/* Kiri — gramasi cards */}
        <div>
          <p style={{ fontSize: 11, letterSpacing: 1.5, color: "#5A5045", textTransform: "uppercase", marginBottom: 14 }}>
            Pilih Gramasi — Klik untuk Tambah
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
            {available.map(e => {
              const inCart = cart.get(e.gram) ?? 0;
              return (
                <button key={e.gram} onClick={() => addToCart(e.gram)} style={{
                  position: "relative", padding: "14px 12px", borderRadius: 10,
                  cursor: "pointer", textAlign: "left", transition: "all .2s",
                  background: inCart > 0 ? "rgba(201,168,76,.12)" : "rgba(255,255,255,.03)",
                  border: inCart > 0 ? "1px solid rgba(201,168,76,.4)" : "1px solid rgba(255,255,255,.07)",
                  fontFamily: "var(--font-dm-sans), sans-serif",
                }}>
                  {inCart > 0 && (
                    <span style={{
                      position: "absolute", top: 7, right: 7,
                      background: "var(--gold)", color: "#1A1200",
                      borderRadius: "50%", width: 20, height: 20, fontSize: 11, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>{inCart}</span>
                  )}
                  <div className="fd" style={{ fontSize: 16, fontWeight: 600, color: inCart > 0 ? "var(--gold)" : "#EDE8DE", marginBottom: 5 }}>
                    {fmtG(e.gram)}
                  </div>
                  <div style={{ fontSize: 11, color: inCart > 0 ? "#B8962E" : "#5A5045" }}>
                    {fmt(e.jual!)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Kanan — keranjang */}
        <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 12, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 13, color: "#9A8E7E" }}>
              Keranjang{cartItems.length > 0 ? ` (${cartItems.length} jenis)` : ""}
            </p>
            {cartItems.length > 0 && (
              <button onClick={() => setCart(new Map())} style={{
                fontSize: 11, color: "#5A5045", background: "none", border: "none",
                cursor: "pointer", letterSpacing: 0.5, fontFamily: "var(--font-dm-sans), sans-serif",
              }}>Kosongkan</button>
            )}
          </div>

          {/* Items */}
          {cartItems.length === 0 ? (
            <div style={{ padding: "36px 16px", textAlign: "center", color: "#3A342A", fontSize: 13, lineHeight: 1.7 }}>
              Klik gramasi di sebelah kiri<br />untuk menambah ke keranjang
            </div>
          ) : (
            <>
              <div>
                {cartItems.map(item => (
                  <div key={item.gram} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,.04)",
                  }}>
                    {/* Name + price */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: "#EDE8DE" }}>{fmtG(item.gram)}</div>
                      <div style={{ fontSize: 11, color: "#4A3E2E" }}>{fmt(item.jual)} / keping</div>
                    </div>
                    {/* Qty controls */}
                    <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                      <QtyBtn onClick={() => updateQty(item.gram, item.qty - 1)}>−</QtyBtn>
                      <input type="number" value={item.qty} min={1}
                        onChange={e => updateQty(item.gram, parseInt(e.target.value) || 1)}
                        style={{
                          width: 34, textAlign: "center", padding: "4px 0",
                          background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
                          borderRadius: 6, color: "#EDE8DE", fontSize: 13, outline: "none",
                          fontFamily: "var(--font-dm-sans), sans-serif",
                        }} />
                      <QtyBtn onClick={() => updateQty(item.gram, item.qty + 1)}>+</QtyBtn>
                    </div>
                    {/* Subtotal */}
                    <div style={{ fontSize: 12, color: "var(--gold)", minWidth: 90, textAlign: "right", flexShrink: 0 }}>
                      {fmt(item.subtotal)}
                    </div>
                    {/* Remove */}
                    <button onClick={() => removeItem(item.gram)} style={{
                      background: "none", border: "none", color: "#4A3E2E",
                      cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 2px",
                      flexShrink: 0, fontFamily: "sans-serif",
                    }}>×</button>
                  </div>
                ))}
              </div>

              {/* Grand total */}
              <div style={{ padding: "14px 16px", background: "rgba(201,168,76,.04)", borderTop: "1px solid rgba(201,168,76,.15)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: "#7A6E5F" }}>Total Pembelian</span>
                  <span className="fd" style={{ fontSize: "1.35rem", fontWeight: 600, color: "var(--gold)" }}>{fmt(grandTotal)}</span>
                </div>
                <p style={{ fontSize: 11, color: "#3A342A" }}>*Belum termasuk biaya pengiriman</p>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`@media(max-width:680px){.beli-layout{grid-template-columns:1fr !important}}`}</style>
    </>
  );
}

function QtyBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: 26, height: 26, borderRadius: 6, flexShrink: 0,
      background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
      color: "#9A8E7E", fontSize: 14, cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-dm-sans), sans-serif",
    }}>{children}</button>
  );
}

/* ══════════════════════════════════════
   Tab Buyback
══════════════════════════════════════ */
function BuybackTab({ entries }: { entries: PriceEntry[] }) {
  const bb1g = entries.find(e => e.gram === 1)?.buyback ?? null;
  const [grams, setGrams] = useState("");
  const [result, setResult] = useState<ReturnType<typeof hitungBuyback> | null>(null);

  const noData   = bb1g === null;
  const disabled = noData || !grams;

  function hitung() {
    const g = parseFloat(grams);
    if (!g || g <= 0 || !bb1g) return;
    setResult(hitungBuyback(g, bb1g));
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "flex-start" }} className="bb-grid">
      {/* Left – form */}
      <div>
        <p className="section-label" style={{ marginBottom: 10 }}>Estimasi Penjualan Kembali</p>
        <h2 className="fd" style={{ fontSize: "1.5rem", fontWeight: 300, color: "#EDE8DE", marginBottom: 12, lineHeight: 1.35 }}>
          Hitung Estimasi <em style={{ color: "var(--gold)" }}>Buyback</em> Emas
        </h2>
        <p style={{ fontSize: 14, color: "#7A6E5F", lineHeight: 1.75, marginBottom: 24 }}>
          Bandingkan hasil jual kembali emas Antam antara prosedur resmi Antam dan Clemira Gold — lebih transparan, tanpa biaya tersembunyi.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, letterSpacing: 1.2, color: "#5A5045", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
              Jumlah Gram yang Dijual
            </label>
            <input type="number" className="ci" placeholder="Contoh: 5" value={grams}
              min={0.1} step={0.1}
              onChange={e => { setGrams(e.target.value); setResult(null); }}
              onKeyDown={e => e.key === "Enter" && hitung()} />
          </div>

          {bb1g && (
            <p style={{ fontSize: 12, color: "#5A5045" }}>
              Harga buyback terkini: <span style={{ color: "var(--gold)" }}>{fmt(bb1g)}</span> / gram
            </p>
          )}

          <button onClick={hitung} disabled={disabled} className="btn-gold"
            style={{ alignSelf: "flex-start", opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>
            {noData ? "Data belum tersedia" : "Hitung Sekarang"}
          </button>
        </div>
      </div>

      {/* Right – result */}
      {!result ? (
        <div style={{
          background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)",
          borderRadius: 16, padding: 32, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", minHeight: 260, gap: 12,
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "var(--gold)" }}>◎</div>
          <p style={{ fontSize: 14, color: "#5A5045", textAlign: "center", lineHeight: 1.7 }}>
            Masukkan jumlah gram<br />dan klik <strong style={{ color: "#7A6E5F" }}>Hitung Sekarang</strong>
          </p>
        </div>
      ) : (
        <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, padding: 24 }}>
          <p style={{ fontSize: 11, letterSpacing: 2, color: "#5A5045", textTransform: "uppercase", marginBottom: 20 }}>
            Estimasi Penerimaan · {result.gram} gram
          </p>

          {/* Antam */}
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
            <p style={{ fontSize: 12, color: "#7A6E5F", marginBottom: 10, fontWeight: 500 }}>Buyback Antam</p>
            <Row label={`Harga (${result.gram} gr)`} val={fmt(result.antamGross)} />
            {result.pph > 0     && <Row label="PPh 22 (1.5%)" val={"- " + fmt(result.pph)}     red />}
            {result.meterai > 0 && <Row label="Meterai"       val={"- " + fmt(result.meterai)} red />}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 600, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,.05)", marginTop: 6, color: "#9A8E7E" }}>
              <span>Total Diterima</span>
              <span className="fd">{fmt(result.antamNet)}</span>
            </div>
          </div>

          {/* Clemira */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <p style={{ fontSize: 12, color: "#7A6E5F", fontWeight: 500 }}>Buyback Clemira Gold</p>
              <span style={{ fontSize: 10, background: "rgba(201,168,76,.15)", border: "1px solid rgba(201,168,76,.3)", borderRadius: 4, padding: "2px 8px", color: "var(--gold)", letterSpacing: 1 }}>
                +2% · TANPA POTONGAN
              </span>
            </div>
            <Row label={`Harga (${result.gram} gr)`} val={fmt(result.clemira)} />
            <Row label="PPh 22" val="Rp 0" muted />
            <Row label="Meterai" val="Rp 0" muted />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid rgba(201,168,76,.15)", marginTop: 6 }}>
              <span style={{ fontSize: 13, color: "#7A6E5F" }}>Total Diterima</span>
              <span className="fd" style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--gold)" }}>{fmt(result.clemira)}</span>
            </div>
          </div>

          {/* Selisih */}
          <div style={{ background: "rgba(76,175,80,.08)", border: "1px solid rgba(76,175,80,.2)", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: "#4CAF50" }}>Keuntungan vs Antam</span>
            <span className="fd" style={{ fontSize: 15, color: "#4CAF50", fontWeight: 600 }}>+{fmt(result.selisih)}</span>
          </div>

          <a href="https://wa.me/6285975459997?text=Halo,%20Mau%20info%20Buyback%20Antam%20nya%20min!"
            target="_blank" rel="noreferrer" className="btn-gold"
            style={{ display: "block", textAlign: "center" }}>
            ☏ Hubungi Kami →
          </a>
        </div>
      )}

      <style>{`@media(max-width:768px){.bb-grid{grid-template-columns:1fr !important;gap:24px !important}}`}</style>
    </div>
  );
}

/* ── shared mini-components ── */
function Row({ label, val, gold, red, muted }: { label: string; val: string; gold?: boolean; red?: boolean; muted?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
      <span style={{ color: "#6A5E4F" }}>{label}</span>
      <span style={{ color: gold ? "var(--gold)" : red ? "#EF5350" : muted ? "#4A3E2E" : "#9A8E7E" }}>{val}</span>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div style={{ padding: "40px 20px", textAlign: "center", color: "#4A3E2E", fontSize: 14 }}>{msg}</div>;
}
