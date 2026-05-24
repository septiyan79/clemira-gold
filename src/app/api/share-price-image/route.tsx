import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const isBB  = (g: string) => g.toUpperCase().includes("BB");
const normG = (g: string) => parseFloat(g.replace(/[^\d.]/g, "")) || 0;

function todayWIB() {
  return new Date().toLocaleDateString("sv", { timeZone: "Asia/Jakarta" });
}

function fmt(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function formatDateFull(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
}

function diffLabel(diff: number) {
  if (diff === 0) return { text: "Rp 0", color: "#5A5045" };
  const up = diff > 0;
  return {
    text: (up ? "▲ +" : "▼ -") + "Rp " + Math.abs(diff).toLocaleString("id-ID"),
    color: up ? "#4CAF50" : "#EF5350",
  };
}

function pctLabel(pct: number) {
  const up = pct >= 0;
  return {
    text: (up ? "+" : "") + pct.toFixed(2) + "%",
    color: up ? "#4CAF50" : "#EF5350",
    border: up ? "1px solid rgba(76,175,80,.35)" : "1px solid rgba(239,83,80,.35)",
  };
}

export async function GET(req: NextRequest): Promise<Response> {
  const dateStr = req.nextUrl.searchParams.get("date") || todayWIB();
  const requested = new Date(dateStr + "T00:00:00Z");

  const target = await prisma.hargaAntam.findFirst({
    where: { tanggal: { lte: requested } },
    orderBy: { tanggal: "desc" },
    select: { tanggal: true },
  });

  if (!target) {
    return new Response("No data", { status: 404 });
  }

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

  const cur  = rows.map(serialize);
  const prv  = prevRows.map(serialize);

  const sell1g     = cur.find(r => r.gram === 1 && !r.isBB)?.harga ?? null;
  const bb1g       = cur.find(r => r.gram === 1 && r.isBB)?.harga ?? null;
  const prevSell1g = prv.find(r => r.gram === 1 && !r.isBB)?.harga ?? null;
  const prevBb1g   = prv.find(r => r.gram === 1 && r.isBB)?.harga ?? null;

  const diff1g   = sell1g !== null && prevSell1g !== null ? sell1g - prevSell1g : null;
  const pct1g    = diff1g !== null && prevSell1g ? (diff1g / prevSell1g) * 100 : null;
  const diffBb1g = bb1g !== null && prevBb1g !== null ? bb1g - prevBb1g : null;
  const pctBb1g  = diffBb1g !== null && prevBb1g ? (diffBb1g / prevBb1g) * 100 : null;

  const resolvedDate = target.tanggal.toISOString().slice(0, 10);

  const fontRegular = fs.readFileSync(
    path.join(process.cwd(), "public", "fonts", "DMSans-Regular.ttf")
  );
  const fontMedium = fs.readFileSync(
    path.join(process.cwd(), "public", "fonts", "DMSans-Medium.ttf")
  );

  const sell1gDiff = diff1g !== null ? diffLabel(diff1g) : null;
  const sell1gPct  = pct1g  !== null ? pctLabel(pct1g)  : null;
  const bb1gDiff   = diffBb1g !== null ? diffLabel(diffBb1g) : null;
  const bb1gPct    = pctBb1g  !== null ? pctLabel(pctBb1g)   : null;

  const element = (
    <div
      style={{
        width: 1080,
        height: 1080,
        background: "#1A1510",
        display: "flex",
        flexDirection: "column",
        padding: "72px 80px",
        fontFamily: "DM Sans",
        position: "relative",
      }}
    >
      {/* Subtle gold border top */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #C9A84C, #E8D49A, #C9A84C)", display: "flex" }} />

      {/* Header */}
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 48 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 38, fontWeight: 500, color: "#C9A84C", letterSpacing: 4 }}>CLEMIRA</span>
            <span style={{ fontSize: 38, fontWeight: 400, color: "#EDE8DE", letterSpacing: 4 }}>GOLD</span>
          </div>
          <span style={{ fontSize: 14, color: "#5A5045", letterSpacing: 3, marginTop: 4 }}>UPDATE HARGA EMAS ANTAM</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ fontSize: 15, color: "#7A6E5F", letterSpacing: 0.5 }}>{formatDateFull(resolvedDate)}</span>
          <span style={{ fontSize: 13, color: "#4A3E2E", marginTop: 6, letterSpacing: 1 }}>1 GRAM</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(201,168,76,0.25)", display: "flex", marginBottom: 56 }} />

      {/* Prices */}
      <div style={{ display: "flex", flexDirection: "row", gap: 48, marginBottom: 56, flex: 1 }}>
        {/* Harga Jual */}
        <div style={{
          display: "flex", flexDirection: "column", flex: 1,
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: "40px 36px",
        }}>
          <span style={{ fontSize: 12, letterSpacing: 3, color: "#5A5045", fontWeight: 500, marginBottom: 16 }}>HARGA JUAL</span>
          <span style={{ fontSize: sell1g !== null ? 54 : 32, fontWeight: 500, color: "#EDE8DE", lineHeight: 1.1 }}>
            {sell1g !== null ? fmt(sell1g) : "—"}
          </span>
          {sell1gDiff && (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 24, gap: 10 }}>
              <span style={{ fontSize: 22, color: sell1gDiff.color, fontWeight: 400 }}>{sell1gDiff.text}</span>
              {sell1gPct && (
                <div style={{
                  display: "flex", alignSelf: "flex-start",
                  padding: "6px 16px", borderRadius: 24,
                  border: sell1gPct.border,
                  background: sell1gPct.color === "#4CAF50" ? "rgba(76,175,80,0.08)" : "rgba(239,83,80,0.08)",
                }}>
                  <span style={{ fontSize: 18, color: sell1gPct.color }}>{sell1gPct.text}</span>
                </div>
              )}
            </div>
          )}
          {!sell1gDiff && sell1g !== null && (
            <span style={{ fontSize: 15, color: "#3A342A", marginTop: 20 }}>Tidak ada data pembanding</span>
          )}
        </div>

        {/* Harga Buyback */}
        <div style={{
          display: "flex", flexDirection: "column", flex: 1,
          background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.18)",
          borderRadius: 16, padding: "40px 36px",
        }}>
          <span style={{ fontSize: 12, letterSpacing: 3, color: "#5A5045", fontWeight: 500, marginBottom: 16 }}>HARGA BUYBACK</span>
          <span style={{ fontSize: bb1g !== null ? 54 : 32, fontWeight: 500, color: "#C9A84C", lineHeight: 1.1 }}>
            {bb1g !== null ? fmt(bb1g) : "—"}
          </span>
          {bb1gDiff && (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 24, gap: 10 }}>
              <span style={{ fontSize: 22, color: bb1gDiff.color, fontWeight: 400 }}>{bb1gDiff.text}</span>
              {bb1gPct && (
                <div style={{
                  display: "flex", alignSelf: "flex-start",
                  padding: "6px 16px", borderRadius: 24,
                  border: bb1gPct.border,
                  background: bb1gPct.color === "#4CAF50" ? "rgba(76,175,80,0.08)" : "rgba(239,83,80,0.08)",
                }}>
                  <span style={{ fontSize: 18, color: bb1gPct.color }}>{bb1gPct.text}</span>
                </div>
              )}
            </div>
          )}
          {!bb1gDiff && bb1g !== null && (
            <span style={{ fontSize: 15, color: "#3A342A", marginTop: 20 }}>Tidak ada data pembanding</span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(201,168,76,0.2)", display: "flex", marginBottom: 36 }} />

      {/* Footer */}
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 15, color: "#4A3E2E", letterSpacing: 0.5 }}>Data: Antam · clemira.id</span>
        <span style={{ fontSize: 15, color: "#4A3E2E", letterSpacing: 0.5 }}>Jual Beli Emas Antam Terpercaya</span>
      </div>
    </div>
  );

  return new ImageResponse(element, {
    width: 1080,
    height: 1080,
    fonts: [
      { name: "DM Sans", data: fontRegular, weight: 400, style: "normal" },
      { name: "DM Sans", data: fontMedium,  weight: 500, style: "normal" },
    ],
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="clemira-gold-${resolvedDate}.png"`,
    },
  });
}
