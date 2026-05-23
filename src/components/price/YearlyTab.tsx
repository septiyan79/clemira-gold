"use client";

import { useState, useEffect, useCallback } from "react";
import { MONTHS_ID, fmt, DiffCell, ChangeCard, TableWrap, Th, Td, EmptyState, Spinner } from "./shared";
import type { YearlyData } from "./shared";

export default function YearlyTab() {
  const [year,  setYear]  = useState(new Date().getFullYear());
  const [data,  setData]  = useState<YearlyData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (y: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/price/yearly?year=${y}`);
      setData(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(year); }, [year, fetchData]);

  const months   = data?.months ?? [];
  const hasData  = months.some(m => m.sell !== null);
  const lastSell = months.findLast(m => m.sell !== null)?.sell ?? null;
  const diffSell = lastSell !== null && data?.prevLastSell != null ? lastSell - data.prevLastSell : null;
  const pctSell  = diffSell !== null && data?.prevLastSell ? (diffSell / data.prevLastSell) * 100 : null;

  const prevSells: (number | null)[] = [data?.prevLastSell ?? null, ...months.slice(0, -1).map(m => m.sell)];
  const prevBbs:   (number | null)[] = [data?.prevLastBb   ?? null, ...months.slice(0, -1).map(m => m.bb)];

  return (
    <>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <label style={{ fontSize: 11, color: "#5A5045", display: "block", marginBottom: 6, letterSpacing: 1 }}>TAHUN</label>
          <input type="number" className="ci" value={year} min={2024} max={2100}
            onChange={e => setYear(+e.target.value)} style={{ width: 110 }} />
        </div>
      </div>

      <ChangeCard label={`Perubahan Harga Jual 1g — ${year} vs tahun sebelumnya`} diff={diffSell} pct={pctSell} />

      {loading ? <Spinner /> : !hasData ? (
        <EmptyState msg={`Tidak ada data untuk tahun ${year}.`} />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Bulan</Th>
              <Th right>Harga Jual 1g</Th>
              <Th right>Perubahan</Th>
              <Th right>Buyback 1g</Th>
              <Th right>Perubahan</Th>
            </tr>
          </thead>
          <tbody>
            {months.map((m, i) => (
              <tr key={m.month} style={{ opacity: m.sell === null && m.bb === null ? 0.35 : 1 }}>
                <Td gold>{MONTHS_ID[m.month]}</Td>
                <Td right>{m.sell ? fmt(m.sell) : "—"}</Td>
                <Td right><DiffCell diff={m.sell !== null && prevSells[i] !== null ? m.sell - prevSells[i]! : null} /></Td>
                <Td right>{m.bb ? fmt(m.bb) : "—"}</Td>
                <Td right><DiffCell diff={m.bb !== null && prevBbs[i] !== null ? m.bb - prevBbs[i]! : null} /></Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <style>{`.ci{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:10px 14px;color:#EDE8DE;font-size:14px;outline:none}.ci:focus{border-color:rgba(201,168,76,.5)}.ci option{background:#1E1A14;color:#EDE8DE}tbody tr:hover{background:rgba(201,168,76,.03)}`}</style>
    </>
  );
}
