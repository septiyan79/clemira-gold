import { Suspense } from "react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import Pagination from "@/components/admin/Pagination";
import PurchasesFilters from "./PurchasesFilters";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

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
  padding: "12px 14px", color: "#9A8E7E", whiteSpace: "nowrap",
  borderBottom: "1px solid rgba(255,255,255,.04)", verticalAlign: "top",
};

const modeBadge = {
  swap: { label: "Swap",  color: "#CE93D8", bg: "rgba(206,147,216,.12)" },
  stok: { label: "Stok",  color: "#C9A84C", bg: "rgba(201,168,76,.12)"  },
} as const;

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string; q?: string; dateFrom?: string; dateTo?: string; gramasi?: string;
  }>;
}) {
  const params = await searchParams;

  const q        = params.q        ?? "";
  const dateFrom = params.dateFrom ?? "";
  const dateTo   = params.dateTo   ?? "";
  const gramasi  = params.gramasi  ?? "";
  const rawPage  = parseInt(params.page ?? "1", 10);

  const hasFilter = !!(q || dateFrom || dateTo || gramasi);

  // Build where clause
  const where: Prisma.PurchaseOrderWhereInput = {};

  if (q) {
    where.OR = [
      { invoiceNo: { contains: q, mode: "insensitive" } },
      { supplier: { name: { contains: q, mode: "insensitive" } } },
      { lines: { some: { stockUnit: { serialNumber: { contains: q, mode: "insensitive" } } } } },
    ];
  }
  if (dateFrom || dateTo) {
    where.purchasedAt = {};
    if (dateFrom) (where.purchasedAt as Prisma.DateTimeFilter).gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setDate(end.getDate() + 1);
      (where.purchasedAt as Prisma.DateTimeFilter).lt = end;
    }
  }
  if (gramasi) {
    const wg = parseFloat(gramasi);
    if (!isNaN(wg)) {
      where.lines = { some: { stockUnit: { product: { weightGram: wg } } } };
    }
  }

  // Parallel fetches
  const [totalOrders, totalUnitsAgg, amountAgg, filteredCount, gramOptions] = await Promise.all([
    prisma.purchaseOrder.count(),
    prisma.purchaseOrderLine.count(),
    prisma.purchaseOrder.aggregate({ _sum: { totalAmount: true } }),
    hasFilter ? prisma.purchaseOrder.count({ where }) : Promise.resolve(null as number | null),
    prisma.product.findMany({
      distinct: ["weightGram"],
      select: { weightGram: true },
      orderBy: { weightGram: "asc" },
      where: { stockUnits: { some: { purchaseOrderLine: { isNot: null } } } },
    }),
  ]);

  const totalAmount  = amountAgg._sum.totalAmount?.toNumber() ?? 0;
  const displayCount = hasFilter ? (filteredCount ?? 0) : totalOrders;
  const totalPages   = Math.max(1, Math.ceil(displayCount / PAGE_SIZE));
  const page         = Math.min(Math.max(1, isNaN(rawPage) ? 1 : rawPage), totalPages);
  const skip         = (page - 1) * PAGE_SIZE;

  const orders = await prisma.purchaseOrder.findMany({
    where,
    include: {
      supplier: { select: { name: true } },
      lines: {
        include: {
          stockUnit: {
            include: {
              product: { select: { brand: true, weightGram: true, series: true } },
              owner:   { select: { name: true } },
              swapEventsReplacement: { select: { id: true }, take: 1 },
            },
          },
        },
      },
    },
    orderBy: { purchasedAt: "desc" },
    skip,
    take: PAGE_SIZE,
  });

  const gramOptionsArr = gramOptions.map((p) => p.weightGram.toNumber());

  const extraParams: Record<string, string> = {};
  if (q)        extraParams.q        = q;
  if (dateFrom) extraParams.dateFrom = dateFrom;
  if (dateTo)   extraParams.dateTo   = dateTo;
  if (gramasi)  extraParams.gramasi  = gramasi;

  return (
    <div>
      <p className="section-label" style={{ marginBottom: 8 }}>Transaksi</p>
      <div style={{ marginBottom: 28 }}>
        <h1 className="fd" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--text)" }}>
          Riwayat Pembelian
        </h1>
        <p style={{ fontSize: 13, color: "#5A5045", marginTop: 4 }}>
          Seluruh purchase order pembelian stok emas
        </p>
      </div>

      {/* KPI Cards — all-time totals */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Order",     value: totalOrders.toString(),   sub: "purchase order" },
          { label: "Total Unit",      value: totalUnitsAgg.toString(), sub: "unit emas"      },
          { label: "Total Pembelian", value: fmt(totalAmount),         sub: "nilai beli"     },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{
            background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)",
            borderRadius: 12, padding: "20px 24px",
          }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#5A5045", marginBottom: 8 }}>
              {label}
            </div>
            <div className="fd" style={{ fontSize: "1.6rem", fontWeight: 300, color: "var(--gold)", lineHeight: 1 }}>
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
          <PurchasesFilters gramOptions={gramOptionsArr} />
        </Suspense>

        {orders.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>◈</p>
            <p style={{ fontSize: 15, color: "#5A5045" }}>
              {hasFilter ? "Tidak ada order yang cocok dengan filter" : "Belum ada pembelian tercatat"}
            </p>
          </div>
        ) : (
          <>
            {/* Row count info */}
            <div style={{ fontSize: 12, color: "#5A5045", marginBottom: 16 }}>
              {hasFilter
                ? `Menampilkan ${skip + 1}–${Math.min(skip + orders.length, displayCount)} dari ${displayCount} order (total: ${totalOrders})`
                : `Menampilkan ${skip + 1}–${Math.min(skip + orders.length, totalOrders)} dari ${totalOrders} order`
              }
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 700 }}>
                <thead>
                  <tr>
                    {["Bukti Beli", "Tgl Beli", "Supplier", "Unit", "Total", "Spot Price", "Catatan"].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="adm-tr-hover">
                      <td style={tdStyle}>
                        {order.invoiceNo ? (
                          <a
                            href={`/admin/invoices/purchases/${order.id}`}
                            style={{
                              color: "#C9A84C",
                              fontFamily: "monospace",
                              fontSize: 12,
                              fontWeight: 600,
                              textDecoration: "none",
                            }}
                          >
                            {order.invoiceNo}
                          </a>
                        ) : (
                          <span style={{ color: "#3A342A", fontFamily: "monospace", fontSize: 11 }}>—</span>
                        )}
                      </td>

                      <td style={tdStyle}>
                        <div style={{ color: "#EDE8DE" }}>{fmtDate(order.purchasedAt)}</div>
                        <div style={{ fontSize: 11, color: "#3A342A", marginTop: 2, fontFamily: "monospace" }}>
                          {order.id.slice(-8)}
                        </div>
                      </td>

                      <td style={{ ...tdStyle, color: "var(--gold)", fontWeight: 500 }}>
                        {order.supplier.name}
                      </td>

                      <td style={tdStyle}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {order.lines.map((line) => {
                            const p      = line.stockUnit.product;
                            const isSwap = line.stockUnit.swapEventsReplacement.length > 0;
                            const badge  = isSwap ? modeBadge.swap : modeBadge.stok;
                            return (
                              <div key={line.id}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#EDE8DE" }}>
                                  {p.brand ?? "—"} {p.weightGram.toNumber()}gr
                                  {p.series && <span style={{ color: "#5A5045" }}>({p.series})</span>}
                                  <span style={{
                                    padding: "1px 6px", borderRadius: 4,
                                    fontSize: 10, fontWeight: 600, letterSpacing: 0.5,
                                    color: badge.color, background: badge.bg,
                                  }}>
                                    {badge.label}
                                  </span>
                                </div>
                                <div style={{ fontSize: 11, color: "#5A5045", marginTop: 2 }}>
                                  {line.stockUnit.owner.name}
                                  {line.stockUnit.serialNumber
                                    ? ` · ${line.stockUnit.serialNumber}`
                                    : " · no serial"
                                  }
                                  {" · "}{fmt(line.unitPrice.toNumber())}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      <td style={{ ...tdStyle, color: "#EDE8DE", fontWeight: 500 }}>
                        {fmt(order.totalAmount.toNumber())}
                        <div style={{ fontSize: 11, color: "#5A5045", fontWeight: 400, marginTop: 2 }}>
                          {order.lines.length} unit
                        </div>
                      </td>

                      <td style={tdStyle}>
                        {order.goldSpotPrice
                          ? fmt(order.goldSpotPrice.toNumber())
                          : <span style={{ color: "#3A342A" }}>—</span>}
                      </td>

                      <td style={{ ...tdStyle, maxWidth: 200, whiteSpace: "normal" }}>
                        {order.notes ?? <span style={{ color: "#3A342A" }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              basePath="/admin/purchases"
              extraParams={Object.keys(extraParams).length > 0 ? extraParams : undefined}
            />
          </>
        )}
      </div>
    </div>
  );
}
