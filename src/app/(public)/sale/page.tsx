import ComingSoonBanner from "@/components/sale/ComingSoonBanner";
import PromoHero from "@/components/sale/PromoHero";
import ProductGrid from "@/components/sale/ProductGrid";
import ComingSoonFeatures from "@/components/sale/ComingSoonFeatures";
import PromoCTA from "@/components/sale/PromoCTA";
import PromoFooter from "@/components/sale/PromoFooter";

export default function SalePage() {
  return (
    <>
      <ComingSoonBanner />
      <PromoHero />
      <div className="shimmer-line" />
      {/* <ProductGrid /> */}
      <ComingSoonFeatures />
      <PromoCTA />
      <div className="shimmer-line" />
      <PromoFooter />

      <style>{`
        .promo-card:hover {
          transform: translateY(-4px);
          border-color: rgba(201,168,76,.5) !important;
        }
        @media(max-width:900px){
          .promo-grid{grid-template-columns:repeat(2,1fr) !important}
          .cs-grid{grid-template-columns:repeat(2,1fr) !important}
          .foot-grid{grid-template-columns:1fr 1fr !important;gap:24px !important}
        }
        @media(max-width:600px){
          .promo-grid{grid-template-columns:1fr !important}
          .cs-grid{grid-template-columns:1fr !important}
          .foot-grid{grid-template-columns:1fr 1fr !important}
        }
      `}</style>
    </>
  );
}
