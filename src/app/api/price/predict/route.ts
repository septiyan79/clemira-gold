export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { holtsPredict } from "@/lib/predict";

const isBB  = (g: string) => g.toUpperCase().includes("BB");
const normG = (g: string) => parseFloat(g.replace(/[^\d.]/g, "")) || 0;

export async function GET() {
  const from = new Date();
  from.setDate(from.getDate() - 45);
  from.setHours(0, 0, 0, 0);

  const allRows = await prisma.hargaAntam.findMany({
    where: { tanggal: { gte: from } },
    orderBy: { tanggal: "asc" },
    select: { tanggal: true, gramasi: true, harga: true },
  });

  // Keep only 1g sell price (non-BB), one per date — same logic as chart-data
  const byDate = new Map<string, number>();
  for (const row of allRows) {
    if (normG(row.gramasi) !== 1 || isBB(row.gramasi)) continue;
    const key = row.tanggal.toISOString().slice(0, 10);
    byDate.set(key, Number(row.harga));
  }

  const sorted = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));

  if (sorted.length < 5) {
    return Response.json({ error: "Insufficient data" }, { status: 422 });
  }

  const prices = sorted.map(([, h]) => h);
  const basedOnDate = sorted[sorted.length - 1][0];

  const base = new Date(basedOnDate + "T00:00:00Z");
  base.setUTCDate(base.getUTCDate() + 1);
  const predictedDate = base.toISOString().slice(0, 10);

  const result = holtsPredict(prices);

  return Response.json(
    {
      predictedDate,
      predictedSell: result.predicted,
      lower: result.lower,
      upper: result.upper,
      trend: result.trend,
      basedOnDate,
      dataPoints: prices.length,
    },
    {
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=300" },
    },
  );
}
