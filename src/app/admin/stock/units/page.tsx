import { prisma } from "@/lib/prisma";
import StockTable from "./StockTable";

export const dynamic = "force-dynamic";

const isBB  = (g: string) => g.toUpperCase().includes("BB");
const normG = (g: string) => parseFloat(g.replace(/[^\d.]/g, "")) || 0;

export default async function StockUnitsPage() {
  const [raw, latestHarga] = await Promise.all([
    prisma.stockUnit.findMany({
      include: {
        product: { select: { brand: true, weightGram: true, series: true } },
        owner:   { select: { name: true } },
        purchaseOrderLine: {
          select: {
            purchaseOrder: { select: { purchasedAt: true } },
          },
        },
        swapEventsReplacement: {
          select: { id: true },
          take: 1,
        },
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
    }),
    prisma.hargaAntam.findFirst({
      orderBy: { tanggal: "desc" },
      select:  { tanggal: true },
    }),
  ]);

  // Bangun map: gramWeight → { dasar, buyback }
  // Buyback: hanya tersedia untuk 1gr di HargaAntam.
  // Untuk berat lain dihitung: hargaBB_1gr × weightGram
  const antamMap = new Map<number, { dasar: number | null; buyback: number | null }>();
  let   bb1gr: number | null = null; // harga buyback per 1gr (basis perhitungan)

  if (latestHarga) {
    const prices = await prisma.hargaAntam.findMany({
      where:  { tanggal: latestHarga.tanggal },
      select: { gramasi: true, harga: true },
    });
    for (const p of prices) {
      const gram  = normG(p.gramasi);
      const harga = Number(p.harga);
      if (!gram) continue;
      const entry = antamMap.get(gram) ?? { dasar: null, buyback: null };
      if (isBB(p.gramasi)) {
        entry.buyback = harga;
        if (gram === 1) bb1gr = harga; // simpan basis BB 1gr
      } else {
        entry.dasar = harga;
      }
      antamMap.set(gram, entry);
    }
  }

  const units = raw.map((u) => {
    const wg    = u.product.weightGram.toNumber();
    const antam = antamMap.get(wg);

    // Harga dasar: lookup langsung per gramasi
    const antamDasar = antam?.dasar ?? null;

    // Harga buyback: lookup langsung, atau hitung dari basis 1gr × berat
    const antamBuyback = antam?.buyback
      ?? (bb1gr != null ? Math.round(bb1gr * wg) : null);

    return {
      id:           u.id,
      serialNumber: u.serialNumber,
      certCode:     u.certCode,
      mintYear:     u.mintYear,
      condition:    u.condition,
      status:       u.status,
      purchasedAt:  (u.purchaseOrderLine?.purchaseOrder.purchasedAt ?? u.createdAt).toISOString(),
      source: (u.swapEventsReplacement.length > 0 ? "swap" : u.purchaseOrderLine ? "purchase" : "unknown") as "swap" | "purchase" | "unknown",
      referencePrice:      u.referencePrice?.toNumber() ?? null,
      actualPurchasePrice: u.actualPurchasePrice?.toNumber() ?? null,
      antamDasar,
      antamBuyback,
      product: {
        brand:      u.product.brand,
        weightGram: wg,
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
    };
  });

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
