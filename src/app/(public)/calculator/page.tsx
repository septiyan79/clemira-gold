import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CalculatorPage from "./CalculatorPage";

export const dynamic = "force-dynamic";

const isBB  = (g: string) => g.toUpperCase().includes("BB");
const normG = (g: string) => parseFloat(g.replace(/[^\d.]/g, "")) || 0;

async function getPrices() {
  const latest = await prisma.hargaAntam.findFirst({
    orderBy: { tanggal: "desc" },
    select: { tanggal: true },
  });
  if (!latest) return { date: null, entries: [] };

  const rows = await prisma.hargaAntam.findMany({
    where: { tanggal: latest.tanggal },
  });

  const map = new Map<number, { jual: number | null; buyback: number | null }>();
  for (const r of rows) {
    const g = normG(r.gramasi);
    if (!g) continue;
    if (!map.has(g)) map.set(g, { jual: null, buyback: null });
    const e = map.get(g)!;
    if (isBB(r.gramasi)) e.buyback = Number(r.harga);
    else e.jual = Number(r.harga);
  }

  const entries = [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([gram, e]) => ({ gram, ...e }));

  return { date: latest.tanggal.toISOString().slice(0, 10), entries };
}

export default async function CalculatorRoute() {
  const { date, entries } = await getPrices();

  return (
    <>
      <section style={{
        padding: "48px 20px 0",
        background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(201,168,76,.1) 0%, transparent 70%), var(--dark)",
      }}>
        <div className="wrap">
          <p className="section-label" style={{ marginBottom: 10 }}>Alat Bantu</p>
          <h1 className="fd" style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)", fontWeight: 300, color: "#EDE8DE", marginBottom: 8 }}>
            Kalkulator <em style={{ color: "var(--gold)" }}>Emas</em>
          </h1>
          <p style={{ fontSize: 14, color: "#5A5045", marginBottom: 40 }}>
            Hitung biaya pembelian dan estimasi buyback emas Antam · Harga realtime
          </p>
        </div>
      </section>

      <section style={{ padding: "32px 20px 64px" }}>
        <div className="wrap">
          <CalculatorPage entries={entries} date={date} />

          <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
            <Link href="/" style={{ fontSize: 13, color: "#5A5045", textDecoration: "none" }}>
              ← Kembali ke Beranda
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
