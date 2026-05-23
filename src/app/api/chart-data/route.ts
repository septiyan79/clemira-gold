export const dynamic = "force-dynamic";

import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const isBB = (g: string) => g.toUpperCase().includes("BB");
const normG = (g: string) => parseFloat(g.replace(/[^\d.]/g, "")) || 0;

export async function GET(request: NextRequest) {
  const period = request.nextUrl.searchParams.get("period") ?? "1m";
  const days = period === "1y" ? 365 : period === "3m" ? 90 : 30;

  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);

  const rows = await prisma.hargaAntam.findMany({
    where: { tanggal: { gte: from } },
    orderBy: { tanggal: "asc" },
    select: { tanggal: true, gramasi: true, harga: true },
  });

  const byDate = new Map<string, { sell?: number; bb?: number }>();
  for (const row of rows) {
    if (normG(row.gramasi) !== 1) continue;
    const key = row.tanggal.toISOString().slice(0, 10);
    if (!byDate.has(key)) byDate.set(key, {});
    const entry = byDate.get(key)!;
    if (isBB(row.gramasi)) entry.bb = Number(row.harga);
    else entry.sell = Number(row.harga);
  }

  const data = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, sell: v.sell ?? null, bb: v.bb ?? null }));

  return Response.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
