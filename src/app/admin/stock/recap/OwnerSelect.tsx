"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Props = {
  owners:   { id: string; name: string }[];
  selected: string;
};

export default function OwnerSelect({ owners, selected }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 13, color: "#5A5045" }}>Pemilik</span>
      <select
        value={selected}
        onChange={(e) => {
          const v = e.target.value;
          startTransition(() =>
            router.replace(v ? `/admin/stock/recap?owner=${v}` : "/admin/stock/recap")
          );
        }}
        style={{
          background: "rgba(255,255,255,.04)",
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 8,
          padding: "7px 14px",
          color: "#EDE8DE",
          fontSize: 13,
          outline: "none",
          cursor: "pointer",
          minWidth: 160,
        }}
      >
        <option value="" style={{ background: "#1A1612", color: "#EDE8DE" }}>Semua Pemilik</option>
        {owners.map((o) => (
          <option key={o.id} value={o.id} style={{ background: "#1A1612", color: "#EDE8DE" }}>{o.name}</option>
        ))}
      </select>
      {isPending && <span style={{ fontSize: 12, color: "#5A5045" }}>Memuat…</span>}
    </div>
  );
}
