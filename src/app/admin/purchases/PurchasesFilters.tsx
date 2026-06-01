"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useRef, useTransition } from "react";

type Props = { gramOptions: number[] };

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,.04)",
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 8,
  padding: "7px 12px",
  color: "#EDE8DE",
  fontSize: 13,
  outline: "none",
};
const selStyle: React.CSSProperties = {
  ...inputStyle,
  color: "#9A8E7E",
  cursor: "pointer",
};
const optStyle: React.CSSProperties = { background: "#1A1612", color: "#EDE8DE" };

export default function PurchasesFilters({ gramOptions }: Props) {
  const sp     = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const q        = sp.get("q")        ?? "";
  const dateFrom = sp.get("dateFrom") ?? "";
  const dateTo   = sp.get("dateTo")   ?? "";
  const gramasi  = sp.get("gramasi")  ?? "";

  const hasFilter = !!(q || dateFrom || dateTo || gramasi);

  function push(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    startTransition(() => router.replace(`/admin/purchases?${params.toString()}`));
  }

  function onSearch(val: string) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => push("q", val), 400);
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20, alignItems: "center" }}>
      <input
        type="text"
        defaultValue={q}
        placeholder="Cari bukti beli, supplier, nomor seri…"
        onChange={(e) => onSearch(e.target.value)}
        style={{ ...inputStyle, width: 260 }}
      />

      <select value={gramasi} onChange={(e) => push("gramasi", e.target.value)} style={selStyle}>
        <option value="" style={optStyle}>Semua Berat</option>
        {gramOptions.map((g) => (
          <option key={g} value={String(g)} style={optStyle}>{g}gr</option>
        ))}
      </select>

      <input
        type="date"
        value={dateFrom}
        onChange={(e) => push("dateFrom", e.target.value)}
        title="Dari tanggal beli"
        style={{ ...selStyle, width: 148 }}
      />
      <input
        type="date"
        value={dateTo}
        onChange={(e) => push("dateTo", e.target.value)}
        title="Sampai tanggal beli"
        style={{ ...selStyle, width: 148 }}
      />

      {hasFilter && (
        <button
          onClick={() => startTransition(() => router.replace("/admin/purchases"))}
          style={{
            background: "rgba(239,83,80,.1)", border: "1px solid rgba(239,83,80,.25)",
            borderRadius: 8, padding: "7px 12px", color: "#EF5350",
            fontSize: 12, cursor: "pointer",
          }}
        >
          Reset
        </button>
      )}

      {isPending && <span style={{ fontSize: 12, color: "#5A5045" }}>Memuat…</span>}
    </div>
  );
}
