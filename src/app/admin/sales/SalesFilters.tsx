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

export default function SalesFilters({ gramOptions }: Props) {
  const sp     = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const q        = sp.get("q")        ?? "";
  const status   = sp.get("status")   ?? "";
  const mode     = sp.get("mode")     ?? "";
  const gramasi  = sp.get("gramasi")  ?? "";
  const dateFrom = sp.get("dateFrom") ?? "";
  const dateTo   = sp.get("dateTo")   ?? "";

  const hasFilter = !!(q || status || mode || gramasi || dateFrom || dateTo);

  function push(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    startTransition(() => router.replace(`/admin/sales?${params.toString()}`));
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
        placeholder="Cari invoice, kwitansi, pembeli…"
        onChange={(e) => onSearch(e.target.value)}
        style={{ ...inputStyle, width: 240 }}
      />

      <select value={status} onChange={(e) => push("status", e.target.value)} style={selStyle}>
        <option value="">Semua Status</option>
        <option value="pending">Pending</option>
        <option value="paid">Lunas</option>
      </select>

      <select value={mode} onChange={(e) => push("mode", e.target.value)} style={selStyle}>
        <option value="">Semua Mode</option>
        <option value="own_stock">Stok</option>
        <option value="consignment">Konsinyasi</option>
        <option value="swap">Swap</option>
      </select>

      <select value={gramasi} onChange={(e) => push("gramasi", e.target.value)} style={selStyle}>
        <option value="">Semua Berat</option>
        {gramOptions.map((g) => (
          <option key={g} value={String(g)}>{g}gr</option>
        ))}
      </select>

      <input
        type="date"
        value={dateFrom}
        onChange={(e) => push("dateFrom", e.target.value)}
        title="Dari tanggal"
        style={{ ...selStyle, width: 148 }}
      />
      <input
        type="date"
        value={dateTo}
        onChange={(e) => push("dateTo", e.target.value)}
        title="Sampai tanggal"
        style={{ ...selStyle, width: 148 }}
      />

      {hasFilter && (
        <button
          onClick={() => startTransition(() => router.replace("/admin/sales"))}
          style={{
            background: "rgba(239,83,80,.1)", border: "1px solid rgba(239,83,80,.25)",
            borderRadius: 8, padding: "7px 12px", color: "#EF5350",
            fontSize: 12, cursor: "pointer",
          }}
        >
          Reset
        </button>
      )}

      {isPending && (
        <span style={{ fontSize: 12, color: "#5A5045" }}>Memuat…</span>
      )}
    </div>
  );
}
