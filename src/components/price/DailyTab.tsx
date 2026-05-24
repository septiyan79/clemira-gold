"use client";

import { useState, useEffect, useCallback } from "react";
import { todayWIB, fmt, formatDateShort, formatDateFull, DiffCell, TableWrap, Th, Td, EmptyState, Spinner } from "./shared";
import type { DailyData, DailyRow } from "./shared";
import SharePriceButton from "./SharePriceButton";

export default function DailyTab() {
  const [date, setDate]       = useState(todayWIB);
  const [data, setData]       = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/price/daily?date=${d}`);
      setData(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(date); }, [date, fetchData]);

  const gramMap = new Map<number, { sell?: DailyRow; bb?: DailyRow }>();
  for (const r of data?.rows ?? []) {
    if (!gramMap.has(r.gram)) gramMap.set(r.gram, {});
    const e = gramMap.get(r.gram)!;
    if (r.isBB) e.bb = r; else e.sell = r;
  }
  const prevMap = new Map<number, { sell?: DailyRow; bb?: DailyRow }>();
  for (const r of data?.prevRows ?? []) {
    if (!prevMap.has(r.gram)) prevMap.set(r.gram, {});
    const e = prevMap.get(r.gram)!;
    if (r.isBB) e.bb = r; else e.sell = r;
  }

  const entries    = [...gramMap.entries()].sort(([a], [b]) => a - b);
  const sell1g     = gramMap.get(1)?.sell?.harga ?? null;
  const prevSell1g = prevMap.get(1)?.sell?.harga ?? null;
  const diff1g     = sell1g !== null && prevSell1g !== null ? sell1g - prevSell1g : null;
  const pct1g      = diff1g !== null && prevSell1g ? (diff1g / prevSell1g) * 100 : null;

  const bb1g       = gramMap.get(1)?.bb?.harga ?? null;
  const prevBb1g   = prevMap.get(1)?.bb?.harga ?? null;
  const diffBb1g   = bb1g !== null && prevBb1g !== null ? bb1g - prevBb1g : null;
  const pctBb1g    = diffBb1g !== null && prevBb1g ? (diffBb1g / prevBb1g) * 100 : null;

  const upSell = diff1g === null || diff1g >= 0;
  const upBb   = diffBb1g === null || diffBb1g >= 0;

  return (
    <>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <label style={{ fontSize: 11, color: "#5A5045", display: "block", marginBottom: 6, letterSpacing: 1 }}>PILIH TANGGAL</label>
          <input type="date" className="ci" value={date} onChange={e => setDate(e.target.value)} style={{ width: 200 }} />
        </div>
      </div>

      {data?.date && (
        <p style={{ fontSize: 13, color: "#7A6E5F", marginBottom: 16 }}>
          Menampilkan data: <span style={{ color: "var(--gold)" }}>{formatDateFull(data.date)}</span>
          {data.prevDate && <span style={{ color: "#4A3E2E" }}> · dibanding {formatDateShort(data.prevDate)}</span>}
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: 24 }}>
        {sell1g !== null && (
          <div style={{
            padding: "16px 20px", borderRadius: 10,
            background: diff1g !== null ? (upSell ? "rgba(76,175,80,.08)" : "rgba(239,83,80,.08)") : "rgba(255,255,255,.03)",
            border: `1px solid ${diff1g !== null ? (upSell ? "rgba(76,175,80,.25)" : "rgba(239,83,80,.25)") : "rgba(255,255,255,.08)"}`,
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          }}>
            <div>
              <p style={{ fontSize: 11, letterSpacing: 1.5, color: "#5A5045", textTransform: "uppercase", marginBottom: 4 }}>Harga Jual 1g</p>
              <p className="fd" style={{ fontSize: "1.5rem", fontWeight: 600, color: "#EDE8DE", marginBottom: diff1g !== null ? 6 : 0 }}>
                {fmt(sell1g)}
              </p>
              {diff1g !== null && <DiffCell diff={diff1g} />}
            </div>
            {pct1g !== null && (
              <span style={{ fontSize: 13, color: upSell ? "#4CAF50" : "#EF5350", padding: "4px 12px", borderRadius: 20, border: `1px solid ${upSell ? "rgba(76,175,80,.3)" : "rgba(239,83,80,.3)"}`, whiteSpace: "nowrap" }}>
                {upSell ? "+" : ""}{pct1g.toFixed(2)}%
              </span>
            )}
          </div>
        )}
        {bb1g !== null && (
          <div style={{
            padding: "16px 20px", borderRadius: 10,
            background: "rgba(201,168,76,.06)", border: "1px solid rgba(201,168,76,.2)",
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          }}>
            <div>
              <p style={{ fontSize: 11, letterSpacing: 1.5, color: "#5A5045", textTransform: "uppercase", marginBottom: 4 }}>Harga Buyback 1g</p>
              <p className="fd" style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--gold)", marginBottom: diffBb1g !== null ? 6 : 0 }}>
                {fmt(bb1g)}
              </p>
              {diffBb1g !== null && <DiffCell diff={diffBb1g} />}
            </div>
            {pctBb1g !== null && (
              <span style={{ fontSize: 13, color: upBb ? "#4CAF50" : "#EF5350", padding: "4px 12px", borderRadius: 20, border: `1px solid ${upBb ? "rgba(76,175,80,.3)" : "rgba(239,83,80,.3)"}`, whiteSpace: "nowrap" }}>
                {upBb ? "+" : ""}{pctBb1g.toFixed(2)}%
              </span>
            )}
          </div>
        )}
      </div>

      {data?.date && (sell1g !== null || bb1g !== null) && (
        <SharePriceButton
          date={data.date}
          sell1g={sell1g}
          bb1g={bb1g}
        />
      )}

      {loading ? <Spinner /> : entries.length === 0 ? (
        <EmptyState msg="Tidak ada data untuk tanggal ini." />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Gramasi</Th>
              <Th right>Harga Jual</Th>
              <Th right>Perubahan Jual</Th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([gram, e]) => {
              const prev     = prevMap.get(gram);
              const sellDiff = e.sell && prev?.sell ? e.sell.harga - prev.sell.harga : null;
              return (
                <tr key={gram}>
                  <Td gold>{gram} gr</Td>
                  <Td right>{e.sell ? fmt(e.sell.harga) : "—"}</Td>
                  <Td right><DiffCell diff={sellDiff} /></Td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      )}

      <style>{`.ci{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:10px 14px;color:#EDE8DE;font-size:14px;outline:none}.ci:focus{border-color:rgba(201,168,76,.5)}.ci option{background:#1E1A14;color:#EDE8DE}tbody tr:hover{background:rgba(201,168,76,.03)}`}</style>
    </>
  );
}
