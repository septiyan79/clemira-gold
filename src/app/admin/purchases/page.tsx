import { prisma } from "@/lib/prisma";
import Pagination from "@/components/admin/Pagination";

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

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const rawPage = parseInt(pageParam ?? "1", 10);

  // All-time KPI aggregates (not paginated)
  const [totalOrders, totalUnitsAgg, amountAgg] = await Promise.all([
    prisma.purchaseOrder.count(),
    prisma.purchaseOrderLine.count(),
    prisma.purchaseOrder.aggregate({ _sum: { totalAmount: true } }),
  ]);
  const totalAmount = amountAgg._sum.totalAmount?.toNumber() ?? 0;

  const totalPages = Math.max(1, Math.ceil(totalOrders / PAGE_SIZE));
  const page       = Math.min(Math.max(1, isNaN(rawPage) ? 1 : rawPage), totalPages);
  const skip       = (page - 1) * PAGE_SIZE;

  const orders = await prisma.purchaseOrder.findMany({
    include: {
      supplier: { select: { name: true } },
      lines: {
        include: {
          stockUnit: {
            include: {
              product: { select: { brand: true, weightGram: true, series: true } },
              owner:   { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { purchasedAt: "desc" },
    skip,
    take: PAGE_SIZE,
  });

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

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Order",     value: totalOrders.toString(),     sub: "purchase order" },
          { label: "Total Unit",      value: totalUnitsAgg.toString(),   sub: "unit emas"      },
          { label: "Total Pembelian", value: fmt(totalAmount),           sub: "nilai beli"     },
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
        {orders.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>◈</p>
            <p style={{ fontSize: 15, color: "#5A5045" }}>Belum ada pembelian tercatat</p>
          </div>
        ) : (
          <>
            {/* Row count info */}
            <div style={{ fontSize: 12, color: "#5A5045", marginBottom: 16 }}>
              Menampilkan {skip + 1}–{Math.min(skip + orders.length, totalOrders)} dari {totalOrders} order
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 700 }}>
                <thead>
                  <tr>
                    {["Tgl Beli", "Supplier", "Unit", "Total", "Spot Price", "Catatan"].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="adm-tr-hover">
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
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {order.lines.map((line) => {
                            const p = line.stockUnit.product;
                            return (
                              <div key={line.id}>
                                <div style={{ color: "#EDE8DE" }}>
                                  {p.brand ?? "—"} {p.weightGram.toNumber()}gr
                                  {p.series && <span style={{ color: "#5A5045" }}> ({p.series})</span>}
                                </div>
                                <div style={{ fontSize: 11, color: "#5A5045" }}>
                                  {line.stockUnit.owner.name} · {line.stockUnit.serialNumber ?? "no serial"} · {fmt(line.unitPrice.toNumber())}
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

            <Pagination page={page} totalPages={totalPages} basePath="/admin/purchases" />
          </>
        )}
      </div>
    </div>
  );
}
