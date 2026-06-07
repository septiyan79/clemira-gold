import WhatsAppPopover from "@/components/shared/WhatsAppPopover";

export default function ComingSoonBanner() {
  return (
    <div style={{
      marginTop: 60,
      background: "linear-gradient(90deg,rgba(201,168,76,.08),rgba(201,168,76,.15),rgba(201,168,76,.08))",
      borderBottom: "1px solid rgba(201,168,76,.2)",
      padding: "12px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      flexWrap: "wrap",
    }}>
      <p style={{ fontSize: 13, color: "#7A6E5F", letterSpacing: 0.5 }}>
        ✦ Promo hari ini belum tersedia — pantau terus!
      </p>
      <WhatsAppPopover
        message="Halo, apakah ada stok emas yang tersedia hari ini?"
        label="☏ Tanya Stok"
        className=""
        style={{
          fontSize: 12,
          color: "var(--gold)",
          background: "none",
          border: "1px solid rgba(201,168,76,.35)",
          borderRadius: 20,
          padding: "4px 14px",
          cursor: "pointer",
          fontFamily: "var(--font-dm-sans), sans-serif",
          letterSpacing: 0.5,
          whiteSpace: "nowrap",
        }}
      />
    </div>
  );
}
