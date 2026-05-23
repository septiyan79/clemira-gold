"use client";

import { useState } from "react";
import Link from "next/link";
import DailyTab from "@/components/price/DailyTab";
import MonthlyTab from "@/components/price/MonthlyTab";
import YearlyTab from "@/components/price/YearlyTab";
import type { Tab } from "@/components/price/shared";

const TABS: { key: Tab; label: string }[] = [
  { key: "daily",   label: "Harian"  },
  { key: "monthly", label: "Bulanan" },
  { key: "yearly",  label: "Tahunan" },
];

export default function PricePage() {
  const [tab, setTab] = useState<Tab>("daily");

  return (
    <>
      <section style={{ padding: "48px 20px 0", background: "radial-gradient(ellipse 70% 40% at 50% 0%,rgba(201,168,76,.1) 0%,transparent 70%),var(--dark)" }}>
        <div className="wrap">
          <p className="section-label" style={{ marginBottom: 10 }}>Data Historis</p>
          <h1 className="fd" style={{ fontSize: "clamp(1.8rem,3vw,2.8rem)", fontWeight: 300, color: "#EDE8DE", marginBottom: 8 }}>
            Harga Emas <em style={{ color: "var(--gold)" }}>Antam</em>
          </h1>
          <p style={{ fontSize: 14, color: "#5A5045", marginBottom: 32 }}>
            Data harga jual dan buyback Antam · Update harian
          </p>
          <div style={{ display: "flex", gap: 4, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: "10px 22px", fontSize: 14, cursor: "pointer",
                fontFamily: "var(--font-dm-sans), sans-serif",
                background: "transparent", border: "none",
                borderBottom: tab === t.key ? "2px solid var(--gold)" : "2px solid transparent",
                color: tab === t.key ? "var(--gold)" : "#5A5045",
                transition: "all .2s", marginBottom: -1,
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "32px 20px 64px" }}>
        <div className="wrap">
          <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, padding: "28px 24px" }}>
            {tab === "daily"   && <DailyTab />}
            {tab === "monthly" && <MonthlyTab />}
            {tab === "yearly"  && <YearlyTab />}
          </div>
          <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
            <Link href="/" style={{ fontSize: 13, color: "#5A5045", textDecoration: "none" }}>
              ← Kembali ke Beranda
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
