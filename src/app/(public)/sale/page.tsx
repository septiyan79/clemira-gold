import { prisma } from "@/lib/prisma";
import PromoHero from "@/components/sale/PromoHero";
import ProductGrid from "@/components/sale/ProductGrid";
import PromoCTA from "@/components/sale/PromoCTA";
import ComingSoonBanner from "@/components/sale/ComingSoonBanner";
import type { DailyPromoItem } from "@/components/sale/promo-data";

export const dynamic = "force-dynamic";

function getToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export default async function SalePage() {
  const rows = await prisma.dailyPromo.findMany({
    where: { tanggal: getToday() },
    orderBy: { createdAt: "asc" },
  });

  const promos: DailyPromoItem[] = rows.map(p => ({
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

  return (
    <>
      {promos.length === 0 && <ComingSoonBanner />}
      <PromoHero />
      <div className="shimmer-line" />
      <ProductGrid promos={promos} />
      <PromoCTA />

      <style>{`
        .promo-card:hover {
          transform: translateY(-4px);
          border-color: rgba(201,168,76,.5) !important;
        }
        @media(max-width:900px){
          .promo-grid{grid-template-columns:repeat(2,1fr) !important}
        }
        @media(max-width:600px){
          .promo-grid{grid-template-columns:1fr !important}
        }
      `}</style>
    </>
  );
}
