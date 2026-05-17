"use client";

const tickerItems = [
  { label: "Des 2024 → Jan 2025", gramasi: "1g", pct: "+3.2%", up: true },
  { label: "Jan → Feb 2025", gramasi: "1g", pct: "+1.8%", up: true },
  { label: "Feb → Mar 2025", gramasi: "1g", pct: "+4.5%", up: true },
  { label: "Mar → Apr 2025", gramasi: "1g", pct: "-0.9%", up: false },
  { label: "Apr → Mei 2025", gramasi: "1g", pct: "+5.7%", up: true },
  { label: "Mei → Jun 2025", gramasi: "1g", pct: "+2.1%", up: true },
  { label: "Jun → Jul 2025", gramasi: "1g", pct: "-1.3%", up: false },
  { label: "Jul → Ags 2025", gramasi: "1g", pct: "+6.2%", up: true },
  { label: "Ags → Sep 2025", gramasi: "1g", pct: "+3.8%", up: true },
  { label: "Sep → Okt 2025", gramasi: "1g", pct: "+1.4%", up: true },
  { label: "Okt → Nov 2025", gramasi: "1g", pct: "-0.5%", up: false },
  { label: "Nov → Des 2025", gramasi: "1g", pct: "+4.9%", up: true },
];

const TickerContent = () => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 14, padding: "0 20px", fontSize: 12, color: "#A09080", letterSpacing: ".3px", whiteSpace: "nowrap" }}>
    <span style={{ color: "var(--gold)" }}>●</span>
    {tickerItems.map((item, i) => (
      <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: "#7A6E5F" }}>{item.label}</span>
        <strong style={{ color: "#EDE8DE" }}>ANTAM {item.gramasi}</strong>
        <span style={{ color: item.up ? "#4CAF50" : "#F44336" }}>
          {item.up ? "▲" : "▼"}{item.pct}
        </span>
        {i < tickerItems.length - 1 && <span style={{ color: "#3A342A", margin: "0 4px" }}>|</span>}
      </span>
    ))}
    &nbsp;&nbsp;&nbsp;
  </span>
);

export default function Ticker() {
  return (
    <div style={{ overflow: "hidden", background: "rgba(201,168,76,.08)", borderTop: "1px solid rgba(201,168,76,.2)", borderBottom: "1px solid rgba(201,168,76,.2)", marginTop: 60 }}>
      <div style={{ display: "flex", whiteSpace: "nowrap", animation: "ticker 40s linear infinite", width: "max-content", padding: "8px 0" }}>
        <TickerContent />
        <TickerContent />
      </div>
      <style>{`@keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }`}</style>
    </div>
  );
}
