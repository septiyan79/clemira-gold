import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const isBB  = (g: string) => g.toUpperCase().includes("BB");
const normG = (g: string) => parseFloat(g.replace(/[^\d.]/g, "")) || 0;

export async function GET(req: NextRequest) {
  const year = parseInt(req.nextUrl.searchParams.get("year") ?? "");
  if (!year) return Response.json({ error: "year required" }, { status: 400 });

  const start     = new Date(Date.UTC(year,     0, 1));
  const end       = new Date(Date.UTC(year + 1, 0, 1));
  const prevStart = new Date(Date.UTC(year - 1, 0, 1));

  const [rows, prevRows] = await Promise.all([
    prisma.hargaAntam.findMany({ where: { tanggal: { gte: start, lt: end } }, orderBy: { tanggal: "asc" } }),
    prisma.hargaAntam.findMany({ where: { tanggal: { gte: prevStart, lt: start } }, orderBy: { tanggal: "desc" } }),
  ]);

  // Last price per month (rows are asc so later values overwrite = last of month)
  const byMonth = new Map<number, { sell?: number; bb?: number }>();
  for (const r of rows) {
    if (normG(r.gramasi) !== 1) continue;
    const m = r.tanggal.getUTCMonth();
    if (!byMonth.has(m)) byMonth.set(m, {});
    const entry = byMonth.get(m)!;
    if (isBB(r.gramasi)) entry.bb = Number(r.harga);
    else entry.sell = Number(r.harga);
  }

  // Last prices from previous year
  let prevLastSell: number | null = null;
  let prevLastBb:   number | null = null;
  for (const r of prevRows) {
    if (normG(r.gramasi) !== 1) continue;
    if (isBB(r.gramasi)  && prevLastBb   === null) prevLastBb   = Number(r.harga);
    if (!isBB(r.gramasi) && prevLastSell  === null) prevLastSell = Number(r.harga);
    if (prevLastSell !== null && prevLastBb !== null) break;
  }

  const months = Array.from({ length: 12 }, (_, m) => ({
    month: m,
    sell: byMonth.get(m)?.sell ?? null,
    bb:   byMonth.get(m)?.bb   ?? null,
  }));

  return Response.json({ months, prevLastSell, prevLastBb });
}
