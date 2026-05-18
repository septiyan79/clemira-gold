import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const isBB  = (g: string) => g.toUpperCase().includes("BB");
const normG = (g: string) => parseFloat(g.replace(/[^\d.]/g, "")) || 0;

export async function GET(req: NextRequest) {
  const dateStr = req.nextUrl.searchParams.get("date");
  if (!dateStr) return Response.json({ error: "date required" }, { status: 400 });

  const requested = new Date(dateStr + "T00:00:00Z");

  // Find nearest date <= requested
  const target = await prisma.hargaAntam.findFirst({
    where: { tanggal: { lte: requested } },
    orderBy: { tanggal: "desc" },
    select: { tanggal: true },
  });

  if (!target) return Response.json({ rows: [], prevRows: [], date: dateStr, prevDate: null });

  // Find previous distinct date
  const prev = await prisma.hargaAntam.findFirst({
    where: { tanggal: { lt: target.tanggal } },
    orderBy: { tanggal: "desc" },
    select: { tanggal: true },
  });

  const [rows, prevRows] = await Promise.all([
    prisma.hargaAntam.findMany({ where: { tanggal: target.tanggal } }),
    prev
      ? prisma.hargaAntam.findMany({ where: { tanggal: prev.tanggal } })
      : Promise.resolve([]),
  ]);

  const serialize = (r: { gramasi: string; harga: bigint }) => ({
    gramasi: r.gramasi,
    harga: Number(r.harga),
    isBB: isBB(r.gramasi),
    gram: normG(r.gramasi),
  });

  return Response.json({
    rows: rows.map(serialize),
    prevRows: prevRows.map(serialize),
    date: target.tanggal.toISOString().slice(0, 10),
    prevDate: prev?.tanggal.toISOString().slice(0, 10) ?? null,
  });
}
