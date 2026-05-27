import { prisma } from "@/lib/prisma";
import StockTable from "./StockTable";

export const dynamic = "force-dynamic";

export default async function StockUnitsPage() {
  const raw = await prisma.stockUnit.findMany({
    include: {
      product: { select: { brand: true, weightGram: true, series: true } },
      owner:   { select: { name: true } },
      transactionLines: {
        select: {
          sellPrice: true,
          margin: true,
          transaction: { select: { transactedAt: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const units = raw.map((u) => ({
    id:           u.id,
    serialNumber: u.serialNumber,
    certCode:     u.certCode,
    mintYear:     u.mintYear,
    condition:    u.condition,
    status:       u.status,
    createdAt:    u.createdAt.toISOString(),
    referencePrice:      u.referencePrice?.toNumber() ?? null,
    actualPurchasePrice: u.actualPurchasePrice?.toNumber() ?? null,
    product: {
      brand:      u.product.brand,
      weightGram: u.product.weightGram.toNumber(),
      series:     u.product.series,
    },
    owner: { name: u.owner.name },
    sale: u.transactionLines[0]
      ? {
          sellPrice:    u.transactionLines[0].sellPrice.toNumber(),
          margin:       u.transactionLines[0].margin.toNumber(),
          transactedAt: u.transactionLines[0].transaction.transactedAt.toISOString(),
        }
      : null,
  }));

  return (
    <div>
      <p className="section-label" style={{ marginBottom: 8 }}>Stok</p>
      <h1 className="fd" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--text)", marginBottom: 28 }}>
        Daftar Unit
      </h1>
      <div style={{
        background: "rgba(255,255,255,.02)",
        border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 16,
        padding: "28px 24px",
      }}>
        <StockTable units={units} />
      </div>
    </div>
  );
}
