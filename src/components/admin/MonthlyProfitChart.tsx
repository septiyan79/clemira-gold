"use client";

export interface MonthData {
  month: number;
  revenue: number;
  cogs: number;
  margin: number;
  txCount: number;
}

interface Props {
  data: MonthData[];
}

const SVG_W           = 900;
const SVG_H           = 280;
const PADDING_LEFT    = 70;
const PADDING_RIGHT   = 20;
const PADDING_TOP     = 20;
const PADDING_BOTTOM  = 40;
const CHART_W         = SVG_W - PADDING_LEFT - PADDING_RIGHT;
const CHART_H         = SVG_H - PADDING_TOP - PADDING_BOTTOM;

const BAR_GROUP_W = CHART_W / 12;
const BAR_W       = BAR_GROUP_W * 0.55;
const BAR_GAP     = (BAR_GROUP_W - BAR_W) / 2;

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

function barX(i: number) {
  return PADDING_LEFT + i * BAR_GROUP_W + BAR_GAP;
}

function fmtAxisLabel(val: number): string {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}M`;
  if (val >= 1_000_000)     return `${(val / 1_000_000).toFixed(0)}jt`;
  if (val >= 1_000)         return `${(val / 1_000).toFixed(0)}rb`;
  return val.toString();
}

export default function MonthlyProfitChart({ data }: Props) {
  const maxRevenue = Math.max(...data.map(m => m.revenue), 1);
  const maxVal     = maxRevenue * 1.1;
  const scale      = CHART_H / maxVal;

  function bh(val: number) { return Math.max(0, val) * scale; }
  function by(val: number) { return PADDING_TOP + CHART_H - bh(val); }

  const gridValues = [0.25, 0.5, 0.75, 1.0].map(f => maxVal * f);

  return (
    <div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 14, height: 14, borderRadius: 2, background: "rgba(201,168,76,0.85)" }} />
          <span style={{ fontSize: 12, color: "#9A8E7E" }}>Laba (Margin)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 14, height: 14, borderRadius: 2, background: "rgba(90,80,69,0.85)" }} />
          <span style={{ fontSize: 12, color: "#9A8E7E" }}>COGS</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ width: "100%", height: "auto", minHeight: 180, overflow: "visible" }}
      >
        {/* Gridlines + Y-axis labels */}
        {gridValues.map((v, i) => {
          const y = by(v);
          return (
            <g key={i}>
              <line
                x1={PADDING_LEFT} y1={y}
                x2={SVG_W - PADDING_RIGHT} y2={y}
                stroke="rgba(255,255,255,.04)" strokeWidth={1}
              />
              <text
                x={PADDING_LEFT - 6} y={y + 4}
                textAnchor="end" fontSize={9} fill="#5A5045"
                fontFamily="var(--font-dm-sans), sans-serif"
              >
                {fmtAxisLabel(v)}
              </text>
            </g>
          );
        })}

        {/* Baseline */}
        <line
          x1={PADDING_LEFT} y1={PADDING_TOP + CHART_H}
          x2={SVG_W - PADDING_RIGHT} y2={PADDING_TOP + CHART_H}
          stroke="rgba(255,255,255,.08)" strokeWidth={1}
        />

        {/* Bars */}
        {data.map((m, i) => {
          const x      = barX(i);
          const empty  = m.txCount === 0;
          const cogsH  = bh(m.cogs);
          const margH  = bh(Math.max(0, m.margin));
          const totalH = cogsH + margH;

          return (
            <g key={m.month}>
              {empty ? (
                <rect
                  x={x} y={PADDING_TOP + CHART_H - 2}
                  width={BAR_W} height={2}
                  fill="rgba(58,52,42,0.6)" rx={1}
                />
              ) : (
                <>
                  {/* COGS — bottom portion */}
                  <rect
                    x={x}
                    y={PADDING_TOP + CHART_H - cogsH}
                    width={BAR_W}
                    height={cogsH}
                    fill="rgba(90,80,69,0.85)"
                    rx={2}
                  />
                  {/* Margin — top portion */}
                  <rect
                    x={x}
                    y={PADDING_TOP + CHART_H - totalH}
                    width={BAR_W}
                    height={margH}
                    fill="rgba(201,168,76,0.85)"
                    rx={2}
                  />
                </>
              )}

              {/* X-axis month label */}
              <text
                x={x + BAR_W / 2}
                y={PADDING_TOP + CHART_H + 18}
                textAnchor="middle" fontSize={10} fill="#5A5045"
                fontFamily="var(--font-dm-sans), sans-serif"
              >
                {MONTHS_SHORT[m.month - 1]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
