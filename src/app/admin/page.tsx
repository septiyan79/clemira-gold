import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

const isBB  = (g: string) => g.toUpperCase().includes("BB");
const normG = (g: string) => parseFloat(g.replace(/[^\d.]/g, "")) || 0;

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
function fmtDate(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const thStyle: React.CSSProperties = {
  padding: "10px 14px", fontSize: 10, letterSpacing: 1.5, color: "#5A5045",
  textTransform: "uppercase", textAlign: "left", fontWeight: 500,
  borderBottom: "1px solid rgba(201,168,76,.2)", whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  padding: "11px 14px", color: "#9A8E7E", whiteSpace: "nowrap",
  borderBottom: "1px solid rgba(255,255,255,.04)", verticalAlign: "top",
};

export default async function AdminDashboard() {
  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Fetch latest Antam price (1gr dasar + buyback)
  const latestHarga = await prisma.hargaAntam.findFirst({
    orderBy: { tanggal: "desc" },
    select: { tanggal: true },
  });

  let antamDasar1gr: number | null   = null;
  let antamBuyback1gr: number | null = null;
  let antamDate: string | null       = null;

  if (latestHarga) {
    antamDate = new Date(latestHarga.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    const prices = await prisma.hargaAntam.findMany({
      where: { tanggal: latestHarga.tanggal },
      select: { gramasi: true, harga: true },
    });
    for (const p of prices) {
      if (normG(p.gramasi) !== 1) continue;
      if (isBB(p.gramasi)) antamBuyback1gr = Number(p.harga);
      else                 antamDasar1gr   = Number(p.harga);
    }
  }

  // All parallel fetches
  const [
    stockAvailable,
    pendingCount,
    monthLineAgg,
    monthTxCount,
    allTimeLineAgg,
    recentTx,
  ] = await Promise.all([
    prisma.stockUnit.count({ where: { status: "available" } }),
    prisma.transaction.count({ where: { status: "pending" } }),
    prisma.transactionLine.aggregate({
      _sum: { sellPrice: true, margin: true },
      where: { transaction: { transactedAt: { gte: monthStart, lte: monthEnd } } },
    }),
    prisma.transaction.count({ where: { transactedAt: { gte: monthStart, lte: monthEnd } } }),
    prisma.transactionLine.aggregate({
      _sum: { sellPrice: true, margin: true },
    }),
    prisma.transaction.findMany({
      orderBy: { transactedAt: "desc" },
      take: 6,
      include: {
        buyer: { select: { name: true } },
        lines: {
          select: {
            sellPrice: true,
            margin: true,
            fulfillmentMode: true,
            stockUnit: { select: { product: { select: { brand: true, weightGram: true } } } },
            swapEvent: { select: { originalUnit: { select: { product: { select: { brand: true, weightGram: true } } } } } },
          },
        },
      },
    }),
  ]);

  const monthRevenue  = monthLineAgg._sum.sellPrice?.toNumber() ?? 0;
  const monthMargin   = monthLineAgg._sum.margin?.toNumber()   ?? 0;
  const allRevenue    = allTimeLineAgg._sum.sellPrice?.toNumber() ?? 0;
  const allMargin     = allTimeLineAgg._sum.margin?.toNumber()   ?? 0;

  const modeLabel: Record<string, { label: string; color: string; bg: string }> = {
    own_stock:   { label: "Stok",  color: "#C9A84C", bg: "rgba(201,168,76,.12)"  },
    consignment: { label: "Konsi", color: "#64B5F6", bg: "rgba(100,181,246,.12)" },
    swap:        { label: "Swap",  color: "#CE93D8", bg: "rgba(206,147,216,.12)" },
  };

  const monthName = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  return (
    <div>
      <p className="section-label" style={{ marginBottom: 8 }}>Overview</p>
      <div style={{ marginBottom: 28 }}>
        <h1 className="fd" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--text)" }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 13, color: "#5A5045", marginTop: 4 }}>
          Ringkasan bisnis — {monthName}
        </p>
      </div>

      {/* Row 1 — Bulan ini */}
      <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#3A342A", marginBottom: 10 }}>
        Bulan Ini
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Transaksi",    value: monthTxCount.toString(),    sub: "penjualan",       highlight: undefined },
          { label: "Revenue",      value: fmt(monthRevenue),          sub: "total penjualan", highlight: undefined },
          { label: "Margin",       value: fmt(monthMargin),           sub: "keuntungan",      highlight: monthMargin >= 0 },
        ].map(({ label, value, sub, highlight }) => (
          <div key={label} style={{
            background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)",
            borderRadius: 12, padding: "20px 24px",
          }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#5A5045", marginBottom: 8 }}>
              {label}
            </div>
            <div className="fd" style={{
              fontSize: "1.6rem", fontWeight: 300, lineHeight: 1,
              color: highlight !== undefined ? (highlight ? "#4CAF50" : "#EF5350") : "var(--gold)",
            }}>
              {value}
            </div>
            <div style={{ fontSize: 11, color: "#3A342A", marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Row 2 — Status saat ini */}
      <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#3A342A", marginBottom: 10 }}>
        Status Saat Ini
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        <Link href="/admin/stock/units" style={{ textDecoration: "none" }}>
          <div style={{
            background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)",
            borderRadius: 12, padding: "20px 24px", cursor: "pointer",
          }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#5A5045", marginBottom: 8 }}>
              Stok Tersedia
            </div>
            <div className="fd" style={{ fontSize: "1.6rem", fontWeight: 300, color: "var(--gold)", lineHeight: 1 }}>
              {stockAvailable}
            </div>
            <div style={{ fontSize: 11, color: "#3A342A", marginTop: 4 }}>unit emas → lihat daftar</div>
          </div>
        </Link>

        <Link href="/admin/sales" style={{ textDecoration: "none" }}>
          <div style={{
            background: pendingCount > 0 ? "rgba(255,193,7,.04)" : "rgba(255,255,255,.02)",
            border: pendingCount > 0 ? "1px solid rgba(255,193,7,.2)" : "1px solid rgba(255,255,255,.06)",
            borderRadius: 12, padding: "20px 24px", cursor: "pointer",
            transition: "border-color .2s",
          }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#5A5045", marginBottom: 8 }}>
              Transaksi Pending
            </div>
            <div className="fd" style={{
              fontSize: "1.6rem", fontWeight: 300, lineHeight: 1,
              color: pendingCount > 0 ? "#FFC107" : "#4CAF50",
            }}>
              {pendingCount}
            </div>
            <div style={{ fontSize: 11, color: "#3A342A", marginTop: 4 }}>
              {pendingCount > 0 ? "belum lunas → lihat penjualan" : "semua lunas"}
            </div>
          </div>
        </Link>

        <div style={{
          background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)",
          borderRadius: 12, padding: "20px 24px",
        }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#5A5045", marginBottom: 8 }}>
            Harga Antam 1gr
            {antamDate && <span style={{ marginLeft: 6, fontWeight: 400, letterSpacing: 0, textTransform: "none", color: "#3A342A" }}>· {antamDate}</span>}
          </div>
          <div className="fd" style={{ fontSize: "1.3rem", fontWeight: 300, color: "var(--gold)", lineHeight: 1 }}>
            {antamDasar1gr != null ? fmt(antamDasar1gr) : "—"}
          </div>
          <div style={{ fontSize: 11, color: "#3A342A", marginTop: 6 }}>
            BB: {antamBuyback1gr != null ? fmt(antamBuyback1gr) : "—"}
          </div>
        </div>
      </div>

      {/* Row 3 — All-time summary */}
      <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#3A342A", marginBottom: 10 }}>
        All Time
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Total Revenue",  value: fmt(allRevenue), sub: "semua penjualan" },
          { label: "Total Margin",   value: fmt(allMargin),  sub: "keuntungan bersih", highlight: allMargin >= 0 },
        ].map(({ label, value, sub, highlight }) => (
          <div key={label} style={{
            background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)",
            borderRadius: 12, padding: "20px 24px",
          }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#5A5045", marginBottom: 8 }}>
              {label}
            </div>
            <div className="fd" style={{
              fontSize: "1.6rem", fontWeight: 300, lineHeight: 1,
              color: highlight !== undefined ? (highlight ? "#4CAF50" : "#EF5350") : "var(--gold)",
            }}>
              {value}
            </div>
            <div style={{ fontSize: 11, color: "#3A342A", marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Recent transactions */}
      <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#3A342A", marginBottom: 10 }}>
        Transaksi Terbaru
      </p>
      <div style={{
        background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 16, padding: 24,
      }}>
        {recentTx.length === 0 ? (
          <p style={{ color: "#3A342A", fontSize: 13, padding: "20px 0" }}>Belum ada transaksi</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Tgl Jual", "Pembeli", "Item", "Mode", "Revenue", "Margin", "Status"].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTx.map((tx) => {
                  const revenue = tx.lines.reduce((s, l) => s + l.sellPrice.toNumber(), 0);
                  const margin  = tx.lines.reduce((s, l) => s + l.margin.toNumber(), 0);
                  const modes   = [...new Set(tx.lines.map(l => l.fulfillmentMode))];
                  return (
                    <tr key={tx.id} className="adm-tr-hover">
                      <td style={tdStyle}>
                        <div style={{ color: "#EDE8DE" }}>{fmtDate(tx.transactedAt)}</div>
                      </td>
                      <td style={{ ...tdStyle, color: "var(--gold)", fontWeight: 500 }}>
                        {tx.buyer?.name ?? <span style={{ color: "#3A342A" }}>—</span>}
                      </td>
                      <td style={tdStyle}>
                        {tx.lines.map((l, i) => {
                          const p = l.stockUnit?.product ?? l.swapEvent?.originalUnit.product;
                          return (
                            <div key={i} style={{ color: "#EDE8DE" }}>
                              {p ? `${p.brand ?? "—"} ${p.weightGram.toNumber()}gr` : "—"}
                            </div>
                          );
                        })}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          {modes.map(m => {
                            const cfg = modeLabel[m] ?? { label: m, color: "#9A8E7E", bg: "transparent" };
                            return (
                              <span key={m} style={{
                                display: "inline-block", padding: "1px 7px", borderRadius: 4,
                                fontSize: 11, fontWeight: 500, color: cfg.color, background: cfg.bg,
                              }}>
                                {cfg.label}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, color: "#EDE8DE", fontWeight: 500 }}>{fmt(revenue)}</td>
                      <td style={{ ...tdStyle, color: margin >= 0 ? "#4CAF50" : "#EF5350", fontWeight: 500 }}>
                        {margin >= 0 ? "+" : ""}{fmt(margin)}
                      </td>
                      <td style={tdStyle}>
                        {tx.status === "paid" ? (
                          <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: "rgba(76,175,80,.12)", color: "#4CAF50" }}>
                            Lunas
                          </span>
                        ) : (
                          <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: "rgba(255,193,7,.1)", color: "#FFC107" }}>
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ paddingTop: 16, textAlign: "right" }}>
              <Link href="/admin/sales" style={{ fontSize: 12, color: "var(--gold)", textDecoration: "none" }}>
                Lihat semua transaksi →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
