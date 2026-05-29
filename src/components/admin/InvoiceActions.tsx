"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  transactionId: string;
  status: string;
  invoiceNo: string;
}

export default function InvoiceActions({ transactionId, status, invoiceNo }: Props) {
  const router = useRouter();
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirmPayment() {
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/transactions/${transactionId}`, { method: "PATCH" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setConfirmingPayment(false);
      router.push(`/admin/invoices/receipts/${transactionId}`);
      router.refresh();
    } catch {
      alert("Gagal konfirmasi pembayaran. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/transactions/${transactionId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      router.push("/admin/sales");
      router.refresh();
    } catch {
      alert("Gagal menghapus transaksi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {status === "pending" && (
          <button
            onClick={() => setConfirmingPayment(true)}
            style={{
              padding: "8px 16px",
              background: "linear-gradient(135deg, #43a047, #2e7d32)",
              color: "#fff",
              border: "none",
              borderRadius: 7,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
              boxShadow: "0 2px 8px rgba(67,160,71,0.35)",
              letterSpacing: 0.2,
            }}
          >
            <span style={{ fontSize: 15 }}>✓</span>
            Konfirmasi Pembayaran
          </button>
        )}

        {status === "paid" && (
          <a
            href={`/admin/invoices/receipts/${transactionId}`}
            style={{
              padding: "8px 16px",
              background: "linear-gradient(135deg, #43a047, #2e7d32)",
              color: "#fff",
              borderRadius: 7,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 7,
              boxShadow: "0 2px 8px rgba(67,160,71,0.35)",
            }}
          >
            <span>📄</span>
            Lihat Kwitansi
          </a>
        )}

        {status !== "paid" && (
          <button
            onClick={() => setConfirmingDelete(true)}
            style={{
              padding: "8px 14px",
              background: "rgba(224,92,92,0.08)",
              color: "#e05c5c",
              border: "1px solid rgba(224,92,92,0.35)",
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
            <span style={{ fontSize: 14 }}>🗑</span>
            Hapus
          </button>
        )}
      </div>

      {/* Modal Konfirmasi Pembayaran */}
      {confirmingPayment && (
        <Modal onClose={() => !loading && setConfirmingPayment(false)}>
          <div style={{ fontSize: 20, marginBottom: 8 }}>✓</div>
          <h3 style={{ margin: "0 0 8px", color: "#222" }}>Konfirmasi Pembayaran</h3>
          <p style={{ margin: "0 0 20px", color: "#666", fontSize: 14, lineHeight: 1.5 }}>
            Invoice <strong style={{ fontFamily: "monospace" }}>{invoiceNo}</strong> akan ditandai sebagai{" "}
            <strong style={{ color: "#2e7d32" }}>LUNAS</strong> dan kwitansi resmi akan digenerate.
            <br />Tindakan ini tidak dapat dibatalkan.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setConfirmingPayment(false)} disabled={loading} style={btnSecondary}>
              Batal
            </button>
            <button onClick={handleConfirmPayment} disabled={loading} style={btnGreen}>
              {loading ? "Memproses..." : "Ya, Konfirmasi"}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Konfirmasi Hapus */}
      {confirmingDelete && (
        <Modal onClose={() => !loading && setConfirmingDelete(false)}>
          <div style={{ fontSize: 20, marginBottom: 8 }}>⚠️</div>
          <h3 style={{ margin: "0 0 8px", color: "#222" }}>Hapus Transaksi</h3>
          <p style={{ margin: "0 0 4px", color: "#666", fontSize: 14, lineHeight: 1.5 }}>
            Invoice <strong style={{ fontFamily: "monospace" }}>{invoiceNo}</strong> beserta semua datanya akan dihapus permanen.
          </p>
          <p style={{ margin: "0 0 20px", color: "#e05c5c", fontSize: 13 }}>
            Stok unit yang terjual akan dikembalikan ke status <strong>tersedia</strong>.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setConfirmingDelete(false)} disabled={loading} style={btnSecondary}>
              Batal
            </button>
            <button onClick={handleDelete} disabled={loading} style={btnRed}>
              {loading ? "Menghapus..." : "Ya, Hapus"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 12, padding: "28px 32px",
          maxWidth: 420, width: "90%", boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
          textAlign: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

const btnSecondary: React.CSSProperties = {
  padding: "9px 20px", background: "transparent", color: "#666",
  border: "1px solid #ddd", borderRadius: 6, fontWeight: 600,
  fontSize: 14, cursor: "pointer",
};
const btnGreen: React.CSSProperties = {
  padding: "9px 20px", background: "#4CAF50", color: "#fff",
  border: "none", borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: "pointer",
};
const btnRed: React.CSSProperties = {
  padding: "9px 20px", background: "#e05c5c", color: "#fff",
  border: "none", borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: "pointer",
};
