"use client";

export default function PrintButton({ label = "Cetak Invoice" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      style={{
        padding: "10px 20px",
        background: "#C9A84C",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
