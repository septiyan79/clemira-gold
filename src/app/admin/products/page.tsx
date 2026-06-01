import { prisma } from "@/lib/prisma";
import ProductForm from "./ProductForm";
import ProductTable, { type ProductRow } from "./ProductTable";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const [products, unitCounts] = await Promise.all([
    prisma.product.findMany({
      orderBy: [{ brand: "asc" }, { weightGram: "asc" }, { series: "asc" }],
    }),
    prisma.stockUnit.groupBy({
      by: ["productId", "status"],
      _count: { id: true },
    }),
  ]);

  type UnitStat = { available: number; sold: number; swapped: number; total: number };
  const statMap = new Map<string, UnitStat>();
  for (const row of unitCounts) {
    const s = statMap.get(row.productId) ?? { available: 0, sold: 0, swapped: 0, total: 0 };
    s.total += row._count.id;
    if (row.status === "available")    s.available += row._count.id;
    else if (row.status === "sold")    s.sold      += row._count.id;
    else if (row.status === "swapped_out") s.swapped += row._count.id;
    statMap.set(row.productId, s);
  }

  const rows: ProductRow[] = products.map((p) => ({
    id:         p.id,
    sku:        p.sku,
    name:       p.name,
    brand:      p.brand,
    weightGram: p.weightGram.toNumber(),
    purity:     p.purity,
    series:     p.series,
    stat:       statMap.get(p.id) ?? { available: 0, sold: 0, swapped: 0, total: 0 },
  }));

  const totalProducts  = products.length;
  const totalAvailable = rows.reduce((s, r) => s + r.stat.available, 0);
  const totalUnits     = rows.reduce((s, r) => s + r.stat.total,     0);

  return (
    <div>
      <p className="section-label" style={{ marginBottom: 8 }}>Produk</p>
      <div style={{ marginBottom: 28 }}>
        <h1 className="fd" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--text)" }}>
          Daftar Produk
        </h1>
        <p style={{ fontSize: 13, color: "#5A5045", marginTop: 4 }}>
          Katalog produk emas yang terdaftar di sistem
        </p>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Produk",  value: totalProducts.toString(),  sub: "jenis produk"   },
          { label: "Unit Tersedia", value: totalAvailable.toString(), sub: "unit available" },
          { label: "Total Unit",    value: totalUnits.toString(),     sub: "semua status"   },
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

      {/* Form tambah produk */}
      <ProductForm />

      {/* Tabel produk */}
      <div style={{
        background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 16, padding: 24,
      }}>
        <ProductTable products={rows} />
      </div>
    </div>
  );
}
