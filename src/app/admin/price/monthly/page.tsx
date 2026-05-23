import MonthlyTab from "@/components/price/MonthlyTab";

export default function AdminHargaBulanan() {
  return (
    <div>
      <p className="section-label" style={{ marginBottom: 8 }}>Harga Antam</p>
      <h1 className="fd" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--text)", marginBottom: 28 }}>
        Harga Bulanan
      </h1>
      <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, padding: "28px 24px" }}>
        <MonthlyTab />
      </div>
    </div>
  );
}
