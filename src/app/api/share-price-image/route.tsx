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
    border: up ? "1px solid rgba(76,175,80,.4)" : "1px solid rgba(239,83,80,.4)",
    bg:    up ? "rgba(76,175,80,0.1)"           : "rgba(239,83,80,0.1)",
  };
}

export async function GET(req: NextRequest): Promise<Response> {
  const dateStr  = req.nextUrl.searchParams.get("date") || todayWIB();
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
    prev ? prisma.hargaAntam.findMany({ where: { tanggal: prev.tanggal } }) : Promise.resolve([]),
  ]);

  const serialize = (r: { gramasi: string; harga: bigint }) => ({
    harga: Number(r.harga),
    isBB:  isBB(r.gramasi),
    gram:  normG(r.gramasi),
  });

  const cur = rows.map(serialize);
  const prv = prevRows.map(serialize);

  const sell1g     = cur.find(r => r.gram === 1 && !r.isBB)?.harga ?? null;
  const bb1g       = cur.find(r => r.gram === 1 && r.isBB)?.harga  ?? null;
  const prevSell1g = prv.find(r => r.gram === 1 && !r.isBB)?.harga ?? null;
  const prevBb1g   = prv.find(r => r.gram === 1 && r.isBB)?.harga  ?? null;

  const diff1g   = sell1g !== null && prevSell1g !== null ? sell1g - prevSell1g : null;
  const pct1g    = diff1g   !== null && prevSell1g ? (diff1g   / prevSell1g) * 100 : null;
  const diffBb1g = bb1g   !== null && prevBb1g   !== null ? bb1g   - prevBb1g   : null;
  const pctBb1g  = diffBb1g !== null && prevBb1g  ? (diffBb1g / prevBb1g)  * 100 : null;

  const resolvedDate = target.tanggal.toISOString().slice(0, 10);

  const [fontRegular, fontMedium, fontCormorant, logoBuffer, qrBuffer] = await Promise.all([
    Promise.resolve(fs.readFileSync(path.join(process.cwd(), "public", "fonts", "DMSans-Regular.ttf"))),
    Promise.resolve(fs.readFileSync(path.join(process.cwd(), "public", "fonts", "DMSans-Medium.ttf"))),
    Promise.resolve(fs.readFileSync(path.join(process.cwd(), "public", "fonts", "CormorantGaramond-SemiBold.ttf"))),
    Promise.resolve(fs.readFileSync(path.join(process.cwd(), "public", "fonts", "logo-small.png"))),
    QRCode.toBuffer("https://clemira-gold.vercel.app/", {
      type:  "png",
      color: { dark: "#C9A84C", light: "#1A1510" },
      width: 160,
      margin: 1,
    }),
  ]);

  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  const qrSrc   = `data:image/png;base64,${qrBuffer.toString("base64")}`;

  const sell1gDiff = diff1g   !== null ? diffLabel(diff1g)   : null;
  const sell1gPct  = pct1g    !== null ? pctLabel(pct1g)     : null;
  const bb1gDiff   = diffBb1g !== null ? diffLabel(diffBb1g) : null;
  const bb1gPct    = pctBb1g  !== null ? pctLabel(pctBb1g)   : null;

  // Square format — fills WhatsApp mobile preview much better
  const W = 1080;
  const H = 1080;

  const Arrow = ({ up }: { up: boolean }) => (
    <svg width="28" height="28" viewBox="0 0 18 18" style={{ marginRight: 8 }}>
      {up
        ? <polygon points="9,3 17,15 1,15" fill="#4CAF50" />
        : <polygon points="9,15 17,3 1,3"  fill="#EF5350" />
      }
    </svg>
  );

  // Reusable price card
  const PriceCard = ({
    label, price, priceColor, cardBg, cardBorder, diffData, pctData,
  }: {
    label: string;
    price: number | null;
    priceColor: string;
    cardBg: string;
    cardBorder: string;
    diffData: ReturnType<typeof diffLabel> | null;
    pctData:  ReturnType<typeof pctLabel>  | null;
  }) => (
    <div style={{
      display: "flex", flexDirection: "column", flex: 1,
      background: cardBg, border: cardBorder,
      borderRadius: 20, padding: "44px 48px",
    }}>
      <span style={{ fontSize: 26, letterSpacing: 4, color: "#8A7E6E", fontWeight: 500, marginBottom: 20 }}>
        {label}
      </span>
      <span style={{ fontSize: 48, fontWeight: 500, color: priceColor, lineHeight: 1.05, marginBottom: 28, whiteSpace: "nowrap" }}>
        {price !== null ? fmt(price) : "—"}
      </span>
      {diffData && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            {diffData.up !== null && <Arrow up={diffData.up} />}
            <span style={{ fontSize: 34, color: diffData.color, fontWeight: 400 }}>{diffData.text}</span>
          </div>
          {pctData && (
            <div style={{
              display: "flex", alignSelf: "flex-start",
              padding: "10px 24px", borderRadius: 32,
              border: pctData.border, background: pctData.bg,
            }}>
              <span style={{ fontSize: 30, color: pctData.color, fontWeight: 500 }}>{pctData.text}</span>
            </div>
          )}
        </div>
      )}
      {!diffData && price !== null && (
        <span style={{ fontSize: 24, color: "#4A3E2E" }}>Tidak ada data pembanding</span>
      )}
    </div>
  );

  const element = (
    <div style={{
      width: W, height: H,
      background: "#1A1510",
      display: "flex", flexDirection: "column",
      padding: "72px 80px 64px",
      fontFamily: "DM Sans",
      position: "relative",
    }}>
      {/* Gold top border */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 6,
        background: "linear-gradient(90deg, #C9A84C, #E8D49A, #C9A84C)",
        display: "flex",
      }} />

      {/* Header */}
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
        {/* Brand */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 24 }}>
          <img src={logoSrc} width={88} height={88} style={{ objectFit: "contain" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: "Cormorant", fontSize: 50, fontWeight: 600, color: "#EDE8DE", letterSpacing: 1, lineHeight: 1 }}>
              Clemira Gold
            </span>
            <span style={{ fontSize: 22, color: "#7A6E5F", letterSpacing: 2.5, marginTop: 8 }}>
              Jual Beli Logam Mulia Antam Terpercaya
            </span>
          </div>
        </div>
        {/* Date */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <span style={{ fontSize: 26, color: "#6A5E4E", letterSpacing: 2, fontWeight: 500 }}>
            {new Date(resolvedDate + "T00:00:00Z").toLocaleDateString("id-ID", { weekday: "long", timeZone: "UTC" })}
          </span>
          <span style={{ fontSize: 30, color: "#9A8E7E", letterSpacing: 0.5, textAlign: "right" }}>
            {new Date(resolvedDate + "T00:00:00Z").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(201,168,76,0.3)", display: "flex", marginBottom: 36 }} />

      {/* Section label */}
      <span style={{ fontSize: 22, letterSpacing: 4, color: "#6A5E4E", fontWeight: 500, marginBottom: 28 }}>
        INFORMASI HARGA DASAR ANTAM
      </span>

      {/* Price cards */}
      <div style={{ display: "flex", flexDirection: "row", gap: 32, flex: 1 }}>
        <PriceCard
          label="HARGA JUAL"
          price={sell1g}
          priceColor="#EDE8DE"
          cardBg="rgba(255,255,255,0.03)"
          cardBorder="1px solid rgba(255,255,255,0.09)"
          diffData={sell1gDiff}
          pctData={sell1gPct}
        />
        <PriceCard
          label="HARGA BUYBACK"
          price={bb1g}
          priceColor="#C9A84C"
          cardBg="rgba(201,168,76,0.05)"
          cardBorder="1px solid rgba(201,168,76,0.2)"
          diffData={bb1gDiff}
          pctData={bb1gPct}
        />
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(201,168,76,0.2)", display: "flex", marginTop: 40, marginBottom: 32 }} />

      {/* Footer */}
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 24, color: "#5A5045", letterSpacing: 0.5 }}>source: www.logammulia.com</span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <img src={qrSrc} width={140} height={140} style={{ borderRadius: 6 }} />
          <span style={{ fontSize: 22, color: "#7A6E5F", letterSpacing: 2 }}>Scan. Explore. Invest</span>
        </div>
      </div>
    </div>
  );

  return new ImageResponse(element, {
    width: W,
    height: H,
    fonts: [
      { name: "DM Sans",   data: fontRegular,   weight: 400, style: "normal" },
      { name: "DM Sans",   data: fontMedium,    weight: 500, style: "normal" },
      { name: "Cormorant", data: fontCormorant, weight: 600, style: "normal" },
    ],
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="clemira-gold-${resolvedDate}.png"`,
    },
  });
}
