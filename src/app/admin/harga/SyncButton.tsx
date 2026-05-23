"use client";

import { useState, useTransition } from "react";

interface Props {
  action: () => Promise<{ synced: number; error?: string }>;
}

export default function SyncButton({ action }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ synced: number; error?: string } | null>(null);

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      const res = await action();
      setResult(res);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
      <button
        onClick={handleClick}
        disabled={isPending}
        style={{
          padding: "10px 20px",
          borderRadius: 8,
          border: "1px solid rgba(201,168,76,.5)",
          background: isPending ? "rgba(201,168,76,.05)" : "rgba(201,168,76,.15)",
          color: "var(--gold)",
          fontSize: 14,
          cursor: isPending ? "not-allowed" : "pointer",
          fontFamily: "var(--font-dm-sans), sans-serif",
          transition: "all .2s",
          whiteSpace: "nowrap",
        }}
      >
        {isPending ? "⟳ Syncing..." : "⟳ Sync Sekarang"}
      </button>

      {result && (
        <p style={{ fontSize: 13, color: result.error ? "#EF5350" : "#4CAF50", margin: 0 }}>
          {result.error
            ? `❌ Error: ${result.error}`
            : `✓ ${result.synced} harga berhasil disync`}
        </p>
      )}
    </div>
  );
}
