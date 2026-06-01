import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import OwnerSelect from "./OwnerSelect";

export const dynamic = "force-dynamic";

const isBB  = (g: string) => g.toUpperCase().includes("BB");
const normG = (g: string) => parseFloat(g.replace(/[^\d.]/g, "")) || 0;

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
function fmtGram(n: number) {
  return `${n % 1 === 0 ? n : n.toFixed(1)} gr`;
}

const thStyle: React.CSSProperties = {
  padding: "10px 14px", fontSize: 10, letterSpacing: 1.5, color: "#5A5045",
  textTransform: "uppercase", textAlign: "left", fontWeight: 500,
  borderBottom: "1px solid rgba(201,168,76,.2)", whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  padding: "10px 14px", color: "#9A8E7E", whiteSpace: "nowrap",
  borderBottom: "1px solid rgba(255,255,255,.04)",
};
const tdNum: React.CSSProperties = { ...tdStyle, textAlign: "right" };

type RecapRow = {
  ownerId:     string;
  ownerName:   string;
  brand:       string;
  series:      string;
  weightGram:  number;
  qty:         number;
  totalGram:   number;
  nilaiDasar:  number | null;
  nilaiBuyback: number | null;
};

export default async function StockRecapPage({
  searchParams,
}: {
  searchParams: Promise<{ owner?: string }>;
}) {
  const { owner: ownerFilter } = await searchParams;

  // Fetch Antam prices (same logic as units page)
  const latestHarga = await prisma.hargaAntam.findFirst({
    orderBy: { tanggal: "desc" },
    select: { tanggal: true },
  });

  const antamMap = new Map<number, { dasar: number | null; buyback: number | null }>();
  let bb1gr: number | null = null;

  if (latestHarga) {
    const prices = await prisma.hargaAntam.findMany({
      where: { tanggal: latestHarga.tanggal },
      select: { gramasi: true, harga: true },
    });
    for (const p of prices) {
      const gram  = normG(p.gramasi);
      const harga = Number(p.harga);
      if (!gram) continue;
      const entry = antamMap.get(gram) ?? { dasar: null, buyback: null };
      if (isBB(p.gramasi)) {
        entry.buyback = harga;
        if (gram === 1) bb1gr = harga;
      } else {
        entry.dasar = harga;
      }
      antamMap.set(gram, entry);
    }
  }

  // Fetch data in parallel
  const [owners, units] = await Promise.all([
    prisma.owner.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.stockUnit.findMany({
      where: {
        status: "available",
        ...(ownerFilter ? { ownerId: ownerFilter } : {}),
      },
      select: {
        product: { select: { brand: true, weightGram: true, series: true } },
        owner:   { select: { id: true, name: true } },
      },
    }),
  ]);

  // Aggregate: group by ownerId | brand | series | weightGram
  const rowMap = new Map<string, RecapRow>();
  for (const u of units) {
    const wg     = u.product.weightGram.toNumber();
    const brand  = u.product.brand  ?? "—";
    const series = u.product.series ?? "—";
    const key    = `${u.owner.id}|${brand}|${series}|${wg}`;

    if (!rowMap.has(key)) {
      const antam      = antamMap.get(wg);
      const hargaDasar = antam?.dasar ?? null;
      rowMap.set(key, {
        ownerId:     u.owner.id,
        ownerName:   u.owner.name,
        brand,
        series,
        weightGram:  wg,
        qty:         0,
        totalGram:   0,
        nilaiDasar:  hargaDasar != null ? 0 : null,
        nilaiBuyback: bb1gr != null ? 0 : null,
      });
    }

    const row = rowMap.get(key)!;
    row.qty        += 1;
    row.totalGram  += wg;
    if (row.nilaiDasar  != null) row.nilaiDasar  += antamMap.get(wg)!.dasar!;
    if (row.nilaiBuyback != null) row.nilaiBuyback += Math.round(wg * bb1gr!);
  }

  // Sort: owner → brand → series → weightGram
  const rows = [...rowMap.values()].sort((a, b) =>
    a.ownerName.localeCompare(b.ownerName) ||
    a.brand.localeCompare(b.brand)         ||
    a.series.localeCompare(b.series)       ||
    a.weightGram - b.weightGram
  );

  // Group by owner for section headers (only when showing all)
  const grouped = new Map<string, { ownerName: string; rows: RecapRow[] }>();
  for (const row of rows) {
    if (!grouped.has(row.ownerId)) grouped.set(row.ownerId, { ownerName: row.ownerName, rows: [] });
    grouped.get(row.ownerId)!.rows.push(row);
  }

  // Grand totals
  const grandQty      = rows.reduce((s, r) => s + r.qty, 0);
  const grandGram     = rows.reduce((s, r) => s + r.totalGram, 0);
  const grandDasar    = rows.some(r => r.nilaiDasar  != null) ? rows.reduce((s, r) => s + (r.nilaiDasar  ?? 0), 0) : null;
  const grandBuyback  = rows.some(r => r.nilaiBuyback != null) ? rows.reduce((s, r) => s + (r.nilaiBuyback ?? 0), 0) : null;

  const antamDate = latestHarga
    ? new Date(latestHarga.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const selectedOwner = ownerFilter ? owners.find(o => o.id === ownerFilter) : null;

  return (
    <div>
      <p className="section-label" style={{ marginBottom: 8 }}>Stok</p>
      <div style={{ marginBottom: 28 }}>
        <h1 className="fd" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--text)" }}>
          Rekap Stok
        </h1>
        <p style={{ fontSize: 13, color: "#5A5045", marginTop: 4 }}>
          Ringkasan unit tersedia per pemilik
          {antamDate && <> · Harga Antam per <strong style={{ color: "#7A6E5F" }}>{antamDate}</strong></>}
        </p>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Unit",         value: grandQty.toString(),              sub: "unit tersedia" },
          { label: "Total Gramasi",      value: fmtGram(grandGram),              sub: "berat total"   },
          { label: "Nilai Dasar Antam",  value: grandDasar  != null ? fmt(grandDasar)  : "—", sub: "harga dasar" },
          { label: "Nilai Buyback Antam", value: grandBuyback != null ? fmt(grandBuyback) : "—", sub: "harga buyback" },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{
            background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)",
            borderRadius: 12, padding: "20px 24px",
          }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#5A5045", marginBottom: 8 }}>
              {label}
            </div>
            <div className="fd" style={{ fontSize: "1.5rem", fontWeight: 300, color: "var(--gold)", lineHeight: 1 }}>
              {value}
            </div>
            <div style={{ fontSize: 11, color: "#3A342A", marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{
        background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 16, padding: 24,
      }}>
        {/* Owner select */}
        <div style={{ marginBottom: 20 }}>
          <Suspense fallback={null}>
            <OwnerSelect owners={owners} selected={ownerFilter ?? ""} />
          </Suspense>
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>◈</p>
            <p style={{ fontSize: 15, color: "#5A5045" }}>
              {ownerFilter ? `Tidak ada stok tersedia untuk ${selectedOwner?.name ?? "pemilik ini"}` : "Belum ada stok tersedia"}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {[
                    { label: "Brand",              align: "left"  },
                    { label: "Series",             align: "left"  },
                    { label: "Gramasi",            align: "right" },
                    { label: "Qty",                align: "right" },
                    { label: "Total Gram",         align: "right" },
                    { label: "Nilai Dasar Antam",  align: "right" },
                    { label: "Nilai Buyback Antam", align: "right" },
                  ].map(({ label, align }) => (
                    <th key={label} style={{ ...thStyle, textAlign: align as React.CSSProperties["textAlign"] }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...grouped.entries()].map(([ownerId, group]) => {
                  const subQty     = group.rows.reduce((s, r) => s + r.qty, 0);
                  const subGram    = group.rows.reduce((s, r) => s + r.totalGram, 0);
                  const subDasar   = group.rows.some(r => r.nilaiDasar  != null) ? group.rows.reduce((s, r) => s + (r.nilaiDasar  ?? 0), 0) : null;
                  const subBuyback = group.rows.some(r => r.nilaiBuyback != null) ? group.rows.reduce((s, r) => s + (r.nilaiBuyback ?? 0), 0) : null;

                  return (
                    <>
                      {/* Owner section header — only when showing all owners */}
                      {!ownerFilter && (
                        <tr key={`owner-${ownerId}`}>
                          <td colSpan={7} style={{
                            padding: "12px 14px 6px",
                            fontSize: 11, letterSpacing: 1.5,
                            textTransform: "uppercase", fontWeight: 600,
                            color: "var(--gold)",
                            borderBottom: "1px solid rgba(201,168,76,.1)",
                            borderTop: "1px solid rgba(201,168,76,.06)",
                            background: "rgba(201,168,76,.03)",
                          }}>
                            {group.ownerName}
                          </td>
                        </tr>
                      )}

                      {/* Data rows */}
                      {group.rows.map((row, i) => (
                        <tr key={`${ownerId}-${i}`} className="adm-tr-hover">
                          <td style={tdStyle}>
                            <span style={{ color: "#EDE8DE", textTransform: "capitalize" }}>{row.brand}</span>
                          </td>
                          <td style={tdStyle}>{row.series}</td>
                          <td style={{ ...tdNum, color: "#EDE8DE" }}>{fmtGram(row.weightGram)}</td>
                          <td style={{ ...tdNum, color: "#EDE8DE", fontWeight: 500 }}>{row.qty}</td>
                          <td style={tdNum}>{fmtGram(row.totalGram)}</td>
                          <td style={tdNum}>
                            {row.nilaiDasar != null ? fmt(row.nilaiDasar) : <span style={{ color: "#3A342A" }}>—</span>}
                          </td>
                          <td style={tdNum}>
                            {row.nilaiBuyback != null ? fmt(row.nilaiBuyback) : <span style={{ color: "#3A342A" }}>—</span>}
                          </td>
                        </tr>
                      ))}

                      {/* Owner subtotal — only when showing all owners and >1 owner has rows */}
                      {!ownerFilter && grouped.size > 1 && (
                        <tr key={`sub-${ownerId}`}>
                          <td colSpan={3} style={{
                            ...tdStyle, fontSize: 11, color: "#5A5045",
                            fontStyle: "italic", borderBottom: "1px solid rgba(201,168,76,.12)",
                          }}>
                            Subtotal {group.ownerName}
                          </td>
                          <td style={{ ...tdNum, fontWeight: 600, color: "#EDE8DE", borderBottom: "1px solid rgba(201,168,76,.12)" }}>{subQty}</td>
                          <td style={{ ...tdNum, fontWeight: 600, color: "#EDE8DE", borderBottom: "1px solid rgba(201,168,76,.12)" }}>{fmtGram(subGram)}</td>
                          <td style={{ ...tdNum, fontWeight: 600, color: "#EDE8DE", borderBottom: "1px solid rgba(201,168,76,.12)" }}>
                            {subDasar != null ? fmt(subDasar) : "—"}
                          </td>
                          <td style={{ ...tdNum, fontWeight: 600, color: "#EDE8DE", borderBottom: "1px solid rgba(201,168,76,.12)" }}>
                            {subBuyback != null ? fmt(subBuyback) : "—"}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}

                {/* Grand total */}
                <tr>
                  <td colSpan={3} style={{
                    ...tdStyle, fontWeight: 600, fontSize: 12,
                    color: "var(--gold)", borderTop: "1px solid rgba(201,168,76,.25)",
                    borderBottom: "none", paddingTop: 14,
                  }}>
                    Grand Total
                  </td>
                  <td style={{ ...tdNum, fontWeight: 700, color: "var(--gold)", borderTop: "1px solid rgba(201,168,76,.25)", borderBottom: "none", paddingTop: 14 }}>
                    {grandQty}
                  </td>
                  <td style={{ ...tdNum, fontWeight: 700, color: "var(--gold)", borderTop: "1px solid rgba(201,168,76,.25)", borderBottom: "none", paddingTop: 14 }}>
                    {fmtGram(grandGram)}
                  </td>
                  <td style={{ ...tdNum, fontWeight: 700, color: "var(--gold)", borderTop: "1px solid rgba(201,168,76,.25)", borderBottom: "none", paddingTop: 14 }}>
                    {grandDasar != null ? fmt(grandDasar) : "—"}
                  </td>
                  <td style={{ ...tdNum, fontWeight: 700, color: "var(--gold)", borderTop: "1px solid rgba(201,168,76,.25)", borderBottom: "none", paddingTop: 14 }}>
                    {grandBuyback != null ? fmt(grandBuyback) : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
