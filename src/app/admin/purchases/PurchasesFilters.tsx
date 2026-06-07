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
const selStyle: React.CSSProperties = { ...inputStyle, color: "#9A8E7E", cursor: "pointer" };
const optStyle: React.CSSProperties = { background: "#1A1612", color: "#EDE8DE" };

export default function PurchasesFilters({ gramOptions }: Props) {
  const sp     = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tab      = sp.get("tab")      ?? "beli";
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

  function switchTab(t: string) {
    const params = new URLSearchParams();
    if (t !== "beli") params.set("tab", t);
    startTransition(() => router.replace(`/admin/purchases?${params.toString()}`));
  }

  function onSearch(val: string) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => push("q", val), 400);
  }

  const tabBtn = (t: string, label: string) => (
    <button
      key={t}
      onClick={() => switchTab(t)}
      style={{
        padding: "6px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer",
        border: tab === t ? "1px solid rgba(201,168,76,.4)" : "1px solid rgba(255,255,255,.08)",
        background: tab === t ? "rgba(201,168,76,.12)" : "transparent",
        color: tab === t ? "var(--gold)" : "#5A5045",
        fontFamily: "var(--font-dm-sans), sans-serif",
        transition: "all .15s",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {tabBtn("beli", "Beli Stok")}
        {tabBtn("konsinyasi", "Konsinyasi")}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <input
          type="text"
          key={tab}
          defaultValue={q}
          placeholder={tab === "konsinyasi" ? "Cari supplier, nomor seri…" : "Cari bukti beli, supplier, nomor seri…"}
          onChange={(e) => onSearch(e.target.value)}
          style={{ ...inputStyle, width: 260 }}
        />

        <select value={gramasi} onChange={(e) => push("gramasi", e.target.value)} style={selStyle}>
          <option value="" style={optStyle}>Semua Berat</option>
          {gramOptions.map((g) => (
            <option key={g} value={String(g)} style={optStyle}>{g}gr</option>
          ))}
        </select>

        <input type="date" value={dateFrom} onChange={(e) => push("dateFrom", e.target.value)}
          title="Dari tanggal" style={{ ...selStyle, width: 148 }} />
        <input type="date" value={dateTo} onChange={(e) => push("dateTo", e.target.value)}
          title="Sampai tanggal" style={{ ...selStyle, width: 148 }} />

        {hasFilter && (
          <button
            onClick={() => startTransition(() => router.replace(`/admin/purchases${tab !== "beli" ? `?tab=${tab}` : ""}`))}
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
    </div>
  );
}
