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
      <style>{`
        .inv-btn-danger:hover { background: rgba(224,92,92,0.12) !important; color: #e07070 !important; }
      `}</style>

      <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
        {status === "pending" && (
          <button onClick={() => setConfirmingPayment(true)} style={btnGreen}>
            <CheckIcon />
            Konfirmasi Bayar
          </button>
        )}

        {status === "paid" && (
          <a href={`/admin/invoices/receipts/${transactionId}`} style={{ ...btnGreen, textDecoration: "none" }}>
            <ReceiptIcon />
            <span className="inv-btn-label">Lihat Kwitansi</span>
          </a>
        )}

        {status !== "paid" && (
          <button onClick={() => setConfirmingDelete(true)} className="inv-btn-danger" style={btnDanger}>
            <TrashIcon />
          </button>
        )}
      </div>

      {/* Modal Konfirmasi Pembayaran */}
      {confirmingPayment && (
        <Modal onClose={() => !loading && setConfirmingPayment(false)}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>✓</div>
          <h3 style={{ margin: "0 0 8px", color: "#222", fontSize: 16 }}>Konfirmasi Pembayaran</h3>
          <p style={{ margin: "0 0 20px", color: "#666", fontSize: 13, lineHeight: 1.6 }}>
            Invoice <strong style={{ fontFamily: "monospace" }}>{invoiceNo}</strong> akan ditandai sebagai{" "}
            <strong style={{ color: "#2e7d32" }}>LUNAS</strong> dan kwitansi resmi akan digenerate.
            <br />Tindakan ini tidak dapat dibatalkan.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setConfirmingPayment(false)} disabled={loading} style={modalBtnSecondary}>
              Batal
            </button>
            <button onClick={handleConfirmPayment} disabled={loading} style={modalBtnGreen}>
              {loading ? "Memproses..." : "Ya, Konfirmasi"}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Konfirmasi Hapus */}
      {confirmingDelete && (
        <Modal onClose={() => !loading && setConfirmingDelete(false)}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>⚠️</div>
          <h3 style={{ margin: "0 0 8px", color: "#222", fontSize: 16 }}>Hapus Transaksi</h3>
          <p style={{ margin: "0 0 4px", color: "#666", fontSize: 13, lineHeight: 1.6 }}>
            Invoice <strong style={{ fontFamily: "monospace" }}>{invoiceNo}</strong> beserta semua datanya akan dihapus permanen.
          </p>
          <p style={{ margin: "0 0 20px", color: "#e05c5c", fontSize: 12 }}>
            Stok unit yang terjual akan dikembalikan ke status <strong>tersedia</strong>.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setConfirmingDelete(false)} disabled={loading} style={modalBtnSecondary}>
              Batal
            </button>
            <button onClick={handleDelete} disabled={loading} style={modalBtnRed}>
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
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 12, padding: "28px 32px",
        maxWidth: 420, width: "90%", boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
        textAlign: "center",
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────────
function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16l3-2 2 2 3-2 3 2 2-2 3 2V4a2 2 0 0 0-2-2z" />
      <line x1="9" y1="9" x2="15" y2="9" />
      <line x1="9" y1="13" x2="15" y2="13" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

// ── Button styles ─────────────────────────────────────────────────────────────
const btnBase: React.CSSProperties = {
  height: 32, borderRadius: 7, fontWeight: 500, fontSize: 12,
  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
  fontFamily: "inherit", border: "none", whiteSpace: "nowrap",
  transition: "background 0.15s",
};
const btnGreen: React.CSSProperties = {
  ...btnBase, padding: "0 12px",
  background: "rgba(76,175,80,0.12)", color: "#81c784",
};
const btnDanger: React.CSSProperties = {
  ...btnBase, padding: "0 10px",
  background: "rgba(255,255,255,0.05)", color: "rgba(237,232,222,0.35)",
};

// Modal buttons
const modalBtnSecondary: React.CSSProperties = {
  padding: "8px 18px", background: "transparent", color: "#666",
  border: "1px solid #e0e0e0", borderRadius: 7, fontWeight: 500,
  fontSize: 13, cursor: "pointer",
};
const modalBtnGreen: React.CSSProperties = {
  padding: "8px 18px", background: "#4CAF50", color: "#fff",
  border: "none", borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: "pointer",
};
const modalBtnRed: React.CSSProperties = {
  padding: "8px 18px", background: "#e05c5c", color: "#fff",
  border: "none", borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: "pointer",
};
