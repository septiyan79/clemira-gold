"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = "daily" | "monthly" | "yearly";

interface DailyRow { gramasi: string; harga: number; isBB: boolean; gram: number }
interface DailyData { rows: DailyRow[]; prevRows: DailyRow[]; date: string; prevDate: string | null }

interface DayEntry   { date: string;  sell: number | null; bb: number | null }
interface MonthEntry { month: number; sell: number | null; bb: number | null }

interface MonthlyData { days: DayEntry[];   prevLastSell: number | null; prevLastBb: number | null }
interface YearlyData  { months: MonthEntry[]; prevLastSell: number | null; prevLastBb: number | null }

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function todayWIB() {
  return new Date().toLocaleDateString("sv", { timeZone: "Asia/Jakarta" }); // YYYY-MM-DD
}

function fmt(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function formatDateShort(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function formatDateFull(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DiffCell({ diff }: { diff: number | null }) {
  if (diff === null) return <span style={{ color: "#3A342A" }}>—</span>;
  if (diff === 0)    return <span style={{ color: "#5A5045" }}>Rp 0</span>;
  const up = diff > 0;
  return (
    <span style={{ color: up ? "#4CAF50" : "#EF5350", fontSize: 13 }}>
      {up ? "▲" : "▼"} {up ? "+" : "-"}Rp {Math.abs(diff).toLocaleString("id-ID")}
    </span>
  );
}

function ChangeCard({ label, diff, pct }: { label: string; diff: number | null; pct: number | null }) {
  if (diff === null) return null;
  const up = diff >= 0;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      padding: "16px 20px", borderRadius: 10, marginBottom: 24,
      background: up ? "rgba(76,175,80,.08)" : "rgba(239,83,80,.08)",
      border: `1px solid ${up ? "rgba(76,175,80,.25)" : "rgba(239,83,80,.25)"}`,
    }}>
      <div>
        <p style={{ fontSize: 11, letterSpacing: 1.5, color: "#5A5045", textTransform: "uppercase", marginBottom: 4 }}>{label}</p>
        <p className="fd" style={{ fontSize: "1.5rem", fontWeight: 600, color: up ? "#4CAF50" : "#EF5350" }}>
          {up ? "▲" : "▼"} {up ? "+" : "-"}Rp {Math.abs(diff).toLocaleString("id-ID")}
        </p>
      </div>
      {pct !== null && (
        <span style={{ fontSize: 13, color: up ? "#4CAF50" : "#EF5350", padding: "4px 12px", borderRadius: 20, border: `1px solid ${up ? "rgba(76,175,80,.3)" : "rgba(239,83,80,.3)"}` }}>
          {up ? "+" : ""}{pct.toFixed(2)}%
        </span>
      )}
    </div>
  );
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        {children}
      </table>
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th style={{ padding: "10px 14px", fontSize: 10, letterSpacing: 1.5, color: "#5A5045", textTransform: "uppercase", textAlign: right ? "right" : "left", borderBottom: "1px solid rgba(201,168,76,.2)", fontWeight: 500, whiteSpace: "nowrap" }}>
      {children}
    </th>
  );
}

function Td({ children, right, gold }: { children: React.ReactNode; right?: boolean; gold?: boolean }) {
  return (
    <td style={{ padding: "12px 14px", textAlign: right ? "right" : "left", borderBottom: "1px solid rgba(255,255,255,.04)", color: gold ? "var(--gold)" : "#9A8E7E" }}>
      {children}
    </td>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div style={{ padding: "40px 20px", textAlign: "center", color: "#4A3E2E", fontSize: 14 }}>{msg}</div>
  );
}

function Spinner() {
  return (
    <div style={{ padding: "40px 20px", textAlign: "center", color: "#5A5045", fontSize: 14 }}>Memuat data…</div>
  );
}

// ─── Tab: Harian ─────────────────────────────────────────────────────────────

function DailyTab() {
  const [date, setDate]     = useState(todayWIB);
  const [data, setData]     = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/price/daily?date=${d}`);
      setData(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(date); }, [date, fetchData]);

  // Group rows by gram value, pair sell + BB
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

  const entries = [...gramMap.entries()].sort(([a], [b]) => a - b);

  // Summary change for 1g sell
  const sell1g     = gramMap.get(1)?.sell?.harga ?? null;
  const prevSell1g = prevMap.get(1)?.sell?.harga ?? null;
  const diff1g     = sell1g !== null && prevSell1g !== null ? sell1g - prevSell1g : null;
  const pct1g      = diff1g !== null && prevSell1g ? (diff1g / prevSell1g) * 100 : null;

  return (
    <>
      {/* Filter */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <label style={{ fontSize: 11, color: "#5A5045", display: "block", marginBottom: 6, letterSpacing: 1 }}>PILIH TANGGAL</label>
          <input type="date" className="ci" value={date} onChange={e => setDate(e.target.value)}
            style={{ width: 200 }} />
        </div>
      </div>

      {/* Tanggal label */}
      {data?.date && (
        <p style={{ fontSize: 13, color: "#7A6E5F", marginBottom: 16 }}>
          Menampilkan data: <span style={{ color: "var(--gold)" }}>{formatDateFull(data.date)}</span>
          {data.prevDate && <span style={{ color: "#4A3E2E" }}> · dibanding {formatDateShort(data.prevDate)}</span>}
        </p>
      )}

      {/* Change card */}
      <ChangeCard label="Perubahan Harga Jual 1g vs Hari Sebelumnya" diff={diff1g} pct={pct1g} />

      {/* Table */}
      {loading ? <Spinner /> : entries.length === 0 ? (
        <EmptyState msg="Tidak ada data untuk tanggal ini." />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Gramasi</Th>
              <Th right>Harga Jual</Th>
              <Th right>Buyback</Th>
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
                  <Td right>{e.bb   ? fmt(e.bb.harga)   : "—"}</Td>
                  <Td right><DiffCell diff={sellDiff} /></Td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      )}
    </>
  );
}

// ─── Tab: Bulanan ─────────────────────────────────────────────────────────────

function MonthlyTab() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
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

  // Monthly change: last row vs prevLastSell
  const days     = data?.days ?? [];
  const lastSell = days.findLast(d => d.sell !== null)?.sell ?? null;
  const lastBb   = days.findLast(d => d.bb   !== null)?.bb   ?? null;
  const diffSell = lastSell !== null && data?.prevLastSell != null ? lastSell - data.prevLastSell : null;
  const pctSell  = diffSell !== null && data?.prevLastSell ? (diffSell / data.prevLastSell) * 100 : null;

  // Rolling prev for each row
  const prevSells: (number | null)[] = [data?.prevLastSell ?? null, ...days.slice(0, -1).map(d => d.sell)];
  const prevBbs:   (number | null)[] = [data?.prevLastBb   ?? null, ...days.slice(0, -1).map(d => d.bb)];

  return (
    <>
      {/* Filter */}
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
    </>
  );
}

// ─── Tab: Tahunan ─────────────────────────────────────────────────────────────

function YearlyTab() {
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

  // Rolling prev for each month
  const prevSells: (number | null)[] = [data?.prevLastSell ?? null, ...months.slice(0, -1).map(m => m.sell)];
  const prevBbs:   (number | null)[] = [data?.prevLastBb   ?? null, ...months.slice(0, -1).map(m => m.bb)];

  return (
    <>
      {/* Filter */}
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
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string }[] = [
  { key: "daily",   label: "Harian"  },
  { key: "monthly", label: "Bulanan" },
  { key: "yearly",  label: "Tahunan" },
];

export default function PricePage() {
  const [tab, setTab] = useState<Tab>("daily");

  return (
    <>
      {/* Page header */}
      <section style={{ padding: "48px 20px 0", background: "radial-gradient(ellipse 70% 40% at 50% 0%,rgba(201,168,76,.1) 0%,transparent 70%),var(--dark)" }}>
        <div className="wrap">
          <p className="section-label" style={{ marginBottom: 10 }}>Data Historis</p>
          <h1 className="fd" style={{ fontSize: "clamp(1.8rem,3vw,2.8rem)", fontWeight: 300, color: "#EDE8DE", marginBottom: 8 }}>
            Harga Emas <em style={{ color: "var(--gold)" }}>Antam</em>
          </h1>
          <p style={{ fontSize: 14, color: "#5A5045", marginBottom: 32 }}>
            Data harga jual dan buyback Antam · Update harian
          </p>

          {/* Tab bar */}
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

      {/* Tab content */}
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

      <style>{`
        .ci { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; padding: 10px 14px; color: #EDE8DE; font-size: 14px; outline: none; }
        .ci:focus { border-color: rgba(201,168,76,.5); }
        .ci option { background: #1E1A14; color: #EDE8DE; }
        tbody tr:hover { background: rgba(201,168,76,.03); }
      `}</style>
    </>
  );
}
