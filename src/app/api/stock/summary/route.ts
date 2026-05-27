import { prisma } from "@/lib/prisma";

export async function GET() {
  const units = await prisma.stockUnit.findMany({
    where: { status: "available" },
    include: {
      product: { select: { brand: true, weightGram: true, series: true } },
      owner:   { select: { name: true } },
    },
  });

  // Group by owner + brand + weightGram + series + mintYear
  const grouped = new Map<string, {
    owner: string;
    brand: string | null;
    weightGram: number;
    series: string | null;
    mintYear: number | null;
    unitCount: number;
    totalCogs: number;
  }>();

  for (const u of units) {
    const key = [
      u.owner.name,
      u.product.brand,
      u.product.weightGram.toString(),
      u.product.series,
      u.mintYear,
    ].join("|");

    const existing = grouped.get(key);
    const cogs = u.referencePrice?.toNumber() ?? 0;

    if (existing) {
      existing.unitCount += 1;
      existing.totalCogs += cogs;
    } else {
      grouped.set(key, {
        owner: u.owner.name,
        brand: u.product.brand,
        weightGram: u.product.weightGram.toNumber(),
        series: u.product.series,
        mintYear: u.mintYear,
        unitCount: 1,
        totalCogs: cogs,
      });
    }
  }

  return Response.json(Array.from(grouped.values()));
}
