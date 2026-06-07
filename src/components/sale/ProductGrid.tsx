import ProductCard from "./ProductCard";
import type { DailyPromoItem } from "./promo-data";
import WhatsAppPopover from "@/components/shared/WhatsAppPopover";

export default function ProductGrid({ promos }: { promos: DailyPromoItem[] }) {
  return (
    <section style={{ padding: "56px 20px 72px" }}>
      <div className="wrap">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
          <div>
            <p className="section-label" style={{ marginBottom: 8 }}>Daftar Produk</p>
            <h2 className="fd" style={{ fontSize: "1.8rem", fontWeight: 300, color: "#EDE8DE" }}>
              Stok <em style={{ color: "var(--gold)" }}>Tersedia Hari Ini</em>
            </h2>
          </div>
          <WhatsAppPopover
            message="Halo, saya mau tanya info stok emas terbaru!"
            label="☏ Tanya Stok Terbaru"
            className="btn-outline"
            style={{ fontSize: 14, padding: "10px 20px" }}
          />
        </div>

        {promos.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "72px 24px",
            color: "#5A5045",
          }}>
            <p className="fd" style={{ fontSize: "1.4rem", color: "#7A6E5F", marginBottom: 12 }}>
              Belum ada promo hari ini
            </p>
            <p style={{ fontSize: 14, marginBottom: 24 }}>
              Cek kembali besok atau hubungi kami untuk informasi stok terbaru.
            </p>
            <WhatsAppPopover
              message="Halo, apakah ada stok emas yang tersedia hari ini?"
              label="☏ Tanya Stok ke Admin"
              className="btn-gold"
              style={{ fontSize: 14, padding: "12px 24px" }}
            />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="promo-grid">
            {promos.map(p => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
