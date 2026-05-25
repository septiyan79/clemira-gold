import ProductCard from "./ProductCard";
import { PRODUCTS } from "./promo-data";
import WhatsAppPopover from "@/components/shared/WhatsAppPopover";

export default function ProductGrid() {
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="promo-grid">
          {PRODUCTS.map(p => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
