import { Suspense } from "react";
import TransactionForm from "./TransactionForm";
import Link from "next/link";

export default function NewTransactionPage() {
  return (
    <div>
      <p className="section-label" style={{ marginBottom: 8 }}>Transaksi</p>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 28 }}>
        <h1 className="fd" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--text)" }}>
          Catat Transaksi
        </h1>
        <Link href="/admin/stock/units" style={{ fontSize: 12, color: "#5A5045", textDecoration: "none" }}>
          ← Kembali ke Daftar Unit
        </Link>
      </div>
      <Suspense>
        <TransactionForm />
      </Suspense>
    </div>
  );
}
