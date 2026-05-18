import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const isBB  = (g: string) => g.toUpperCase().includes("BB");
const normG = (g: string) => parseFloat(g.replace(/[^\d.]/g, "")) || 0;

export async function GET(req: NextRequest) {
  const year  = parseInt(req.nextUrl.searchParams.get("year")  ?? "");
  const month = parseInt(req.nextUrl.searchParams.get("month") ?? ""); // 1-12
  if (!year || !month) return Response.json({ error: "year and month required" }, { status: 400 });

  const start    = new Date(Date.UTC(year, month - 1, 1));
  const end      = new Date(Date.UTC(year, month,     1));
  const prevStart= new Date(Date.UTC(year, month - 2, 1));

  const [rows, prevRows] = await Promise.all([
    prisma.hargaAntam.findMany({ where: { tanggal: { gte: start, lt: end } }, orderBy: { tanggal: "asc" } }),
    prisma.hargaAntam.findMany({ where: { tanggal: { gte: prevStart, lt: start } }, orderBy: { tanggal: "desc" } }),
  ]);

  // Group by date for current month
  const byDate = new Map<string, { sell?: number; bb?: number }>();
  for (const r of rows) {
    if (normG(r.gramasi) !== 1) continue;
    const key = r.tanggal.toISOString().slice(0, 10);
    if (!byDate.has(key)) byDate.set(key, {});
    const entry = byDate.get(key)!;
    if (isBB(r.gramasi)) entry.bb = Number(r.harga);
    else entry.sell = Number(r.harga);
  }

  // Last prices from previous month
  let prevLastSell: number | null = null;
  let prevLastBb:   number | null = null;
  for (const r of prevRows) {
    if (normG(r.gramasi) !== 1) continue;
    if (isBB(r.gramasi)  && prevLastBb   === null) prevLastBb   = Number(r.harga);
    if (!isBB(r.gramasi) && prevLastSell  === null) prevLastSell = Number(r.harga);
    if (prevLastSell !== null && prevLastBb !== null) break;
  }

  const days = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, sell: v.sell ?? null, bb: v.bb ?? null }));

  return Response.json({ days, prevLastSell, prevLastBb });
}
