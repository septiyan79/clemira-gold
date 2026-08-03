"use client";

import { useState, useTransition } from "react";

interface Props {
  action: () => Promise<{ synced: number; error?: string }>;
  fullSyncAction?: () => Promise<{ synced: number; error?: string }>;
  onSyncSuccess?: () => void;
}

export default function SyncButton({ action, fullSyncAction, onSyncSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ synced: number; error?: string; isFull?: boolean } | null>(null);
  const [activeMode, setActiveMode] = useState<"normal" | "full" | null>(null);

  function handleClick() {
    setResult(null);
    setActiveMode("normal");
    startTransition(async () => {
      try {
        const res = await action();
        setResult({ ...res, isFull: false });
        if (!res.error && res.synced >= 0 && onSyncSuccess) {
          onSyncSuccess();
        }
      } finally {
        setActiveMode(null);
      }
    });
  }

  function handleFullSync() {
    if (!fullSyncAction) return;
    if (!confirm("Sync semua data dari Google Sheet?\nIni akan memproses seluruh riwayat data dan memakan waktu beberapa saat.")) return;
    setResult(null);
    setActiveMode("full");
    startTransition(async () => {
      try {
        const res = await fullSyncAction();
        setResult({ ...res, isFull: true });
        if (!res.error && res.synced >= 0 && onSyncSuccess) {
          onSyncSuccess();
        }
      } finally {
        setActiveMode(null);
      }
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
          background: isPending && activeMode === "normal" ? "rgba(201,168,76,.05)" : "rgba(201,168,76,.15)",
          color: "var(--gold)",
          fontSize: 14,
          cursor: isPending ? "not-allowed" : "pointer",
          fontFamily: "var(--font-dm-sans), sans-serif",
          transition: "all .2s",
          whiteSpace: "nowrap",
          opacity: isPending && activeMode === "full" ? 0.5 : 1,
        }}
      >
        {isPending && activeMode === "normal" ? "⟳ Syncing Harian..." : "⟳ Sync Sekarang"}
      </button>

      {fullSyncAction && (
        <button
          onClick={handleFullSync}
          disabled={isPending}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontSize: 12,
            color: isPending && activeMode === "full" ? "var(--gold)" : "#7A6E5F",
            cursor: isPending ? "not-allowed" : "pointer",
            fontFamily: "var(--font-dm-sans), sans-serif",
            textDecoration: "none",
            transition: "color .2s",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
          onMouseEnter={(e) => {
            if (!isPending) {
              e.currentTarget.style.color = "var(--gold)";
              e.currentTarget.style.textDecoration = "underline";
            }
          }}
          onMouseLeave={(e) => {
            if (!isPending) {
              e.currentTarget.style.color = "#7A6E5F";
              e.currentTarget.style.textDecoration = "none";
            }
          }}
        >
          {isPending && activeMode === "full" ? (
            <span style={{ color: "var(--gold)" }}>⟳ Memproses Full Sync...</span>
          ) : (
            "Sync semua data (Full) →"
          )}
        </button>
      )}

      {isPending && activeMode === "full" && (
        <div style={{
          fontSize: 12,
          color: "var(--gold)",
          background: "rgba(201,168,76,.1)",
          padding: "6px 12px",
          borderRadius: 6,
          border: "1px solid rgba(201,168,76,.2)",
          marginTop: 2,
        }}>
          ⏳ Meng-sync seluruh riwayat data dari Google Sheet...
        </div>
      )}

      {result && !isPending && (
        <div style={{
          fontSize: 13,
          color: result.error ? "#EF5350" : "#4CAF50",
          background: result.error ? "rgba(239,83,80,.1)" : "rgba(76,175,80,.1)",
          border: `1px solid ${result.error ? "rgba(239,83,80,.25)" : "rgba(76,175,80,.25)"}`,
          padding: "6px 12px",
          borderRadius: 6,
          margin: 0,
        }}>
          {result.error
            ? `❌ Error: ${result.error}`
            : result.isFull
            ? `✓ Full Sync Berhasil: ${result.synced.toLocaleString("id-ID")} total data diperbarui`
            : `✓ Sync Berhasil: ${result.synced} harga harian diperbarui`}
        </div>
      )}
    </div>
  );
}
