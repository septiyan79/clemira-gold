"use client";

export const MONTHS_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

export type Tab = "daily" | "monthly" | "yearly";
export interface DailyRow   { gramasi: string; harga: number; isBB: boolean; gram: number }
export interface DailyData  { rows: DailyRow[]; prevRows: DailyRow[]; date: string; prevDate: string | null }
export interface DayEntry   { date: string; sell: number | null; bb: number | null }
export interface MonthEntry { month: number; sell: number | null; bb: number | null }
export interface MonthlyData { days: DayEntry[]; prevLastSell: number | null; prevLastBb: number | null }
export interface YearlyData  { months: MonthEntry[]; prevLastSell: number | null; prevLastBb: number | null }

export function todayWIB() {
  return new Date().toLocaleDateString("sv", { timeZone: "Asia/Jakarta" });
}

export function fmt(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export function formatDateShort(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
}

export function formatDateFull(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
}

export function DiffCell({ diff }: { diff: number | null }) {
  if (diff === null) return <span style={{ color: "#3A342A" }}>—</span>;
  if (diff === 0)    return <span style={{ color: "#5A5045" }}>Rp 0</span>;
  const up = diff > 0;
  return (
    <span style={{ color: up ? "#4CAF50" : "#EF5350", fontSize: 13 }}>
      {up ? "▲" : "▼"} {up ? "+" : "-"}Rp {Math.abs(diff).toLocaleString("id-ID")}
    </span>
  );
}

export function ChangeCard({ label, diff, pct }: { label: string; diff: number | null; pct: number | null }) {
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

export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        {children}
      </table>
    </div>
  );
}

export function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th style={{ padding: "10px 14px", fontSize: 10, letterSpacing: 1.5, color: "#5A5045", textTransform: "uppercase", textAlign: right ? "right" : "left", borderBottom: "1px solid rgba(201,168,76,.2)", fontWeight: 500, whiteSpace: "nowrap" }}>
      {children}
    </th>
  );
}

export function Td({ children, right, gold }: { children: React.ReactNode; right?: boolean; gold?: boolean }) {
  return (
    <td style={{ padding: "12px 14px", textAlign: right ? "right" : "left", borderBottom: "1px solid rgba(255,255,255,.04)", color: gold ? "var(--gold)" : "#9A8E7E" }}>
      {children}
    </td>
  );
}

export function EmptyState({ msg }: { msg: string }) {
  return <div style={{ padding: "40px 20px", textAlign: "center", color: "#4A3E2E", fontSize: 14 }}>{msg}</div>;
}

export function Spinner() {
  return <div style={{ padding: "40px 20px", textAlign: "center", color: "#5A5045", fontSize: 14 }}>Memuat data…</div>;
}
