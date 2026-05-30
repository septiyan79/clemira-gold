import { prisma } from "@/lib/prisma";
import MonthlyProfitChart, { type MonthData } from "@/components/admin/MonthlyProfitChart";

export const dynamic = "force-dynamic";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const MONTHS_FULL  = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

const thStyle: React.CSSProperties = {
  padding: "10px 14px", fontSize: 10, letterSpacing: 1.5, color: "#5A5045",
  textTransform: "uppercase", textAlign: "left", fontWeight: 500,
  borderBottom: "1px solid rgba(201,168,76,.2)", whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  padding: "12px 14px", color: "#9A8E7E", whiteSpace: "nowrap",
  borderBottom: "1px solid rgba(255,255,255,.04)", verticalAlign: "top",
};

export default async function MonthlyProfitPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year: yearParam } = await searchParams;
  const year = Math.max(2024, Math.min(2100, parseInt(yearParam ?? String(new Date().getFullYear()), 10)));

  // WIB = UTC+7 — Jan 1 {year} 00:00 WIB = Dec 31 {year-1} 17:00 UTC
  const startDate = new Date(`${year - 1}-12-31T17:00:00.000Z`);
  const endDate   = new Date(`${year}-12-31T17:00:00.000Z`);

  const rawLines = await prisma.transactionLine.findMany({
    where: {
      transaction: {
        transactedAt: { gte: startDate, lt: endDate },
        status: "paid",
      },
    },
    select: {
      sellPrice: true,
      cogs:      true,
      margin:    true,
      transaction: { select: { transactedAt: true } },
    },
  });

  // Group by month (1–12)
  const map = new Map<number, MonthData>();
  for (let m = 1; m <= 12; m++) {
    map.set(m, { month: m, revenue: 0, cogs: 0, margin: 0, txCount: 0 });
  }
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
  for (const line of rawLines) {
    const wibDate = new Date(line.transaction.transactedAt.getTime() + WIB_OFFSET_MS);
    const m = wibDate.getUTCMonth() + 1;
    const b = map.get(m)!;
    b.revenue  += line.sellPrice.toNumber();
    b.cogs     += line.cogs.toNumber();
    b.margin   += line.margin.toNumber();
    b.txCount  += 1;
  }
  const monthlyData: MonthData[] = Array.from(map.values());

  // KPI aggregates
  const totalRevenue = monthlyData.reduce((s, m) => s + m.revenue, 0);
  const totalCogs    = monthlyData.reduce((s, m) => s + m.cogs,    0);
  const totalProfit  = monthlyData.reduce((s, m) => s + m.margin,  0);
  const avgMarginPct = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const bestMonth    = monthlyData.reduce(
    (best, m) => (m.margin > best.margin ? m : best),
    monthlyData[0],
  );

  const navLinkStyle: React.CSSProperties = {
    padding: "8px 14px", borderRadius: 6, fontSize: 13, textDecoration: "none",
    border: "1px solid rgba(255,255,255,.1)", color: "#7A6E5F",
    background: "transparent", transition: "all .2s",
  };

  return (
    <div>
      <p className="section-label" style={{ marginBottom: 8 }}>Laporan</p>

      {/* Header + year navigator */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
        <div>
          <h1 className="fd" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--text)" }}>
            Laporan Laba Bulanan
          </h1>
          <p style={{ fontSize: 13, color: "#5A5045", marginTop: 4 }}>
            Ringkasan revenue, COGS, dan laba bersih per bulan — transaksi lunas
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
          <a href={`/admin/reports/profit?year=${year - 1}`} style={navLinkStyle}>
            ← {year - 1}
          </a>
          <span className="fd" style={{ fontSize: "1.4rem", fontWeight: 300, color: "var(--gold)", minWidth: 60, textAlign: "center" }}>
            {year}
          </span>
          <a href={`/admin/reports/profit?year=${year + 1}`} style={navLinkStyle}>
            {year + 1} →
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Revenue",  value: fmt(totalRevenue), sub: "penjualan bersih",  highlight: undefined },
          { label: "Total COGS",     value: fmt(totalCogs),    sub: "harga pokok",       highlight: undefined },
          { label: "Total Laba",     value: fmt(totalProfit),  sub: "keuntungan bersih", highlight: totalProfit >= 0 },
          { label: "Avg Margin",     value: `${avgMarginPct.toFixed(1)}%`, sub: "rata-rata margin", highlight: undefined },
          {
            label: "Bulan Terbaik",
            value: totalProfit > 0 ? MONTHS_SHORT[bestMonth.month - 1] : "—",
            sub: totalProfit > 0 ? fmt(bestMonth.margin) : "tidak ada data",
            highlight: undefined,
          },
        ].map(({ label, value, sub, highlight }) => (
          <div key={label} style={{
            background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)",
            borderRadius: 12, padding: "20px 24px",
          }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#5A5045", marginBottom: 8 }}>
              {label}
            </div>
            <div className="fd" style={{
              fontSize: "1.4rem", fontWeight: 300, lineHeight: 1,
              color: highlight !== undefined ? (highlight ? "#4CAF50" : "#EF5350") : "var(--gold)",
            }}>
              {value}
            </div>
            <div style={{ fontSize: 11, color: "#3A342A", marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{
        background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 16, padding: 28, marginBottom: 28,
      }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#5A5045", marginBottom: 20 }}>
          Revenue vs COGS per Bulan — {year}
        </div>
        <MonthlyProfitChart data={monthlyData} />
      </div>

      {/* Monthly table */}
      <div style={{
        background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 16, padding: 24,
      }}>
        {rawLines.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>◈</p>
            <p style={{ fontSize: 15, color: "#5A5045" }}>Tidak ada transaksi lunas untuk tahun {year}</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Bulan", "Transaksi", "Revenue", "COGS", "Laba", "Margin %"].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((m) => {
                  const marginPct = m.revenue > 0 ? (m.margin / m.revenue) * 100 : 0;
                  const empty = m.txCount === 0;
                  return (
                    <tr key={m.month} style={{ opacity: empty ? 0.35 : 1 }} className="adm-tr-hover">
                      <td style={{ ...tdStyle, color: "var(--gold)", fontWeight: 500 }}>
                        {MONTHS_FULL[m.month - 1]}
                      </td>
                      <td style={tdStyle}>{empty ? "—" : `${m.txCount} item`}</td>
                      <td style={{ ...tdStyle, color: "#EDE8DE" }}>{empty ? "—" : fmt(m.revenue)}</td>
                      <td style={tdStyle}>{empty ? "—" : fmt(m.cogs)}</td>
                      <td style={{
                        ...tdStyle,
                        color: empty ? "#3A342A" : m.margin >= 0 ? "#4CAF50" : "#EF5350",
                        fontWeight: 500,
                      }}>
                        {empty ? "—" : `${m.margin >= 0 ? "+" : ""}${fmt(m.margin)}`}
                      </td>
                      <td style={{ ...tdStyle, color: "#9A8E7E" }}>
                        {empty ? "—" : `${marginPct.toFixed(1)}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "1px solid rgba(201,168,76,.2)" }}>
                  <td style={{ ...tdStyle, color: "#5A5045", fontSize: 11 }}>Total {year}</td>
                  <td style={{ ...tdStyle, color: "#5A5045", fontSize: 11 }}>
                    {rawLines.length} item
                  </td>
                  <td style={{ ...tdStyle, color: "#EDE8DE", fontWeight: 600 }}>{fmt(totalRevenue)}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{fmt(totalCogs)}</td>
                  <td style={{
                    ...tdStyle,
                    color: totalProfit >= 0 ? "#4CAF50" : "#EF5350",
                    fontWeight: 600,
                  }}>
                    {totalProfit >= 0 ? "+" : ""}{fmt(totalProfit)}
                  </td>
                  <td style={{ ...tdStyle, color: "#9A8E7E" }}>
                    {totalRevenue > 0 ? `${avgMarginPct.toFixed(1)}%` : "—"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
