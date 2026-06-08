import { prisma } from "@/lib/prisma";
import { cleanupOldPromos } from "./actions";
import PromoForm from "./PromoForm";
import PromoTable from "./PromoTable";
import ShareButton from "./ShareButton";

export const dynamic = "force-dynamic";

function getToday(): Date {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000); // UTC+7 WIB
  return new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()));
}

export default async function PromosPage() {
  await cleanupOldPromos();

  const promos = await prisma.dailyPromo.findMany({
    where: { tanggal: getToday() },
    orderBy: { createdAt: "asc" },
  });

  const promoRows = promos.map(p => ({
    id:        p.id,
    nama:      p.nama,
    gramasi:   p.gramasi,
    badgeType: p.badgeType,
    hargaJual: p.hargaJual.toNumber(),
    stok:      p.stok,
    kondisi:   p.kondisi,
    deskripsi: p.deskripsi,
    tags:      p.tags,
  }));

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <p className="section-label" style={{ marginBottom: 6 }}>Konten</p>
        <h1 className="fd" style={{ fontSize: "1.8rem", fontWeight: 300, color: "#EDE8DE", marginBottom: 4 }}>
          Promo Harian
        </h1>
        <p style={{ fontSize: 13, color: "#5A5045" }}>{today}</p>
      </div>

      <PromoForm />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "#7A6E5F", letterSpacing: 1, textTransform: "uppercase", margin: 0 }}>
          Item Promo Hari Ini ({promoRows.length})
        </h2>
        <ShareButton promos={promoRows} />
      </div>

      <PromoTable promos={promoRows} />
    </div>
  );
}
