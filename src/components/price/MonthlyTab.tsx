"use client";

import { useState, useEffect, useCallback } from "react";
import { MONTHS_ID, fmt, formatDateShort, DiffCell, ChangeCard, TableWrap, Th, Td, EmptyState, Spinner } from "./shared";
import type { MonthlyData } from "./shared";

export default function MonthlyTab() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data,  setData]  = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (y: number, m: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/price/monthly?year=${y}&month=${m}`);
      setData(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(year, month); }, [year, month, fetchData]);

  const days     = data?.days ?? [];
  const lastSell = days.findLast(d => d.sell !== null)?.sell ?? null;
  const lastBb   = days.findLast(d => d.bb   !== null)?.bb   ?? null;
  const diffSell = lastSell !== null && data?.prevLastSell != null ? lastSell - data.prevLastSell : null;
  const pctSell  = diffSell !== null && data?.prevLastSell ? (diffSell / data.prevLastSell) * 100 : null;

  const prevSells: (number | null)[] = [data?.prevLastSell ?? null, ...days.slice(0, -1).map(d => d.sell)];
  const prevBbs:   (number | null)[] = [data?.prevLastBb   ?? null, ...days.slice(0, -1).map(d => d.bb)];

  return (
    <>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <label style={{ fontSize: 11, color: "#5A5045", display: "block", marginBottom: 6, letterSpacing: 1 }}>BULAN</label>
          <select className="ci" value={month} onChange={e => setMonth(+e.target.value)} style={{ width: 160 }}>
            {MONTHS_ID.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: "#5A5045", display: "block", marginBottom: 6, letterSpacing: 1 }}>TAHUN</label>
          <input type="number" className="ci" value={year} min={2024} max={2100}
            onChange={e => setYear(+e.target.value)} style={{ width: 110 }} />
        </div>
      </div>

      <ChangeCard label={`Perubahan Harga Jual 1g — ${MONTHS_ID[month-1]} ${year} vs bulan sebelumnya`} diff={diffSell} pct={pctSell} />

      {loading ? <Spinner /> : days.length === 0 ? (
        <EmptyState msg={`Tidak ada data untuk ${MONTHS_ID[month-1]} ${year}.`} />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Tanggal</Th>
              <Th right>Harga Jual 1g</Th>
              <Th right>Perubahan</Th>
              <Th right>Buyback 1g</Th>
              <Th right>Perubahan</Th>
            </tr>
          </thead>
          <tbody>
            {days.map((d, i) => (
              <tr key={d.date}>
                <Td gold>{formatDateShort(d.date)}</Td>
                <Td right>{d.sell ? fmt(d.sell) : "—"}</Td>
                <Td right><DiffCell diff={d.sell !== null && prevSells[i] !== null ? d.sell - prevSells[i]! : null} /></Td>
                <Td right>{d.bb ? fmt(d.bb) : "—"}</Td>
                <Td right><DiffCell diff={d.bb !== null && prevBbs[i] !== null ? d.bb - prevBbs[i]! : null} /></Td>
              </tr>
            ))}
          </tbody>
          {(lastSell || lastBb) && (
            <tfoot>
              <tr style={{ borderTop: "1px solid rgba(201,168,76,.2)" }}>
                <td style={{ padding: "12px 14px", fontSize: 11, color: "#5A5045" }}>Terakhir</td>
                <td style={{ padding: "12px 14px", textAlign: "right", color: "var(--gold)", fontWeight: 600 }}>{lastSell ? fmt(lastSell) : "—"}</td>
                <td />
                <td style={{ padding: "12px 14px", textAlign: "right", color: "var(--gold)", fontWeight: 600 }}>{lastBb ? fmt(lastBb) : "—"}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </TableWrap>
      )}

      <style>{`.ci{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:10px 14px;color:#EDE8DE;font-size:14px;outline:none}.ci:focus{border-color:rgba(201,168,76,.5)}.ci option{background:#1E1A14;color:#EDE8DE}tbody tr:hover{background:rgba(201,168,76,.03)}`}</style>
    </>
  );
}
