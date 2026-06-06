import { Suspense } from "react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import Pagination from "@/components/admin/Pagination";
import SalesFilters from "./SalesFilters";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const modeLabel: Record<string, { label: string; color: string; bg: string }> = {
  own_stock:   { label: "Stok",       color: "#C9A84C", bg: "rgba(201,168,76,.12)"  },
  consignment: { label: "Konsinyasi", color: "#64B5F6", bg: "rgba(100,181,246,.12)" },
  swap:        { label: "Swap",       color: "#CE93D8", bg: "rgba(206,147,216,.12)" },
};

const thStyle: React.CSSProperties = {
  padding: "10px 14px", fontSize: 10, letterSpacing: 1.5, color: "#5A5045",
  textTransform: "uppercase", textAlign: "left", fontWeight: 500,
  borderBottom: "1px solid rgba(201,168,76,.2)", whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  padding: "12px 14px", color: "#9A8E7E", whiteSpace: "nowrap",
  borderBottom: "1px solid rgba(255,255,255,.04)", verticalAlign: "top",
};

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string; q?: string; status?: string;
    mode?: string; gramasi?: string; dateFrom?: string; dateTo?: string;
  }>;
}) {
  const params = await searchParams;

  const q        = params.q        ?? "";
  const status   = params.status   ?? "";
  const mode     = params.mode     ?? "";
  const gramasi  = params.gramasi  ?? "";
  const dateFrom = params.dateFrom ?? "";
  const dateTo   = params.dateTo   ?? "";
  const rawPage  = parseInt(params.page ?? "1", 10);

  const hasFilter = !!(q || status || mode || gramasi || dateFrom || dateTo);

  // Build dynamic where clause
  const where: Prisma.TransactionWhereInput = {};

  if (q) {
    where.OR = [
      { invoiceNo: { contains: q, mode: "insensitive" } },
      { receiptNo: { contains: q, mode: "insensitive" } },
      { buyer: { name: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (status === "paid" || status === "pending") {
    where.status = status;
  }
  if (dateFrom || dateTo) {
    where.transactedAt = {};
    if (dateFrom) (where.transactedAt as Prisma.DateTimeFilter).gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setDate(end.getDate() + 1);
      (where.transactedAt as Prisma.DateTimeFilter).lt = end;
    }
  }

  const lineFilter: Prisma.TransactionLineWhereInput = {};
  if (gramasi) {
    const wg = parseFloat(gramasi);
    if (!isNaN(wg)) {
      lineFilter.OR = [
        { stockUnit: { product: { weightGram: wg } } },
        { swapEvent: { originalUnit: { product: { weightGram: wg } } } },
      ];
    }
  }
  if (mode) lineFilter.fulfillmentMode = mode;
  if (Object.keys(lineFilter).length > 0) where.lines = { some: lineFilter };

  // Parallel fetches
  const [totalTxAll, lineAggAll, filteredCount, gramOptions] = await Promise.all([
    prisma.transaction.count(),
    prisma.transactionLine.aggregate({
      _sum: { sellPrice: true, margin: true },
    }),
    hasFilter ? prisma.transaction.count({ where }) : Promise.resolve(null as number | null),
    prisma.product.findMany({
      distinct: ["weightGram"],
      select: { weightGram: true },
      orderBy: { weightGram: "asc" },
      where: { stockUnits: { some: { transactionLines: { some: {} } } } },
    }),
  ]);

  const totalRevenue = lineAggAll._sum.sellPrice?.toNumber() ?? 0;
  const totalMargin  = lineAggAll._sum.margin?.toNumber()   ?? 0;

  const displayCount = hasFilter ? (filteredCount ?? 0) : totalTxAll;
  const totalPages   = Math.max(1, Math.ceil(displayCount / PAGE_SIZE));
  const page         = Math.min(Math.max(1, isNaN(rawPage) ? 1 : rawPage), totalPages);
  const skip         = (page - 1) * PAGE_SIZE;

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      buyer: { select: { name: true } },
      lines: {
        include: {
          stockUnit: {
            include: {
              product: { select: { brand: true, weightGram: true, series: true } },
              owner:   { select: { name: true } },
            },
          },
          consignmentLine: {
            include: {
              supplier: { select: { name: true } },
              product: { select: { brand: true, weightGram: true, series: true } },
            },
          },
          swapEvent: {
            include: {
              originalUnit: {
                include: { product: { select: { brand: true, weightGram: true } } },
              },
            },
          },
        },
      },
    },
    orderBy: { transactedAt: "desc" },
    skip,
    take: PAGE_SIZE,
  });

  const gramOptionsArr = gramOptions.map((p) => p.weightGram.toNumber());

  // Params preserved across pagination
  const extraParams: Record<string, string> = {};
  if (q)        extraParams.q        = q;
  if (status)   extraParams.status   = status;
  if (mode)     extraParams.mode     = mode;
  if (gramasi)  extraParams.gramasi  = gramasi;
  if (dateFrom) extraParams.dateFrom = dateFrom;
  if (dateTo)   extraParams.dateTo   = dateTo;

  return (
    <div>
      <p className="section-label" style={{ marginBottom: 8 }}>Transaksi</p>
      <div style={{ marginBottom: 28 }}>
        <h1 className="fd" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--text)" }}>
          Riwayat Penjualan
        </h1>
        <p style={{ fontSize: 13, color: "#5A5045", marginTop: 4 }}>
          Seluruh transaksi penjualan — stok, konsinyasi, dan swap
        </p>
      </div>

      {/* KPI Cards — all-time totals */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Transaksi", value: totalTxAll.toString(),  sub: "semua transaksi",   highlight: undefined },
          { label: "Total Revenue",   value: fmt(totalRevenue),      sub: "total penjualan",   highlight: undefined },
          { label: "Total Margin",    value: fmt(totalMargin),       sub: "keuntungan bersih", highlight: totalMargin >= 0 },
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

      {/* Table */}
      <div style={{
        background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 16, padding: 24,
      }}>
        {/* Filters */}
        <Suspense fallback={null}>
          <SalesFilters gramOptions={gramOptionsArr} />
        </Suspense>

        {transactions.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>✦</p>
            <p style={{ fontSize: 15, color: "#5A5045" }}>
              {hasFilter ? "Tidak ada transaksi yang cocok dengan filter" : "Belum ada penjualan tercatat"}
            </p>
          </div>
        ) : (
          <>
            {/* Row count info */}
            <div style={{ fontSize: 12, color: "#5A5045", marginBottom: 16 }}>
              {hasFilter
                ? `Menampilkan ${skip + 1}–${Math.min(skip + transactions.length, displayCount)} dari ${displayCount} transaksi (total: ${totalTxAll})`
                : `Menampilkan ${skip + 1}–${Math.min(skip + transactions.length, totalTxAll)} dari ${totalTxAll} transaksi`
              }
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 800 }}>
                <thead>
                  <tr>
                    {["Invoice", "Status", "Tgl Jual", "Pembeli", "Item", "Mode", "Harga Jual", "COGS", "Margin", "Catatan"].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const txRevenue = tx.lines.reduce((s, l) => s + l.sellPrice.toNumber(), 0);
                    const txMargin  = tx.lines.reduce((s, l) => s + l.margin.toNumber(), 0);
                    const txCogs    = tx.lines.reduce((s, l) => s + l.cogs.toNumber(), 0);
                    const modes     = [...new Set(tx.lines.map(l => l.fulfillmentMode))];

                    return (
                      <tr key={tx.id} className="adm-tr-hover">
                        <td style={tdStyle}>
                          {tx.invoiceNo ? (
                            <a
                              href={`/admin/invoices/sales/${tx.id}`}
                              style={{
                                color: "#C9A84C",
                                fontFamily: "monospace",
                                fontSize: 12,
                                fontWeight: 600,
                                textDecoration: "none",
                              }}
                            >
                              {tx.invoiceNo}
                            </a>
                          ) : (
                            <span style={{ color: "#3A342A", fontFamily: "monospace", fontSize: 11 }}>—</span>
                          )}
                          {tx.status === "paid" && tx.receiptNo && (
                            <a
                              href={`/admin/invoices/receipts/${tx.id}`}
                              style={{ display: "block", marginTop: 4, color: "#4CAF50", fontSize: 11, fontFamily: "monospace", textDecoration: "none" }}
                            >
                              {tx.receiptNo}
                            </a>
                          )}
                        </td>
                        <td style={tdStyle}>
                          {tx.status === "paid" ? (
                            <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: "rgba(76,175,80,.12)", color: "#4CAF50" }}>
                              Lunas
                            </span>
                          ) : (
                            <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: "rgba(255,193,7,.1)", color: "#FFC107" }}>
                              Pending
                            </span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ color: "#EDE8DE" }}>{fmtDate(tx.transactedAt)}</div>
                          <div style={{ fontSize: 11, color: "#3A342A", marginTop: 2, fontFamily: "monospace" }}>
                            {tx.id.slice(-8)}
                          </div>
                        </td>

                        <td style={{ ...tdStyle, color: "var(--gold)", fontWeight: 500 }}>
                          {tx.buyer?.name ?? <span style={{ color: "#3A342A" }}>—</span>}
                        </td>

                        <td style={tdStyle}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {tx.lines.map((line) => {
                              const su = line.stockUnit;
                              const cl = line.consignmentLine;
                              const se = line.swapEvent;
                              const p  = su?.product ?? cl?.product ?? se?.originalUnit.product;
                              return (
                                <div key={line.id}>
                                  <div style={{ color: "#EDE8DE" }}>
                                    {p ? `${p.brand ?? "—"} ${p.weightGram.toNumber()}gr` : "—"}
                                  </div>
                                  <div style={{ fontSize: 11, color: "#5A5045" }}>
                                    {line.fulfillmentMode === "consignment" ? "CG" : (su?.owner?.name ?? "—")}
                                    {(su?.serialNumber ?? cl?.serialNumber) ? ` · ${su?.serialNumber ?? cl?.serialNumber}` : ""}
                                    {se?.replacementUnitId === null ? " · ⚠ pengganti belum dicatat" : ""}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        <td style={tdStyle}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {modes.map(m => {
                              const cfg = modeLabel[m] ?? { label: m, color: "#9A8E7E", bg: "transparent" };
                              return (
                                <span key={m} style={{
                                  display: "inline-block", padding: "2px 8px", borderRadius: 4,
                                  fontSize: 11, fontWeight: 500,
                                  color: cfg.color, background: cfg.bg,
                                }}>
                                  {cfg.label}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        <td style={{ ...tdStyle, color: "#EDE8DE", fontWeight: 500 }}>
                          {fmt(txRevenue)}
                          {tx.lines.length > 1 && (
                            <div style={{ fontSize: 11, color: "#5A5045", fontWeight: 400, marginTop: 2 }}>
                              {tx.lines.length} item
                            </div>
                          )}
                        </td>

                        <td style={tdStyle}>{fmt(txCogs)}</td>

                        <td style={{ ...tdStyle, color: txMargin >= 0 ? "#4CAF50" : "#EF5350", fontWeight: 500 }}>
                          {txMargin >= 0 ? "+" : ""}{fmt(txMargin)}
                          {txRevenue > 0 && (
                            <div style={{ fontSize: 11, fontWeight: 400, marginTop: 2, opacity: 0.7 }}>
                              {((txMargin / txRevenue) * 100).toFixed(1)}%
                            </div>
                          )}
                        </td>

                        <td style={{ ...tdStyle, maxWidth: 180, whiteSpace: "normal" }}>
                          {tx.notes ?? <span style={{ color: "#3A342A" }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              basePath="/admin/sales"
              extraParams={Object.keys(extraParams).length > 0 ? extraParams : undefined}
            />
          </>
        )}
      </div>
    </div>
  );
}
