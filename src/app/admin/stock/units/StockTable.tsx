"use client";

import { useState } from "react";
import { fmt } from "@/components/price/shared";

export type UnitRow = {
  id: string;
  serialNumber: string | null;
  certCode: string | null;
  mintYear: number | null;
  condition: string;
  status: string;
  createdAt: string;
  referencePrice: number | null;
  actualPurchasePrice: number | null;
  product: { brand: string | null; weightGram: number; series: string | null };
  owner: { name: string };
  sale: { sellPrice: number; margin: number; transactedAt: string } | null;
};

type Tab = "tersedia" | "terjual";

const ITEMS_PER_PAGE = 20;

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  available:   { color: "#4CAF50",     bg: "rgba(76,175,80,.1)",   border: "rgba(76,175,80,.25)"   },
  reserved:    { color: "var(--gold)", bg: "rgba(201,168,76,.12)", border: "rgba(201,168,76,.3)"   },
  sold:        { color: "#5A5045",     bg: "rgba(255,255,255,.04)",border: "rgba(255,255,255,.08)" },
  swapped_out: { color: "#EF5350",     bg: "rgba(239,83,80,.08)",  border: "rgba(239,83,80,.2)"    },
};
const STATUS_LABEL: Record<string, string> = {
  available: "Tersedia", reserved: "Dipesan", sold: "Terjual", swapped_out: "Swap",
};
const CONDITION_LABEL: Record<string, string> = { new: "Baru", used: "Bekas" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.sold;
  return (
    <span style={{ ...s, borderRadius: 20, padding: "3px 10px", fontSize: 12, border: `1px solid ${s.border}` }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return <span style={{ fontFamily: "monospace", fontSize: 12 }}>{children}</span>;
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "11px 12px", color: "#9A8E7E", whiteSpace: "nowrap" }}>{children}</td>;
}

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;

  const pages: (number | "…")[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) pages.push(i);
    if (page < total - 2) pages.push("…");
    pages.push(total);
  }

  const btnBase: React.CSSProperties = {
    minWidth: 32, height: 32, borderRadius: 6, fontSize: 13, cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    border: "1px solid rgba(255,255,255,.08)", background: "transparent",
    color: "#7A6E5F", fontFamily: "var(--font-dm-sans), sans-serif", padding: "0 8px",
    transition: "all .15s",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      <button
        style={{ ...btnBase, opacity: page === 1 ? 0.3 : 1, cursor: page === 1 ? "default" : "pointer" }}
        onClick={() => page > 1 && onChange(page - 1)}
        disabled={page === 1}
      >← Prev</button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} style={{ color: "#3A342A", padding: "0 4px" }}>…</span>
        ) : (
          <button
            key={p}
            style={{
              ...btnBase,
              ...(p === page ? {
                background: "rgba(201,168,76,.15)",
                border: "1px solid rgba(201,168,76,.4)",
                color: "var(--gold)",
              } : {}),
            }}
            onClick={() => onChange(p as number)}
          >
            {p}
          </button>
        )
      )}

      <button
        style={{ ...btnBase, opacity: page === total ? 0.3 : 1, cursor: page === total ? "default" : "pointer" }}
        onClick={() => page < total && onChange(page + 1)}
        disabled={page === total}
      >Next →</button>
    </div>
  );
}

export default function StockTable({ units }: { units: UnitRow[] }) {
  const [tab,         setTab]         = useState<Tab>("tersedia");
  const [page,        setPage]        = useState(1);
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter,setStatusFilter]= useState("all");
  const [search,      setSearch]      = useState("");

  const owners = [...new Set(units.map((u) => u.owner.name))].sort();

  const byTab = tab === "tersedia"
    ? units.filter((u) => u.status === "available" || u.status === "reserved")
    : units.filter((u) => u.status === "sold" || u.status === "swapped_out");

  const filtered = byTab.filter((u) => {
    if (ownerFilter  !== "all" && u.owner.name !== ownerFilter) return false;
    if (tab === "tersedia" && statusFilter !== "all" && u.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        u.serialNumber?.toLowerCase().includes(q) ||
        u.certCode?.toLowerCase().includes(q) ||
        u.product.brand?.toLowerCase().includes(q) ||
        false
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const countTersedia = units.filter((u) => u.status === "available" || u.status === "reserved").length;
  const countTerjual  = units.filter((u) => u.status === "sold" || u.status === "swapped_out").length;

  function switchTab(t: Tab) { setTab(t); setPage(1); setSearch(""); setStatusFilter("all"); }
  function changeFilter() { setPage(1); }

  const colSpan = tab === "tersedia" ? 11 : 11;

  return (
    <>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,.06)", paddingBottom: 16 }}>
        {([
          { key: "tersedia", label: "Tersedia", count: countTersedia },
          { key: "terjual",  label: "Terjual",  count: countTerjual  },
        ] as { key: Tab; label: string; count: number }[]).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            style={{
              padding: "7px 18px", borderRadius: 8, fontSize: 13, cursor: "pointer",
              transition: "all .2s", fontFamily: "var(--font-dm-sans), sans-serif",
              border: tab === key ? "1px solid rgba(201,168,76,.4)" : "1px solid rgba(255,255,255,.08)",
              background: tab === key ? "rgba(201,168,76,.12)" : "transparent",
              color: tab === key ? "var(--gold)" : "#5A5045",
            }}
          >
            {label}
            <span style={{
              marginLeft: 8, fontSize: 11, padding: "2px 7px", borderRadius: 10,
              background: tab === key ? "rgba(201,168,76,.2)" : "rgba(255,255,255,.06)",
              color: tab === key ? "var(--gold)" : "#3A342A",
            }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            className="sl-in"
            placeholder="Cari serial / cert / brand…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); changeFilter(); }}
            style={{ width: 200 }}
          />
          {tab === "tersedia" && (
            <select className="sl-in" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); changeFilter(); }}>
              <option value="all">Semua Status</option>
              <option value="available">Tersedia</option>
              <option value="reserved">Dipesan</option>
            </select>
          )}
          <select className="sl-in" value={ownerFilter} onChange={(e) => { setOwnerFilter(e.target.value); changeFilter(); }}>
            <option value="all">Semua Pemilik</option>
            {owners.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <p style={{ fontSize: 12, color: "#5A5045" }}>
          {filtered.length} unit
          {totalPages > 1 && ` · hal. ${safePage}/${totalPages}`}
        </p>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 780 }}>
          <thead>
            <tr>
              {(tab === "tersedia"
                ? ["Brand","Berat","Series","Thn Cetak","Serial Number","Cert Code","Kondisi","Status","Pemilik","Harga Ref","Tgl Masuk"]
                : ["Brand","Berat","Series","Thn Cetak","Serial Number","Cert Code","Kondisi","Status","Pemilik","Harga Jual","Margin","Tgl Jual"]
              ).map((h) => (
                <th key={h} style={{
                  padding: "10px 12px", fontSize: 10, letterSpacing: 1.5, color: "#5A5045",
                  textTransform: "uppercase", textAlign: "left", fontWeight: 500,
                  borderBottom: "1px solid rgba(201,168,76,.2)", whiteSpace: "nowrap",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={colSpan} style={{ padding: "40px 20px", textAlign: "center", color: "#4A3E2E", fontSize: 14 }}>
                  Tidak ada unit ditemukan
                </td>
              </tr>
            ) : paginated.map((u) => (
              <tr
                key={u.id}
                onMouseOver={(e)  => (e.currentTarget.style.background = "rgba(201,168,76,.03)")}
                onMouseOut={(e)   => (e.currentTarget.style.background = "")}
                style={{ transition: "background .15s" }}
              >
                <td style={{ padding: "11px 12px", color: "var(--gold)", fontWeight: 500 }}>{u.product.brand ?? "—"}</td>
                <Cell>{u.product.weightGram} gr</Cell>
                <td style={{ padding: "11px 12px", color: "#7A6E5F" }}>{u.product.series ?? "—"}</td>
                <td style={{ padding: "11px 12px", color: "#7A6E5F" }}>{u.mintYear ?? "—"}</td>
                <td style={{ padding: "11px 12px", color: "#EDE8DE" }}>
                  <Mono>{u.serialNumber ?? <span style={{ color: "#3A342A" }}>—</span>}</Mono>
                </td>
                <td style={{ padding: "11px 12px", color: "#9A8E7E" }}>
                  <Mono>{u.certCode ?? <span style={{ color: "#3A342A" }}>—</span>}</Mono>
                </td>
                <td style={{ padding: "11px 12px" }}>
                  <span style={{
                    fontSize: 12, borderRadius: 20, padding: "3px 10px",
                    color: u.condition === "new" ? "#4CAF50" : "#7A6E5F",
                    background: u.condition === "new" ? "rgba(76,175,80,.08)" : "rgba(255,255,255,.04)",
                    border: `1px solid ${u.condition === "new" ? "rgba(76,175,80,.2)" : "rgba(255,255,255,.08)"}`,
                  }}>
                    {CONDITION_LABEL[u.condition] ?? u.condition}
                  </span>
                </td>
                <td style={{ padding: "11px 12px" }}><StatusBadge status={u.status} /></td>
                <td style={{ padding: "11px 12px", color: "#7A6E5F" }}>{u.owner.name}</td>

                {tab === "tersedia" ? (
                  <>
                    <Cell>{u.referencePrice ? fmt(u.referencePrice) : <span style={{ color: "#3A342A" }}>—</span>}</Cell>
                    <td style={{ padding: "11px 12px", color: "#5A5045", whiteSpace: "nowrap" }}>{fmtDate(u.createdAt)}</td>
                  </>
                ) : (
                  <>
                    <Cell>{u.sale ? fmt(u.sale.sellPrice) : <span style={{ color: "#3A342A" }}>—</span>}</Cell>
                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      {u.sale
                        ? <span style={{ color: u.sale.margin >= 0 ? "#4CAF50" : "#EF5350" }}>{fmt(u.sale.margin)}</span>
                        : <span style={{ color: "#3A342A" }}>—</span>
                      }
                    </td>
                    <td style={{ padding: "11px 12px", color: "#5A5045", whiteSpace: "nowrap" }}>
                      {u.sale ? fmtDate(u.sale.transactedAt) : "—"}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 12, color: "#5A5045" }}>
            Menampilkan {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} dari {filtered.length} unit
          </p>
          <Pagination page={safePage} total={totalPages} onChange={setPage} />
        </div>
      )}

      <style>{`
        .sl-in {
          height: 36px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1);
          border-radius: 8px; padding: 0 12px; color: #EDE8DE; font-size: 13px; outline: none;
          font-family: var(--font-dm-sans), sans-serif;
        }
        .sl-in:focus { border-color: rgba(201,168,76,.5); }
        .sl-in option { background: #1E1A14; color: #EDE8DE; }
        .sl-in::placeholder { color: #4A3E2E; }
      `}</style>
    </>
  );
}
