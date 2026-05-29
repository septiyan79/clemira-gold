"use client";

export default function PrintButton({ label = "Cetak Invoice" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      style={{
        padding: "8px 16px",
        background: "rgba(201,168,76,0.12)",
        color: "#C9A84C",
        border: "1px solid rgba(201,168,76,0.4)",
        borderRadius: 7,
        fontWeight: 600,
        fontSize: 13,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        letterSpacing: 0.2,
      }}
    >
      <span style={{ fontSize: 15 }}>🖨</span>
      {label}
    </button>
  );
}
