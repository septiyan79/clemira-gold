export default function ComingSoonBanner() {
  return (
    <div style={{
      marginTop: 60,
      background: "linear-gradient(90deg,rgba(201,168,76,.12),rgba(201,168,76,.2),rgba(201,168,76,.12))",
      borderBottom: "1px solid rgba(201,168,76,.3)",
      padding: "12px 20px",
      textAlign: "center",
    }}>
      <p style={{ fontSize: 13, color: "var(--gold)", letterSpacing: 1 }}>
        ✦ Fitur notifikasi promo otomatis & filter real-time{" "}
        <span style={{
          display: "inline-block",
          background: "rgba(201,168,76,.2)",
          border: "1px solid rgba(201,168,76,.4)",
          borderRadius: 20,
          padding: "2px 10px",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 2,
          marginLeft: 8,
          verticalAlign: "middle",
        }}>SEGERA HADIR</span>
      </p>
    </div>
  );
}
