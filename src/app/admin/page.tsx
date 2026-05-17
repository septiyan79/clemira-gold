export default function AdminDashboard() {
  return (
    <div>
      <p className="section-label" style={{ marginBottom: "8px" }}>Overview</p>
      <h1 className="fd" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--text)", marginBottom: "28px" }}>
        Dashboard
      </h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        {[
          { label: "Total User", value: "–" },
          { label: "Total Produk", value: "–" },
          { label: "Data Harga", value: "–" },
        ].map((card) => (
          <div key={card.label} className="price-card" style={{ borderRadius: "12px", padding: "24px" }}>
            <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "10px" }}>{card.label}</p>
            <p className="fd" style={{ fontSize: "2rem", color: "var(--gold)" }}>{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
