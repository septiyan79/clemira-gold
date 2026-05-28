import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default async function OutstandingSwapsPage() {
  const events = await prisma.swapEvent.findMany({
    where: { replacementUnitId: null },
    include: {
      originalUnit: {
        include: {
          product: { select: { brand: true, weightGram: true, series: true } },
          owner:   { select: { name: true } },
        },
      },
      transactionLine: {
        select: {
          sellPrice: true,
          transaction: {
            select: {
              transactedAt: true,
              buyer: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const thStyle: React.CSSProperties = {
    padding: "10px 14px", fontSize: 10, letterSpacing: 1.5, color: "#5A5045",
    textTransform: "uppercase", textAlign: "left", fontWeight: 500,
    borderBottom: "1px solid rgba(201,168,76,.2)", whiteSpace: "nowrap",
  };
  const tdStyle: React.CSSProperties = {
    padding: "12px 14px", color: "#9A8E7E", whiteSpace: "nowrap",
    borderBottom: "1px solid rgba(255,255,255,.04)",
  };

  return (
    <div>
      <p className="section-label" style={{ marginBottom: 8 }}>Transaksi</p>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="fd" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--text)", marginBottom: 4 }}>
            Outstanding Swaps
          </h1>
          <p style={{ fontSize: 13, color: "#5A5045" }}>
            Transaksi swap yang unit penggantinya belum dicatat
          </p>
        </div>
        <Link href="/admin/transactions/new" style={{
          height: 38, padding: "0 18px", display: "inline-flex", alignItems: "center",
          borderRadius: 8, fontSize: 13, textDecoration: "none",
          border: "1px solid rgba(201,168,76,.4)", background: "rgba(201,168,76,.12)", color: "var(--gold)",
        }}>
          + Catat Transaksi
        </Link>
      </div>

      <div style={{
        background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 16, padding: "24px",
      }}>
        {events.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>✓</p>
            <p style={{ fontSize: 15, color: "#4CAF50", marginBottom: 6 }}>Semua swap sudah lengkap</p>
            <p style={{ fontSize: 13, color: "#5A5045" }}>Tidak ada unit pengganti yang belum dicatat</p>
          </div>
        ) : (
          <>
            {/* Count banner */}
            <div style={{
              background: "rgba(239,83,80,.07)", border: "1px solid rgba(239,83,80,.2)",
              borderRadius: 8, padding: "10px 16px", marginBottom: 20,
              fontSize: 13, color: "#EF5350", display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>⚠</span>
              <b>{events.length}</b> swap menunggu pencatatan unit pengganti
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 700 }}>
                <thead>
                  <tr>
                    {["Tgl Swap", "Unit Keluar", "Serial", "Pemilik", "Ref Price", "Pembeli", "Harga Jual", "Rencana Biaya Ganti", "Aksi"].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => {
                    const u   = ev.originalUnit;
                    const p   = u.product;
                    const tx  = ev.transactionLine?.transaction;
                    const age = tx
                      ? Math.floor((Date.now() - new Date(tx.transactedAt).getTime()) / 86_400_000)
                      : null;

                    return (
                      <tr key={ev.id} className="adm-tr-hover">
                        <td style={tdStyle}>
                          <div>{tx ? fmtDate(tx.transactedAt.toISOString()) : "—"}</div>
                          {age !== null && (
                            <div style={{ fontSize: 11, color: age > 7 ? "#EF5350" : "#5A5045", marginTop: 2 }}>
                              {age === 0 ? "hari ini" : `${age} hari lalu`}
                            </div>
                          )}
                        </td>
                        <td style={{ ...tdStyle, color: "var(--gold)", fontWeight: 500 }}>
                          {p.brand ?? "—"} {p.weightGram.toNumber()}gr
                          {p.series && <span style={{ color: "#5A5045", fontWeight: 400 }}> ({p.series})</span>}
                        </td>
                        <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 12 }}>
                          {u.serialNumber ?? <span style={{ color: "#3A342A" }}>—</span>}
                        </td>
                        <td style={tdStyle}>{u.owner.name}</td>
                        <td style={{ ...tdStyle, color: "#EDE8DE" }}>
                          {u.referencePrice ? fmt(u.referencePrice.toNumber()) : "—"}
                        </td>
                        <td style={tdStyle}>
                          {tx?.buyer?.name ?? <span style={{ color: "#3A342A" }}>—</span>}
                        </td>
                        <td style={tdStyle}>
                          {ev.transactionLine ? fmt(ev.transactionLine.sellPrice.toNumber()) : "—"}
                        </td>
                        <td style={{ ...tdStyle, color: ev.replacementCost ? "#EDE8DE" : "#3A342A" }}>
                          {ev.replacementCost ? fmt(ev.replacementCost.toNumber()) : "belum diset"}
                        </td>
                        <td style={tdStyle}>
                          <Link
                            href="/admin/transactions/new"
                            style={{
                              fontSize: 12, padding: "5px 12px", borderRadius: 6,
                              border: "1px solid rgba(201,168,76,.35)",
                              background: "rgba(201,168,76,.08)", color: "var(--gold)",
                              textDecoration: "none", whiteSpace: "nowrap",
                            }}
                          >
                            Catat Pengganti
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
