import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";
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
  if (diff === 0) return { text: "Rp 0", color: "#5A5045", up: null };
  const up = diff > 0;
  return {
    text: (up ? "+" : "-") + "Rp " + Math.abs(diff).toLocaleString("id-ID"),
    color: up ? "#4CAF50" : "#EF5350",
    up,
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

  if (!target) return new Response("No data", { status: 404 });

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
    harga: Number(r.harga),
    isBB: isBB(r.gramasi),
    gram: normG(r.gramasi),
  });

  const cur = rows.map(serialize);
  const prv = prevRows.map(serialize);

  const sell1g     = cur.find(r => r.gram === 1 && !r.isBB)?.harga ?? null;
  const bb1g       = cur.find(r => r.gram === 1 && r.isBB)?.harga  ?? null;
  const prevSell1g = prv.find(r => r.gram === 1 && !r.isBB)?.harga ?? null;
  const prevBb1g   = prv.find(r => r.gram === 1 && r.isBB)?.harga  ?? null;

  const diff1g   = sell1g !== null && prevSell1g !== null ? sell1g - prevSell1g : null;
  const pct1g    = diff1g !== null && prevSell1g ? (diff1g / prevSell1g) * 100 : null;
  const diffBb1g = bb1g   !== null && prevBb1g   !== null ? bb1g   - prevBb1g   : null;
  const pctBb1g  = diffBb1g !== null && prevBb1g ? (diffBb1g / prevBb1g) * 100  : null;

  const resolvedDate = target.tanggal.toISOString().slice(0, 10);

  const [fontRegular, fontMedium, fontCormorant, logoBuffer, qrBuffer] = await Promise.all([
    Promise.resolve(fs.readFileSync(path.join(process.cwd(), "public", "fonts", "DMSans-Regular.ttf"))),
    Promise.resolve(fs.readFileSync(path.join(process.cwd(), "public", "fonts", "DMSans-Medium.ttf"))),
    Promise.resolve(fs.readFileSync(path.join(process.cwd(), "public", "fonts", "CormorantGaramond-SemiBold.ttf"))),
    Promise.resolve(fs.readFileSync(path.join(process.cwd(), "public", "fonts", "logo-small.png"))),
    QRCode.toBuffer("https://clemira-gold.vercel.app/", {
      type: "png",
      color: { dark: "#C9A84C", light: "#1A1510" },
      width: 120,
      margin: 1,
    }),
  ]);

  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  const qrSrc   = `data:image/png;base64,${qrBuffer.toString("base64")}`;

  const sell1gDiff = diff1g   !== null ? diffLabel(diff1g)   : null;
  const sell1gPct  = pct1g    !== null ? pctLabel(pct1g)     : null;
  const bb1gDiff   = diffBb1g !== null ? diffLabel(diffBb1g) : null;
  const bb1gPct    = pctBb1g  !== null ? pctLabel(pctBb1g)   : null;

  const W = 1080;
  const H = 650;

  const Arrow = ({ up }: { up: boolean }) => (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 6 }}>
      {up
        ? <polygon points="9,3 17,15 1,15" fill="#4CAF50" />
        : <polygon points="9,15 17,3 1,3"  fill="#EF5350" />
      }
    </svg>
  );

  const element = (
    <div style={{
      width: W, height: H,
      background: "#1A1510",
      display: "flex", flexDirection: "column",
      padding: "44px 64px",
      fontFamily: "DM Sans",
      position: "relative",
    }}>
      {/* Gold top border */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #C9A84C, #E8D49A, #C9A84C)", display: "flex" }} />

      {/* Header */}
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        {/* Brand: logo + text */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 16 }}>
          <img src={logoSrc} width={60} height={60} style={{ objectFit: "contain" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Match web nav: Cormorant Garamond 600, "Clemira Gold" */}
            <span style={{ fontFamily: "Cormorant", fontSize: 40, fontWeight: 600, color: "#EDE8DE", letterSpacing: 1 }}>
              Clemira Gold
            </span>
            <span style={{ fontSize: 14, color: "#7A6E5F", letterSpacing: 2, marginTop: 3 }}>
              Jual Beli Logam Mulia Antam Terpercaya
            </span>
          </div>
        </div>
        {/* Date */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ fontSize: 22, color: "#9A8E7E", letterSpacing: 0.5 }}>{formatDateFull(resolvedDate)}</span>
          <span style={{ fontSize: 15, color: "#6A5E4E", marginTop: 6, letterSpacing: 2 }}>1 GRAM</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(201,168,76,0.25)", display: "flex", marginBottom: 28 }} />

      {/* Section label above cards */}
      <span style={{ fontSize: 13, letterSpacing: 3, color: "#6A5E4E", fontWeight: 500, marginBottom: 16 }}>
        UPDATE HARGA DASAR ANTAM
      </span>

      {/* Prices */}
      <div style={{ display: "flex", flexDirection: "row", gap: 32, flex: 1 }}>
        {/* Harga Jual */}
        <div style={{
          display: "flex", flexDirection: "column", flex: 1,
          background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14, padding: "24px 32px",
        }}>
          <span style={{ fontSize: 14, letterSpacing: 3, color: "#8A7E6E", fontWeight: 500, marginBottom: 12 }}>HARGA JUAL</span>
          <span style={{ fontSize: 50, fontWeight: 500, color: "#EDE8DE", lineHeight: 1.05 }}>
            {sell1g !== null ? fmt(sell1g) : "—"}
          </span>
          {sell1gDiff && (
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", marginTop: 16, gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                {sell1gDiff.up !== null && <Arrow up={sell1gDiff.up} />}
                <span style={{ fontSize: 22, color: sell1gDiff.color, fontWeight: 400 }}>{sell1gDiff.text}</span>
              </div>
              {sell1gPct && (
                <div style={{
                  display: "flex", padding: "5px 14px", borderRadius: 24,
                  border: sell1gPct.border,
                  background: sell1gPct.color === "#4CAF50" ? "rgba(76,175,80,0.1)" : "rgba(239,83,80,0.1)",
                }}>
                  <span style={{ fontSize: 18, color: sell1gPct.color }}>{sell1gPct.text}</span>
                </div>
              )}
            </div>
          )}
          {!sell1gDiff && sell1g !== null && (
            <span style={{ fontSize: 14, color: "#4A3E2E", marginTop: 16 }}>Tidak ada data pembanding</span>
          )}
        </div>

        {/* Harga Buyback */}
        <div style={{
          display: "flex", flexDirection: "column", flex: 1,
          background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.18)",
          borderRadius: 14, padding: "24px 32px",
        }}>
          <span style={{ fontSize: 14, letterSpacing: 3, color: "#8A7E6E", fontWeight: 500, marginBottom: 12 }}>HARGA BUYBACK</span>
          <span style={{ fontSize: 50, fontWeight: 500, color: "#C9A84C", lineHeight: 1.05 }}>
            {bb1g !== null ? fmt(bb1g) : "—"}
          </span>
          {bb1gDiff && (
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", marginTop: 16, gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                {bb1gDiff.up !== null && <Arrow up={bb1gDiff.up} />}
                <span style={{ fontSize: 22, color: bb1gDiff.color, fontWeight: 400 }}>{bb1gDiff.text}</span>
              </div>
              {bb1gPct && (
                <div style={{
                  display: "flex", padding: "5px 14px", borderRadius: 24,
                  border: bb1gPct.border,
                  background: bb1gPct.color === "#4CAF50" ? "rgba(76,175,80,0.1)" : "rgba(239,83,80,0.1)",
                }}>
                  <span style={{ fontSize: 18, color: bb1gPct.color }}>{bb1gPct.text}</span>
                </div>
              )}
            </div>
          )}
          {!bb1gDiff && bb1g !== null && (
            <span style={{ fontSize: 14, color: "#4A3E2E", marginTop: 16 }}>Tidak ada data pembanding</span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(201,168,76,0.18)", display: "flex", marginTop: 24, marginBottom: 18 }} />

      {/* Footer */}
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 15, color: "#5A5045", letterSpacing: 0.5 }}>source: www.logammulia.com</span>
        {/* QR code sized to match text below */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <img src={qrSrc} width={112} height={112} style={{ borderRadius: 4 }} />
          <span style={{ fontSize: 13, color: "#7A6E5F", letterSpacing: 1.5 }}>Scan. Explore. Invest</span>
        </div>
      </div>
    </div>
  );

  return new ImageResponse(element, {
    width: W,
    height: H,
    fonts: [
      { name: "DM Sans",    data: fontRegular,   weight: 400, style: "normal" },
      { name: "DM Sans",    data: fontMedium,    weight: 500, style: "normal" },
      { name: "Cormorant",  data: fontCormorant, weight: 600, style: "normal" },
    ],
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="clemira-gold-${resolvedDate}.png"`,
    },
  });
}
