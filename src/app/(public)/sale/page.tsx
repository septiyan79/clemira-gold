import { prisma } from "@/lib/prisma";
import { cleanupOldPromos } from "@/app/admin/promos/actions";
import PromoHero from "@/components/sale/PromoHero";
import ProductGrid from "@/components/sale/ProductGrid";
import PromoCTA from "@/components/sale/PromoCTA";
import ComingSoonBanner from "@/components/sale/ComingSoonBanner";
import type { DailyPromoItem } from "@/components/sale/promo-data";

export const dynamic = "force-dynamic";

function getToday(): Date {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000); // UTC+7 WIB
  return new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()));
}

export default async function SalePage() {
  await cleanupOldPromos();

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
          transform: translateY(-6px);
          border-color: rgba(201,168,76,.45) !important;
          box-shadow: 0 16px 48px rgba(0,0,0,.6), 0 0 0 1px rgba(201,168,76,.15), 0 0 32px rgba(201,168,76,.08) !important;
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
