"use client";

import { useEffect, useState } from "react";
import {
  TableWrap, Th, Td, EmptyState, Spinner, fmt,
} from "@/components/price/shared";

interface StockGroup {
  owner: string;
  brand: string | null;
  weightGram: number;
  series: string | null;
  mintYear: number | null;
  unitCount: number;
  totalCogs: number;
}

export default function StockDashboardPage() {
  const [groups, setGroups] = useState<StockGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerFilter, setOwnerFilter] = useState("all");

  useEffect(() => {
    fetch("/api/stock/summary")
      .then((r) => r.json())
      .then((d) => { setGroups(d); setLoading(false); });
  }, []);

  const owners = [...new Set(groups.map((g) => g.owner))].sort();

  const filtered =
    ownerFilter === "all" ? groups : groups.filter((g) => g.owner === ownerFilter);

  const totalUnits = filtered.reduce((s, g) => s + g.unitCount, 0);
  const totalCogs  = filtered.reduce((s, g) => s + g.totalCogs, 0);
  const totalSkus  = new Set(filtered.map((g) => `${g.brand ?? ""}|${g.weightGram}`)).size;

  const sorted = [...filtered].sort(
    (a, b) =>
      a.owner.localeCompare(b.owner) ||
      (a.brand ?? "").localeCompare(b.brand ?? "") ||
      a.weightGram - b.weightGram ||
      (a.mintYear ?? 0) - (b.mintYear ?? 0),
  );

  return (
    <div>
      <p className="section-label" style={{ marginBottom: 8 }}>Stok</p>
      <h1
        className="fd"
        style={{ fontSize: "2rem", fontWeight: 300, color: "var(--text)", marginBottom: 28 }}
      >
        Dashboard Stok
      </h1>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Unit Tersedia",   value: loading ? "—" : totalUnits.toLocaleString("id-ID") },
          { label: "Total Nilai COGS", value: loading ? "—" : fmt(totalCogs) },
          { label: "Jenis Produk",    value: loading ? "—" : String(totalSkus) },
        ].map((c) => (
          <div key={c.label} className="price-card" style={{ borderRadius: 12, padding: 24 }}>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>{c.label}</p>
            <p className="fd" style={{ fontSize: "1.75rem", color: "var(--gold)" }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 16, flexWrap: "wrap", gap: 10,
        }}
      >
        <select
          className="ci"
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          style={{ minWidth: 160, height: 36, fontSize: 13 }}
        >
          <option value="all">Semua Pemilik</option>
          {owners.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>

        {!loading && (
          <p style={{ fontSize: 12, color: "var(--muted)" }}>
            {totalUnits} unit · {filtered.length} kelompok
          </p>
        )}
      </div>

      {/* Table */}
      <div className="price-card" style={{ borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <Spinner />
        ) : sorted.length === 0 ? (
          <EmptyState msg="Tidak ada stok tersedia" />
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Pemilik</Th>
                  <Th>Brand</Th>
                  <Th>Berat</Th>
                  <Th>Series</Th>
                  <Th>Thn Cetak</Th>
                  <Th right>Unit</Th>
                  <Th right>Total COGS</Th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, i) => (
                  <tr
                    key={i}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLTableRowElement).style.background =
                        "rgba(201,168,76,.04)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLTableRowElement).style.background = "")
                    }
                  >
                    <Td>{row.owner}</Td>
                    <Td gold>{row.brand ?? "—"}</Td>
                    <Td>{row.weightGram} gr</Td>
                    <Td>{row.series ?? "—"}</Td>
                    <Td>{row.mintYear ?? "—"}</Td>
                    <Td right>{row.unitCount}</Td>
                    <Td right>{fmt(row.totalCogs)}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>

            {/* Footer totals */}
            <div
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 14px",
                borderTop: "1px solid rgba(201,168,76,.15)",
                fontSize: 13,
              }}
            >
              <span style={{ color: "var(--muted)" }}>Total</span>
              <div style={{ display: "flex", gap: 40 }}>
                <span style={{ color: "var(--text)", fontWeight: 500 }}>
                  {totalUnits} unit
                </span>
                <span style={{ color: "var(--gold)", fontWeight: 500 }}>
                  {fmt(totalCogs)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .stock-kpi { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
