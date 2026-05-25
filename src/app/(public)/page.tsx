export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import Ticker from "@/components/landing/Ticker";
import PriceChart from "@/components/landing/PriceChart";
import Calculator from "@/components/landing/Calculator";
import WhatsAppPopover from "@/components/shared/WhatsAppPopover";
import { prisma } from "@/lib/prisma";

const Logo = ({ size = 24 }: { size?: number }) =>
  <Image src="/Logo CG.png" alt="Clemira Gold" width={size} height={size} style={{ objectFit: "contain" }} />;

function formatRupiah(harga: bigint): string {
  return "Rp " + Number(harga).toLocaleString("id-ID");
}

function formatTanggal(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function normalizeGram(gramasi: string): number {
  return parseFloat(gramasi.replace(/[^\d.]/g, "")) || 0;
}

async function getLatestHarga() {
  const latestDates = await prisma.hargaAntam.findMany({
    distinct: ["tanggal"],
    orderBy: { tanggal: "desc" },
    take: 2,
    select: { tanggal: true },
  });

  if (latestDates.length === 0) return null;

  const latestDate = latestDates[0].tanggal;
  const prevDate = latestDates[1]?.tanggal ?? null;

  const [rows, prevRows] = await Promise.all([
    prisma.hargaAntam.findMany({ where: { tanggal: latestDate } }),
    prevDate
      ? prisma.hargaAntam.findMany({ where: { tanggal: prevDate } })
      : Promise.resolve([]),
  ]);

  return { tanggal: latestDate, rows, prevRows };
}

export default async function HomePage() {
  const hargaData = await getLatestHarga();

  const TARGET_GRAM = [0.5, 1, 2, 5, 10];

  const isBB = (gramasi: string) => gramasi.toUpperCase().includes("BB");
  const sellRows = hargaData?.rows.filter((r) => !isBB(r.gramasi)) ?? [];
  const bbRows   = hargaData?.rows.filter((r) =>  isBB(r.gramasi)) ?? [];

  const tableRows = TARGET_GRAM.map((gram) => {
    const sellRow = sellRows.find((r) => normalizeGram(r.gramasi) === gram);
    return {
      g:    `${gram}g`,
      jual: sellRow ? formatRupiah(sellRow.harga) : "-",
    };
  });

  const harga1g   = sellRows.find((r) => normalizeGram(r.gramasi) === 1);
  const prevHarga1g = hargaData?.prevRows.find((r) => !isBB(r.gramasi) && normalizeGram(r.gramasi) === 1);

  const bb1g      = bbRows.find((r) => normalizeGram(r.gramasi) === 1);
  const prevBb1g  = hargaData?.prevRows.find((r) => isBB(r.gramasi) && normalizeGram(r.gramasi) === 1);

  const bbChangeDiff    = bb1g && prevBb1g ? Number(bb1g.harga) - Number(prevBb1g.harga) : null;
  const bbChangePercent = bb1g && prevBb1g && Number(prevBb1g.harga) > 0
    ? ((Number(bb1g.harga) - Number(prevBb1g.harga)) / Number(prevBb1g.harga)) * 100
    : null;

  const changePercent =
    harga1g && prevHarga1g && Number(prevHarga1g.harga) > 0
      ? ((Number(harga1g.harga) - Number(prevHarga1g.harga)) / Number(prevHarga1g.harga)) * 100
      : null;

  const changeDiff =
    harga1g && prevHarga1g
      ? Number(harga1g.harga) - Number(prevHarga1g.harga)
      : null;

  const tanggalStr = hargaData ? formatTanggal(hargaData.tanggal) : null;

  // Build prices map for Calculator — keyed by gram number, all gramasi from DB
  const gramSet = new Set<number>();
  for (const row of hargaData?.rows ?? []) {
    const g = normalizeGram(row.gramasi);
    if (g > 0) gramSet.add(g);
  }
  const calcPrices: Record<string, { jual: number | null; buyback: number | null }> = {};
  for (const gram of [...gramSet].sort((a, b) => a - b)) {
    const key = String(gram);
    const sellRow = sellRows.find((r) => normalizeGram(r.gramasi) === gram);
    const bbRow   = bbRows.find((r)   => normalizeGram(r.gramasi) === gram);
    calcPrices[key] = {
      jual:    sellRow ? Number(sellRow.harga) : null,
      buyback: bbRow   ? Number(bbRow.harga)   : null,
    };
  }

  return (
    <>
      <Ticker />

      {/* ══ HERO ══ */}
      <section style={{ padding: "80px 20px 64px", position: "relative", overflow: "hidden", background: "radial-gradient(ellipse 70% 50% at 50% 0%,rgba(201,168,76,.15) 0%,transparent 70%),radial-gradient(ellipse 40% 40% at 80% 60%,rgba(139,105,20,.08) 0%,transparent 60%),var(--dark)" }}>
        <div className="wrap">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }} className="hero-grid">
            {/* Kiri */}
            <div>
              <p className="section-label fu d1" style={{ marginBottom: 16 }}>Platform Pantau Emas Antam</p>
              <h1 className="fd fu d2" style={{ fontSize: "clamp(2.8rem,5vw,4.8rem)", fontWeight: 300, lineHeight: 1.1, margin: "0 0 20px", color: "#EDE8DE" }}>
                Emasmu,<br />
                <em style={{ color: "var(--gold)", fontStyle: "italic" }}>Kendalimu</em>
              </h1>
              <p className="fu d3" style={{ fontSize: 16, color: "#9A8E7E", lineHeight: 1.75, maxWidth: 400, marginBottom: 32 }}>
                Pantau harga emas Antam harian, hitung buyback secara instan, dan kelola investasi emas Anda dengan mudah dan transparan.
              </p>
              <div className="fu d3" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href="/price" className="btn-gold">Pantau Harga Emas!</Link>
                <Link href="#kalkulator" className="btn-outline">Hitung Buyback</Link>
              </div>
              <div className="fu d4" style={{ display: "flex", gap: 36, marginTop: 48, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,.07)" }}>
                {[
                  { num: "Harian", label: "Update Harga" },
                  { num: "100%", label: "Produk Asli" },
                  { num: "Jujur", label: "& Transparan" },
                ].map(s => (
                  <div key={s.label}>
                    <div className="fd" style={{ fontSize: "2rem", fontWeight: 600, color: "var(--gold)", lineHeight: 1 }}>{s.num}</div>
                    <div style={{ fontSize: 13, color: "#7A6E5F", marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kanan: Price Card */}
            <div style={{ position: "relative" }}>
              <div className="price-card" style={{ borderRadius: 16, padding: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <p style={{ fontSize: 11, letterSpacing: 2, color: "#7A6E5F", textTransform: "uppercase", marginBottom: 5 }}>Harga Antam Hari Ini</p>
                    <p style={{ fontSize: 11, color: tanggalStr ? "#4CAF50" : "#7A6E5F" }}>
                      {tanggalStr ? `● ${tanggalStr}` : "● Belum ada data"}
                    </p>
                  </div>
                  <div style={{ background: "rgba(201,168,76,.15)", border: "1px solid rgba(201,168,76,.3)", borderRadius: 6, padding: "5px 12px", fontSize: 11, color: "var(--gold)" }}>Antam Certicard</div>
                </div>
                <div className="fd" style={{ fontSize: "2.6rem", fontWeight: 600, color: "var(--gold)", lineHeight: 1, marginBottom: 4 }}>
                  {harga1g ? formatRupiah(harga1g.harga) : "—"}
                </div>
                <p style={{ fontSize: 13, color: "#6A5E4F", marginBottom: 24 }}>
                  per 1 gram
                  {changePercent !== null && changeDiff !== null && (
                    <>
                      {" · "}
                      <span style={{ color: changePercent >= 0 ? "#4CAF50" : "#EF5350" }}>
                        {changePercent >= 0 ? "▲" : "▼"}{" "}
                        {changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}%{" "}
                        ({changeDiff >= 0 ? "+" : "-"}Rp {Math.abs(changeDiff).toLocaleString("id-ID")}) hari ini
                      </span>
                    </>
                  )}
                </p>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Berat", "Harga Jual"].map(h => (
                        <td key={h} style={{ fontSize: 10, letterSpacing: 1.5, color: "#5A5045", textTransform: "uppercase", paddingBottom: 10, textAlign: h !== "Berat" ? "right" : "left" }}>{h}</td>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map(row => (
                      <tr key={row.g} style={{ borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                        <td style={{ padding: "13px 10px", fontSize: 14, color: "var(--gold)" }}>{row.g}</td>
                        <td style={{ padding: "13px 10px", fontSize: 14, color: "#EDE8DE", textAlign: "right" }}>{row.jual}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {bb1g && (
                  <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 8, background: "rgba(201,168,76,.07)", border: "1px solid rgba(201,168,76,.18)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                    <div>
                      <p style={{ fontSize: 10, letterSpacing: 1.5, color: "#5A5045", textTransform: "uppercase", marginBottom: 3 }}>Buyback 1 gram</p>
                      <p className="fd" style={{ fontSize: 16, fontWeight: 600, color: "var(--gold)" }}>{formatRupiah(bb1g.harga)}</p>
                    </div>
                    {bbChangeDiff !== null && bbChangePercent !== null && (
                      <span style={{ fontSize: 12, color: bbChangeDiff >= 0 ? "#4CAF50" : "#EF5350", fontWeight: 500 }}>
                        {bbChangeDiff >= 0 ? "▲" : "▼"}{" "}
                        {bbChangeDiff >= 0 ? "+" : "-"}Rp {Math.abs(bbChangeDiff).toLocaleString("id-ID")}{" "}
                        ({bbChangeDiff >= 0 ? "+" : ""}{bbChangePercent.toFixed(2)}%)
                      </span>
                    )}
                  </div>
                )}

                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(201,168,76,.15)" }}>
                  <Link href="/price" className="btn-gold" style={{ width: "100%", display: "block" }}>Lihat Semua Harga →</Link>
                </div>
              </div>
              <div style={{ position: "absolute", top: -14, right: -14, background: "linear-gradient(135deg,#C9A84C,#E8D49A)", color: "#1A1612", borderRadius: "50%", width: 66, height: 66, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600, letterSpacing: .5, lineHeight: 1.4, textAlign: "center" }} className="hero-badge">
                UPDATE<br />HARIAN
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="shimmer-line" />

      {/* ══ CHART ══ */}
      <PriceChart />

      {/* ══ KALKULATOR ══ */}
      <Calculator prices={calcPrices} />

      {/* ══ PROMO / SALE ══ */}
      {/* <section id="sale" style={{ padding: "64px 20px" }}>
        <div className="wrap">
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <p className="section-label">Penawaran Terbatas</p>
            <h2 className="fd" style={{ fontSize: "2.2rem", fontWeight: 300, marginTop: 10, color: "#EDE8DE" }}>
              Sale <em style={{ color: "var(--gold)" }}>Hari Ini</em>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }} className="sale-grid">
            {[
              { badge: "FLASH SALE", badgeStyle: { background: "rgba(201,168,76,.2)", border: "1px solid rgba(201,168,76,.4)", color: "var(--gold)" }, title: "Antam 2g × 1 Keping", desc: "Redmark, kulit ari lengkap, mulus." },
              { badge: "HOT DEAL", badgeStyle: { background: "linear-gradient(135deg,#C9A84C,#E8D49A)", color: "#1A1612" }, title: "Antam 1g × 5 Keping", desc: "Redmark, kulit ari lengkap, mulus." },
              { badge: "AVAILABLE", badgeStyle: { background: "rgba(76,175,80,.15)", border: "1px solid rgba(76,175,80,.3)", color: "#4CAF50" }, title: "Antam 50g × 1 Keping", desc: "Redmark, kulit ari lengkap, mulus." },
            ].map(item => (
              <div key={item.title} style={{ background: "linear-gradient(135deg,rgba(201,168,76,.15),rgba(139,105,20,.05))", border: "1px solid rgba(201,168,76,.35)", borderRadius: 12, padding: 24, position: "relative", overflow: "hidden" }}>
                <div style={{ marginBottom: 16 }}>
                  <span style={{ ...item.badgeStyle, padding: "5px 12px", borderRadius: 20, fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>{item.badge}</span>
                </div>
                <h3 className="fd" style={{ fontSize: "1.3rem", color: "#EDE8DE", marginBottom: 8, fontWeight: 400 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: "#7A6E5F", lineHeight: 1.6, marginBottom: 16 }}>{item.desc}</p>
                <a href="https://wa.me/6285975459997?text=Halo,%20Mau%20info%20Sale%20Antam%20nya%20min!" target="_blank" rel="noreferrer" className="btn-gold" style={{ width: "100%", display: "block", fontSize: 14, padding: 12 }}>
                  Hubungi Kami →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ══ FITUR ══ */}
      <section id="fitur" style={{ padding: "64px 20px", background: "rgba(0,0,0,.2)" }}>
        <div className="wrap">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p className="section-label">Kenapa Clemira Gold</p>
            <h2 className="fd" style={{ fontSize: "2.2rem", fontWeight: 300, marginTop: 10, color: "#EDE8DE" }}>
              Semua Dalam <em style={{ color: "var(--gold)" }}>Satu Platform</em>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }} className="feat-grid">
            {[
              { icon: "◷", title: "Update Harga Harian", desc: "Harga update setiap hari kerja pukul 10.00 WIB sesuai harga resmi Antam." },
              { icon: "◈", title: "Grafik Tren Bulanan", desc: "Pantau pergerakan harga harian, bulanan, hingga tahunan secara visual." },
              { icon: "◎", title: "Kalkulator Buyback", desc: "Hitung estimasi nilai jual kembali emas Anda secara instan dan transparan." },
              { icon: "◉", title: "Sale Harian", desc: "Lihat daftar produk emas yang tersedia untuk dijual hari ini." },
              { icon: "▣", title: "Dashboard Logam Mulia Anda", desc: "Pantau pertumbuhan emas yang kamu miliki dari satu panel." },
              { icon: "◆", title: "Buyback Tinggi", desc: "Buyback lebih tinggi dari harga buyback butik antam, tanpa potongan." },
            ].map(f => (
              <div key={f.title} className="feat-card">
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(201,168,76,.12)", border: "1px solid rgba(201,168,76,.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, fontSize: 20, color: "var(--gold)" }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 500, color: "#EDE8DE", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "#6A5E4F", lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section id="daftar" style={{ padding: "80px 20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 70% at 50% 50%,rgba(201,168,76,.12) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 560, margin: "0 auto" }}>
          <div style={{ width: 88, height: 88, margin: "0 auto 28px", borderRadius: 20, background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Logo size={64} />
          </div>
          <h2 className="fd" style={{ fontSize: "2.6rem", fontWeight: 300, color: "#EDE8DE", lineHeight: 1.15, marginBottom: 16 }}>
            Emasmu,<br /><em style={{ color: "var(--gold)" }}>Kendalimu.</em>
          </h2>
          <p style={{ fontSize: 15, color: "#7A6E5F", lineHeight: 1.75, marginBottom: 36 }}>
            Clemira Gold hadir untuk mempermudah siapa pun memantau harga emas dan buyback secara cepat dan transparan. Mulai sekarang, gratis.
          </p>
          <div style={{ display: "flex", gap: 12, maxWidth: 440, margin: "0 auto 24px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/price" className="btn-gold">Pantau Harga Sekarang</Link>
            <WhatsAppPopover
              message="Halo, saya ingin tahu lebih tentang Clemira Gold!"
              label="☏ Hubungi Kami"
              className="btn-outline"
              align="center"
            />
          </div>
          <p style={{ fontSize: 12, color: "#5A5045" }}>Data harga update harian · Tidak ada biaya tersembunyi</p>
        </div>
      </section>

      <style>{`
        .feat-card {
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 12px;
          padding: 28px;
          transition: all .3s;
        }
        .feat-card:hover {
          background: rgba(201,168,76,.06);
          border-color: rgba(201,168,76,.2);
          transform: translateY(-3px);
        }
        @media(max-width:900px){
          .hero-grid{grid-template-columns:1fr !important;gap:40px !important}
          .hero-badge{display:none !important}
          .feat-grid{grid-template-columns:repeat(2,1fr) !important}
          .sale-grid{grid-template-columns:1fr 1fr !important}
        }
        @media(max-width:600px){
          .feat-grid{grid-template-columns:1fr !important}
          .sale-grid{grid-template-columns:1fr !important}
        }
      `}</style>
    </>
  );
}
