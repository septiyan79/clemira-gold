"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SyncButton from "./SyncButton";
import DailyTab from "@/components/price/DailyTab";
import MonthlyTab from "@/components/price/MonthlyTab";
import YearlyTab from "@/components/price/YearlyTab";

interface Props {
  title: string;
  tabType: "daily" | "monthly" | "yearly";
  formattedDate: string | null;
  syncAction: () => Promise<{ synced: number; error?: string }>;
  fullSyncAction: () => Promise<{ synced: number; error?: string }>;
}

export default function PriceView({
  title,
  tabType,
  formattedDate,
  syncAction,
  fullSyncAction,
}: Props) {
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  function handleSyncSuccess() {
    setRefreshKey((k) => k + 1);
    router.refresh();
  }

  return (
    <div>
      <p className="section-label" style={{ marginBottom: 8 }}>Harga Antam</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
        <div>
          <h1 className="fd" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--text)", marginBottom: 6 }}>
            {title}
          </h1>
          {formattedDate && (
            <p style={{ fontSize: 13, color: "var(--muted)" }}>
              Data terakhir: {formattedDate}
            </p>
          )}
        </div>
        <SyncButton
          action={syncAction}
          fullSyncAction={fullSyncAction}
          onSyncSuccess={handleSyncSuccess}
        />
      </div>

      <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, padding: "28px 24px" }}>
        {tabType === "daily" && <DailyTab refreshKey={refreshKey} />}
        {tabType === "monthly" && <MonthlyTab refreshKey={refreshKey} />}
        {tabType === "yearly" && <YearlyTab refreshKey={refreshKey} />}
      </div>
    </div>
  );
}
