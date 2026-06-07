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
    tab?: string; page?: string; q?: string; dateFrom?: string; dateTo?: string; gramasi?: string;
  }>;
}) {
  const params = await searchParams;

  const tab      = params.tab      === "konsinyasi" ? "konsinyasi" : "beli";
  const q        = params.q        ?? "";
  const dateFrom = params.dateFrom ?? "";
  const dateTo   = params.dateTo   ?? "";
  const gramasi  = params.gramasi  ?? "";
  const rawPage  = parseInt(params.page ?? "1", 10);

  const hasFilter = !!(q || dateFrom || dateTo || gramasi);

  // ── Konsinyasi tab ───────────────────────────────────────────────────────────
  if (tab === "konsinyasi") {
    const kBase = { fulfillmentMode: "consignment" };
    const kConditions: Prisma.TransactionLineWhereInput[] = [kBase];

    if (q) {
      kConditions.push({ OR: [
        { consignmentLine: { supplier:     { name:         { contains: q, mode: "insensitive" } } } },
        { consignmentLine: { serialNumber: { contains: q, mode: "insensitive" } } },
        { stockUnit: { purchaseOrderLine: { purchaseOrder: { supplier: { name: { contains: q, mode: "insensitive" } } } } } },
        { stockUnit: { serialNumber: { contains: q, mode: "insensitive" } } },
      ]});
    }
    if (dateFrom || dateTo) {
      const txFilter: Prisma.DateTimeFilter = {};
      if (dateFrom) txFilter.gte = new Date(dateFrom);
      if (dateTo) { const e = new Date(dateTo); e.setDate(e.getDate() + 1); txFilter.lt = e; }
      kConditions.push({ transaction: { transactedAt: txFilter } });
    }
    if (gramasi) {
      const wg = parseFloat(gramasi);
      if (!isNaN(wg)) kConditions.push({ OR: [
        { consignmentLine: { product:   { weightGram: wg } } },
        { stockUnit:       { product:   { weightGram: wg } } },
      ]});
    }

    const kWhere: Prisma.TransactionLineWhereInput = { AND: kConditions };

    const [kTotal, kCogsAgg, kMarginAgg, kFilteredCount, kGramOptions] = await Promise.all([
      prisma.transactionLine.count({ where: kBase }),
      prisma.transactionLine.aggregate({ where: kBase, _sum: { cogs: true } }),
      prisma.transactionLine.aggregate({ where: kBase, _sum: { margin: true } }),
      hasFilter ? prisma.transactionLine.count({ where: kWhere }) : Promise.resolve(null as number | null),
      prisma.product.findMany({ distinct: ["weightGram"], select: { weightGram: true }, orderBy: { weightGram: "asc" } }),
    ]);

    const kTotalCogs    = kCogsAgg._sum.cogs?.toNumber() ?? 0;
    const kTotalMargin  = kMarginAgg._sum.margin?.toNumber() ?? 0;
    const kDisplayCount = hasFilter ? (kFilteredCount ?? 0) : kTotal;
    const kTotalPages   = Math.max(1, Math.ceil(kDisplayCount / PAGE_SIZE));
    const kPage         = Math.min(Math.max(1, isNaN(rawPage) ? 1 : rawPage), kTotalPages);
    const kSkip         = (kPage - 1) * PAGE_SIZE;

    const kLines = await prisma.transactionLine.findMany({
      where: kWhere,
      include: {
        transaction: { select: { id: true, transactedAt: true, buyer: { select: { name: true } } } },
        consignmentLine: {
          include: {
            supplier: { select: { name: true } },
            product:  { select: { brand: true, weightGram: true, series: true } },
          },
        },
        stockUnit: {
          include: {
            product: { select: { brand: true, weightGram: true, series: true } },
            purchaseOrderLine: {
              include: { purchaseOrder: { select: { supplier: { select: { name: true } } } } },
            },
          },
        },
      },
      orderBy: { transaction: { transactedAt: "desc" } },
      skip: kSkip,
      take: PAGE_SIZE,
    });

    const kGramArr = kGramOptions.map(p => p.weightGram.toNumber());
    const extraParams: Record<string, string> = { tab: "konsinyasi" };
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Total Item",       value: kTotal.toString(), sub: "konsinyasi"      },
            { label: "Total Harga Beli", value: fmt(kTotalCogs),   sub: "ke supplier"     },
            { label: "Total Margin",     value: fmt(kTotalMargin), sub: "dari konsinyasi" },
          ].map(({ label, value, sub }) => (
            <div key={label} style={{
              background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)",
              borderRadius: 12, padding: "20px 24px",
            }}>
              <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#5A5045", marginBottom: 8 }}>{label}</div>
              <div className="fd" style={{ fontSize: "1.6rem", fontWeight: 300, color: "var(--gold)", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: "#3A342A", marginTop: 4 }}>{sub}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, padding: 24 }}>
          <Suspense fallback={null}>
            <PurchasesFilters gramOptions={kGramArr} />
          </Suspense>

          {kLines.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>◈</p>
              <p style={{ fontSize: 15, color: "#5A5045" }}>
                {hasFilter ? "Tidak ada konsinyasi yang cocok dengan filter" : "Belum ada konsinyasi tercatat"}
              </p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: "#5A5045", marginBottom: 16 }}>
                {hasFilter
                  ? `Menampilkan ${kSkip + 1}–${Math.min(kSkip + kLines.length, kDisplayCount)} dari ${kDisplayCount} item (total: ${kTotal})`
                  : `Menampilkan ${kSkip + 1}–${Math.min(kSkip + kLines.length, kTotal)} dari ${kTotal} item`
                }
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 700 }}>
                  <thead>
                    <tr>
                      {["Bukti", "Tanggal", "Supplier", "Produk", "No. Serial", "Harga Beli", "Harga Jual", "Margin", "Pembeli"].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {kLines.map((tl) => {
                      const cl  = tl.consignmentLine;
                      const su  = tl.stockUnit;
                      const tx  = tl.transaction;
                      const supplier = cl?.supplier ?? su?.purchaseOrderLine?.purchaseOrder?.supplier;
                      const product  = cl?.product  ?? su?.product;
                      const serial   = cl?.serialNumber ?? su?.serialNumber;
                      const cogs     = tl.cogs.toNumber();
                      const sell     = tl.sellPrice.toNumber();
                      const margin   = tl.margin.toNumber();
                      return (
                        <tr key={tl.id} className="adm-tr-hover">
                          <td style={tdStyle}>
                            <a href={`/admin/invoices/consignment/${tx.id}`} style={{
                              fontSize: 11, padding: "3px 10px", borderRadius: 6,
                              border: "1px solid rgba(201,168,76,.35)",
                              background: "rgba(201,168,76,.08)", color: "var(--gold)",
                              textDecoration: "none", whiteSpace: "nowrap",
                            }}>
                              Bukti
                            </a>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ color: "#EDE8DE" }}>{fmtDate(new Date(tx.transactedAt))}</div>
                          </td>
                          <td style={{ ...tdStyle, color: "var(--gold)", fontWeight: 500 }}>
                            {supplier?.name ?? <span style={{ color: "#3A342A" }}>—</span>}
                          </td>
                          <td style={tdStyle}>
                            {product ? (
                              <div style={{ color: "#EDE8DE" }}>
                                {product.brand ?? "—"} {product.weightGram.toNumber()}gr
                                {product.series && <span style={{ color: "#5A5045" }}> ({product.series})</span>}
                              </div>
                            ) : <span style={{ color: "#3A342A" }}>—</span>}
                          </td>
                          <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 12 }}>
                            {serial ?? <span style={{ color: "#3A342A" }}>—</span>}
                          </td>
                          <td style={{ ...tdStyle, color: "#EDE8DE" }}>{fmt(cogs)}</td>
                          <td style={{ ...tdStyle, color: "#EDE8DE" }}>{fmt(sell)}</td>
                          <td style={{ ...tdStyle, color: margin >= 0 ? "#4CAF50" : "#EF5350", fontWeight: 500 }}>
                            {fmt(margin)}
                          </td>
                          <td style={tdStyle}>
                            {tx.buyer?.name ?? <span style={{ color: "#3A342A" }}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={kPage} totalPages={kTotalPages} basePath="/admin/purchases" extraParams={extraParams} />
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Beli Stok tab ────────────────────────────────────────────────────────────
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
