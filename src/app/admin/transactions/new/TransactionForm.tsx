"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fmt } from "@/components/price/shared";

// ─── Types ───────────────────────────────────────────────────────────────────
type Owner        = { id: string; name: string };
type Counterparty = { id: string; name: string };
type Product      = { id: string; name: string; weightGram: number; brand: string | null; series: string | null };
type AvailUnit    = {
  id: string; serialNumber: string | null; certCode: string | null;
  mintYear: number | null; condition: string; referencePrice: number | null;
  product: { brand: string | null; weightGram: number; series: string | null };
  owner: { name: string };
};
type PurchUnit = {
  _key: number; productId: string; ownerId: string;
  serialNumber: string; certCode: string; mintYear: string;
  condition: "new" | "used"; unitPrice: string; swapEventId: string;
};
type SwapEventOption = {
  id: string;
  transactedAt: string | null;
  originalUnit: {
    serialNumber: string | null;
    referencePrice: number | null;
    product: { brand: string | null; weightGram: number; series: string | null };
  };
};

// ─── Constants ───────────────────────────────────────────────────────────────
let _k = 0;
const makeUnit = (): PurchUnit => ({
  _key: ++_k, productId: "", ownerId: "", serialNumber: "", certCode: "",
  mintYear: "", condition: "new", unitPrice: "", swapEventId: "",
});
const TODAY = new Date().toISOString().slice(0, 10);

// ─── Shared Styles ────────────────────────────────────────────────────────────
const S = {
  inp: {
    height: 38, width: "100%", background: "rgba(255,255,255,.04)", color: "#EDE8DE",
    border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "0 12px",
    fontSize: 13, outline: "none", fontFamily: "var(--font-dm-sans), sans-serif",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,
  lbl: {
    display: "block", fontSize: 11, color: "#5A5045", letterSpacing: "1px",
    textTransform: "uppercase" as const, marginBottom: 5,
  } as React.CSSProperties,
  card: {
    background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)",
    borderRadius: 12, padding: "20px",
  } as React.CSSProperties,
  row: { display: "grid", gap: 14 } as React.CSSProperties,
};

// ─── Small Components ─────────────────────────────────────────────────────────
function F({ label, addon, children }: { label: string; addon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <label style={{ ...S.lbl, marginBottom: 0 }}>{label}</label>
        {addon}
      </div>
      {children}
    </div>
  );
}

type CPResult = { id: string; name: string; type: string[] };

function QuickAdd({ type, role, onCreated }: {
  type: "counterparty" | "owner";
  role?: "buyer" | "supplier";
  onCreated: (id: string, name: string) => void;
}) {
  const [open,      setOpen]      = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [err,       setErr]       = useState("");

  // Owner-mode state
  const [ownerName, setOwnerName] = useState("");
  const [ownerType, setOwnerType] = useState<"entity" | "personal">("personal");

  // Counterparty combobox state
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState<CPResult[]>([]);
  const [searching, setSearching] = useState(false);

  function reset() {
    setOpen(false); setOwnerName(""); setQuery("");
    setResults([]); setErr(""); setSaving(false);
  }

  // Debounced search
  useEffect(() => {
    if (type !== "counterparty" || !open || !query.trim()) {
      setResults([]); return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/stock/counterparties?q=${encodeURIComponent(query.trim())}`);
        setResults(await res.json());
      } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, open, type]);

  async function handleSelectExisting(cp: CPResult) {
    if (!role || cp.type.includes(role)) {
      // Already has the role — just pick them
      onCreated(cp.id, cp.name); reset(); return;
    }
    // Need to add role via PATCH
    setSaving(true);
    const res = await fetch(`/api/stock/counterparties/${cp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addRole: role }),
    });
    setSaving(false);
    if (res.ok) { onCreated(cp.id, cp.name); reset(); }
    else { const d = await res.json(); setErr(d.error ?? "Gagal menambah role"); }
  }

  async function handleCreateNew() {
    const nameVal = type === "counterparty" ? query.trim() : ownerName.trim();
    if (!nameVal) { setErr("Nama wajib diisi"); return; }
    setSaving(true); setErr("");
    const [url, body] = type === "counterparty"
      ? ["/api/stock/counterparties", { name: nameVal, type: [role!] }]
      : ["/api/stock/owners",         { name: nameVal, type: ownerType }];
    const res = await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) { const d = await res.json(); onCreated(d.id, d.name); reset(); }
    else { const d = await res.json(); setErr(d.error ?? "Gagal menyimpan"); }
  }

  const modalCard: React.CSSProperties = {
    background: "#1E1A14", border: "1px solid rgba(255,255,255,.1)",
    borderRadius: 16, padding: 28, width: "100%", maxWidth: 500,
    maxHeight: "90vh", overflowY: "auto",
  };
  const btnBase: React.CSSProperties = {
    height: 38, padding: "0 20px", fontSize: 14, borderRadius: 8,
    cursor: "pointer", fontFamily: "var(--font-dm-sans), sans-serif",
  };
  const overlay: React.CSSProperties = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
  };

  const modalTitle = type === "owner"
    ? "Tambah Pemilik Baru"
    : `Tambah ${role === "buyer" ? "Pembeli" : role === "supplier" ? "Supplier" : "Counterparty"}`;

  if (!open) return (
    <button type="button" onClick={() => setOpen(true)}
      style={{ fontSize: 13, color: "var(--gold)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--font-dm-sans), sans-serif" }}>
      + Baru
    </button>
  );

  // ── Owner mode modal ──
  if (type === "owner") return (
    <div style={overlay} onMouseDown={e => { if (e.target === e.currentTarget) reset(); }}>
      <div style={modalCard}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 className="fd" style={{ margin: 0, fontSize: "1.15rem", fontWeight: 400, color: "var(--text)" }}>
            {modalTitle}
          </h3>
          <button type="button" onClick={reset}
            style={{ background: "none", border: "none", color: "#5A5045", fontSize: 24, cursor: "pointer", lineHeight: 1, padding: 0 }}>
            ×
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={S.lbl}>Nama *</label>
            <input autoFocus placeholder="Nama pemilik" value={ownerName} onChange={e => setOwnerName(e.target.value)}
              style={S.inp} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleCreateNew())} />
          </div>
          <div>
            <label style={S.lbl}>Tipe</label>
            <select value={ownerType} onChange={e => setOwnerType(e.target.value as "entity" | "personal")}
              style={{ ...S.inp, cursor: "pointer" }}>
              <option value="personal">Personal</option>
              <option value="entity">Entitas / Toko</option>
            </select>
          </div>
        </div>

        {err && (
          <div style={{ marginTop: 16, fontSize: 13, color: "#EF5350", background: "rgba(239,83,80,.08)", border: "1px solid rgba(239,83,80,.2)", borderRadius: 6, padding: "10px 14px" }}>
            {err}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button type="button" onClick={handleCreateNew} disabled={saving}
            style={{ ...btnBase, border: "1px solid rgba(201,168,76,.4)", background: "rgba(201,168,76,.12)", color: "var(--gold)", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
          <button type="button" onClick={reset}
            style={{ ...btnBase, border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "#7A6E5F" }}>
            Batal
          </button>
        </div>
      </div>
    </div>
  );

  // ── Counterparty combobox modal ──
  const roleBg  = (r: string) => r === "buyer" ? "rgba(201,168,76,.12)" : "rgba(100,181,246,.12)";
  const roleClr = (r: string) => r === "buyer" ? "#C9A84C" : "#64B5F6";

  return (
    <div style={overlay} onMouseDown={e => { if (e.target === e.currentTarget) reset(); }}>
      <div style={modalCard}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 className="fd" style={{ margin: 0, fontSize: "1.15rem", fontWeight: 400, color: "var(--text)" }}>
            {modalTitle}
          </h3>
          <button type="button" onClick={reset}
            style={{ background: "none", border: "none", color: "#5A5045", fontSize: 24, cursor: "pointer", lineHeight: 1, padding: 0 }}>
            ×
          </button>
        </div>

        {/* Search input */}
        <div>
          <label style={S.lbl}>Cari atau ketik nama baru</label>
          <input
            autoFocus
            placeholder={`Nama ${role === "buyer" ? "pembeli" : "supplier"}…`}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Escape" && reset()}
            style={S.inp}
          />
        </div>

        {/* Results */}
        {query.trim() && (
          <div style={{
            marginTop: 10,
            border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, overflow: "hidden",
          }}>
            {searching && (
              <div style={{ padding: "16px", fontSize: 14, color: "#5A5045" }}>Mencari…</div>
            )}

            {!searching && results.map((cp, i) => {
              const hasRole = !role || cp.type.includes(role);
              return (
                <div key={cp.id}
                  onMouseDown={e => { e.preventDefault(); if (!saving) handleSelectExisting(cp); }}
                  style={{
                    padding: "14px 16px", cursor: saving ? "default" : "pointer",
                    borderBottom: i < results.length - 1 ? "1px solid rgba(255,255,255,.06)" : undefined,
                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
                    background: "rgba(255,255,255,.02)",
                    transition: "background .12s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.05)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,.02)")}
                >
                  <div>
                    <div style={{ fontSize: 15, color: "#EDE8DE", marginBottom: 6 }}>{cp.name}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {cp.type.map(r => (
                        <span key={r} style={{
                          fontSize: 12, padding: "2px 10px", borderRadius: 4,
                          background: roleBg(r), color: roleClr(r), fontWeight: 500,
                        }}>
                          {r === "buyer" ? "Buyer" : "Supplier"}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 13, whiteSpace: "nowrap", padding: "6px 14px", borderRadius: 6, fontWeight: 500,
                    color:      hasRole ? "#4CAF50"            : "var(--gold)",
                    background: hasRole ? "rgba(76,175,80,.1)" : "rgba(201,168,76,.1)",
                    border:     `1px solid ${hasRole ? "rgba(76,175,80,.3)" : "rgba(201,168,76,.3)"}`,
                  }}>
                    {hasRole ? "Pilih" : `+ tambah role ${role}`}
                  </span>
                </div>
              );
            })}

            {!searching && results.length === 0 && (
              <div style={{ padding: "16px", fontSize: 14, color: "#5A5045" }}>
                Tidak ditemukan di database
              </div>
            )}

            {/* Create new row */}
            <div
              onMouseDown={e => { e.preventDefault(); if (!saving) handleCreateNew(); }}
              style={{
                padding: "14px 16px", cursor: saving ? "default" : "pointer",
                borderTop: "1px solid rgba(201,168,76,.15)",
                background: "rgba(201,168,76,.04)",
                display: "flex", alignItems: "center", gap: 10,
                opacity: saving ? 0.6 : 1,
                transition: "background .12s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(201,168,76,.09)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(201,168,76,.04)")}
            >
              <span style={{ color: "var(--gold)", fontSize: 18, lineHeight: 1 }}>+</span>
              <div>
                <span style={{ fontSize: 14, color: "#EDE8DE" }}>Buat baru </span>
                <b style={{ fontSize: 14, color: "var(--gold)" }}>"{query.trim()}"</b>
                {role && <span style={{ fontSize: 13, color: "#7A6E5F" }}> sebagai {role}</span>}
              </div>
            </div>
          </div>
        )}

        {!query.trim() && (
          <p style={{ marginTop: 12, fontSize: 13, color: "#3A342A" }}>
            Ketik nama untuk mencari yang sudah ada atau membuat baru
          </p>
        )}

        {err && (
          <div style={{ marginTop: 14, fontSize: 13, color: "#EF5350", background: "rgba(239,83,80,.08)", border: "1px solid rgba(239,83,80,.2)", borderRadius: 6, padding: "10px 14px" }}>
            {err}
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <button type="button" onClick={reset}
            style={{ ...btnBase, border: "1px solid rgba(255,255,255,.12)", background: "transparent", color: "#7A6E5F" }}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function Inp({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return <input type={type} value={value} onChange={e => onChange(e.target.value)}
    placeholder={placeholder} style={S.inp} />;
}

function Sel({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ ...S.inp, cursor: "pointer" }}>
      {children}
    </select>
  );
}

function TA({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      rows={2}
      style={{ ...S.inp, height: "auto", padding: "8px 12px", resize: "vertical" as const }} />
  );
}

function Grid({ cols, children }: { cols: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 14 }}>
      {children}
    </div>
  );
}

function ErrMsg({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div style={{ background: "rgba(239,83,80,.08)", border: "1px solid rgba(239,83,80,.2)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#EF5350" }}>
      {msg}
    </div>
  );
}

function SaveBtn({ loading, label = "Simpan Transaksi" }: { loading: boolean; label?: string }) {
  return (
    <button type="submit" disabled={loading} style={{
      height: 42, padding: "0 32px", borderRadius: 8, fontSize: 14, cursor: loading ? "default" : "pointer",
      border: "1px solid rgba(201,168,76,.4)", background: "rgba(201,168,76,.12)",
      color: "var(--gold)", fontFamily: "var(--font-dm-sans), sans-serif",
      opacity: loading ? 0.6 : 1, transition: "all .2s",
    }}>
      {loading ? "Menyimpan…" : label}
    </button>
  );
}

function MarginPreview({ sell, cogs }: { sell: string; cogs: string }) {
  const s = parseFloat(sell) || 0;
  const c = parseFloat(cogs) || 0;
  if (!s && !c) return null;
  const m = s - c;
  return (
    <div style={{ fontSize: 12, color: "#5A5045", display: "flex", gap: 20, padding: "10px 0 0" }}>
      <span>COGS: <b style={{ color: "#9A8E7E" }}>{fmt(c)}</b></span>
      <span>Margin: <b style={{ color: m >= 0 ? "#4CAF50" : "#EF5350" }}>{fmt(m)}</b></span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TransactionForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<"beli" | "konsinyasi" | "swap">(
    (params.get("tab") ?? "beli") as "beli" | "konsinyasi" | "swap"
  );

  useEffect(() => {
    const t = params.get("tab");
    if (t === "beli" || t === "konsinyasi" || t === "swap") setTab(t);
  }, [params]);

  const [owners,      setOwners]      = useState<Owner[]>([]);
  const [suppliers,   setSuppliers]   = useState<Counterparty[]>([]);
  const [buyers,      setBuyers]      = useState<Counterparty[]>([]);
  const [products,    setProducts]    = useState<Product[]>([]);
  const [avail,       setAvail]       = useState<AvailUnit[]>([]);
  const [openSwaps,   setOpenSwaps]   = useState<SwapEventOption[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/stock/owners").then(r => r.json()),
      fetch("/api/stock/counterparties?role=supplier").then(r => r.json()),
      fetch("/api/stock/counterparties?role=buyer").then(r => r.json()),
      fetch("/api/stock/products").then(r => r.json()),
      fetch("/api/stock/units?status=available").then(r => r.json()),
      fetch("/api/stock/swap-events?open=true").then(r => r.json()),
    ]).then(([o, s, b, p, u, sw]) => {
      setOwners(o); setSuppliers(s); setBuyers(b); setProducts(p); setAvail(u); setOpenSwaps(sw);
    });
  }, []);

  // ── Beli Stok ──────────────────────────────────────────────────────────────
  const [bSupplier, setBSupplier] = useState("");
  const [bDate,     setBDate]     = useState(TODAY);
  const [bNotes,    setBNotes]    = useState("");
  const [bUnits,    setBUnits]    = useState<PurchUnit[]>(() => [makeUnit()]);
  const [bLoading,  setBLoading]  = useState(false);
  const [bError,    setBError]    = useState("");

  function updateUnit(key: number, patch: Partial<PurchUnit>) {
    setBUnits(u => u.map(x => x._key === key ? { ...x, ...patch } : x));
  }

  async function submitBeli(e: { preventDefault(): void }) {
    e.preventDefault();
    setBError("");
    if (!bSupplier) { setBError("Supplier wajib dipilih"); return; }
    if (bUnits.some(u => !u.productId || !u.ownerId || !u.unitPrice)) {
      setBError("Lengkapi produk, pemilik, dan harga beli semua unit"); return;
    }
    setBLoading(true);
    const totalAmount = bUnits.reduce((s, u) => s + (parseFloat(u.unitPrice) || 0), 0);
    const res = await fetch("/api/stock/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierId: bSupplier,
        purchasedAt: bDate,
        notes: bNotes || undefined,
        totalAmount,
        units: bUnits.map(u => ({
          productId:    u.productId,
          ownerId:      u.ownerId,
          serialNumber: u.serialNumber  || undefined,
          certCode:     u.certCode      || undefined,
          mintYear:     u.mintYear      ? parseInt(u.mintYear) : undefined,
          condition:    u.condition,
          unitPrice:    parseFloat(u.unitPrice),
          swapEventId:  u.swapEventId   || undefined,
        })),
      }),
    });
    setBLoading(false);
    if (res.ok) { router.push("/admin/stock/units"); return; }
    const j = await res.json();
    setBError(j.error ?? "Gagal menyimpan");
  }

  // ── Konsinyasi ─────────────────────────────────────────────────────────────
  const [kBuyer,   setKBuyer]   = useState("");
  const [kSupp,    setKSupp]    = useState("");
  const [kDate,    setKDate]    = useState(TODAY);
  const [kNotes,   setKNotes]   = useState("");
  const [kSerial,  setKSerial]  = useState("");
  const [kCert,    setKCert]    = useState("");
  const [kYear,    setKYear]    = useState("");
  const [kCogs,    setKCogs]    = useState("");
  const [kSell,    setKSell]    = useState("");
  const [kLoading, setKLoading] = useState(false);
  const [kError,   setKError]   = useState("");

  async function submitKonsinyasi(e: { preventDefault(): void }) {
    e.preventDefault();
    setKError("");
    if (!kSupp)          { setKError("Supplier konsinyasi wajib dipilih"); return; }
    if (!kCogs || !kSell){ setKError("Harga beli dan harga jual wajib diisi"); return; }
    setKLoading(true);
    const res = await fetch("/api/sales/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyerId:      kBuyer || undefined,
        transactedAt: kDate,
        notes:        kNotes || undefined,
        lines: [{
          fulfillmentMode: "consignment",
          sellPrice: parseFloat(kSell),
          consignment: {
            supplierId:            kSupp,
            serialNumber:          kSerial   || undefined,
            certCode:              kCert     || undefined,
            mintYear:              kYear     ? parseInt(kYear) : undefined,
            supplierPurchasePrice: parseFloat(kCogs),
          },
        }],
      }),
    });
    setKLoading(false);
    if (res.ok) { router.push("/admin/stock/units"); return; }
    const j = await res.json();
    setKError(j.error ?? "Gagal menyimpan");
  }

  // ── Swap ───────────────────────────────────────────────────────────────────
  const [swBuyer,   setSwBuyer]   = useState("");
  const [swSupp,    setSwSupp]    = useState("");
  const [swDate,    setSwDate]    = useState(TODAY);
  const [swNotes,   setSwNotes]   = useState("");
  const [swUnitId,  setSwUnitId]  = useState("");
  const [swSearch,  setSwSearch]  = useState("");
  const [swSell,    setSwSell]    = useState("");
  const [swCost,    setSwCost]    = useState("");
  const [swLoading, setSwLoading] = useState(false);
  const [swError,   setSwError]   = useState("");
  const [swSuccess, setSwSuccess] = useState(false);

  // Replacement unit (opsional, catat sekarang)
  const [swRecordNow,    setSwRecordNow]    = useState(false);
  const [swRepSupp,      setSwRepSupp]      = useState("");
  const [swRepProduct,   setSwRepProduct]   = useState("");
  const [swRepOwner,     setSwRepOwner]     = useState("");
  const [swRepSerial,    setSwRepSerial]    = useState("");
  const [swRepCert,      setSwRepCert]      = useState("");
  const [swRepYear,      setSwRepYear]      = useState("");
  const [swRepCondition, setSwRepCondition] = useState<"new"|"used">("new");
  const [swRepPrice,     setSwRepPrice]     = useState("");

  const swUnit = avail.find(u => u.id === swUnitId);
  const swFiltered = swSearch
    ? avail.filter(u => {
        const q = swSearch.toLowerCase();
        return (
          u.serialNumber?.toLowerCase().includes(q) ||
          u.product.brand?.toLowerCase().includes(q) ||
          u.certCode?.toLowerCase().includes(q) ||
          String(u.product.weightGram).includes(q)
        );
      })
    : avail;

  async function submitSwap(e: { preventDefault(): void }) {
    e.preventDefault();
    setSwError("");
    if (!swUnitId)         { setSwError("Pilih unit yang di-swap"); return; }
    if (!swSell || !swCost){ setSwError("Harga jual dan biaya penggantian wajib diisi"); return; }
    if (swRecordNow) {
      if (!swRepSupp)    { setSwError("Supplier pengganti wajib dipilih"); return; }
      if (!swRepProduct) { setSwError("Produk pengganti wajib dipilih"); return; }
      if (!swRepOwner)   { setSwError("Pemilik unit pengganti wajib dipilih"); return; }
      if (!swRepPrice)   { setSwError("Harga beli unit pengganti wajib diisi"); return; }
    }

    setSwLoading(true);

    // Step 1: catat transaksi swap
    const txRes = await fetch("/api/sales/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyerId:      swBuyer || undefined,
        transactedAt: swDate,
        notes:        swNotes || undefined,
        lines: [{
          stockUnitId:     swUnitId,
          fulfillmentMode: "swap",
          sellPrice:       parseFloat(swSell),
          swap: {
            supplierId:      swSupp || undefined,
            replacementCost: parseFloat(swCost),
          },
        }],
      }),
    });

    if (!txRes.ok) {
      setSwLoading(false);
      const j = await txRes.json();
      setSwError(j.error ?? "Gagal menyimpan transaksi swap");
      return;
    }

    // Step 2 (opsional): catat unit pengganti sekarang
    if (swRecordNow) {
      const evRes = await fetch(`/api/stock/swap-events?open=true&originalUnitId=${swUnitId}`);
      const events: { id: string }[] = await evRes.json();
      const swapEventId = events[0]?.id;

      if (!swapEventId) {
        setSwLoading(false);
        setSwError("Swap tercatat, tapi swap event ID tidak ditemukan. Catat unit pengganti manual di tab Beli Stok.");
        return;
      }

      const poRes = await fetch("/api/stock/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId:  swRepSupp,
          totalAmount: parseFloat(swRepPrice),
          units: [{
            productId:    swRepProduct,
            ownerId:      swRepOwner,
            serialNumber: swRepSerial   || undefined,
            certCode:     swRepCert     || undefined,
            mintYear:     swRepYear     ? parseInt(swRepYear) : undefined,
            condition:    swRepCondition,
            unitPrice:    parseFloat(swRepPrice),
            swapEventId,
          }],
        }),
      });

      setSwLoading(false);
      if (!poRes.ok) {
        const j = await poRes.json();
        setSwError(`Swap tercatat, tapi gagal mencatat unit pengganti: ${j.error ?? "error"}. Catat manual di tab Beli Stok.`);
        return;
      }
      router.push("/admin/stock/units");
      return;
    }

    // Tidak catat pengganti sekarang → tampilkan reminder
    setSwLoading(false);
    setSwSuccess(true);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "7px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer",
    fontFamily: "var(--font-dm-sans), sans-serif", transition: "all .2s",
    border: active ? "1px solid rgba(201,168,76,.4)" : "1px solid rgba(255,255,255,.08)",
    background: active ? "rgba(201,168,76,.12)" : "transparent",
    color: active ? "var(--gold)" : "#5A5045",
  });

  const prodLabel = (p: Product) =>
    `${p.brand ?? "—"} ${p.weightGram}gr${p.series ? ` (${p.series})` : ""}`;

  const swapEventLabel = (e: SwapEventOption) => {
    const p = e.originalUnit.product;
    const date = e.transactedAt
      ? new Date(e.transactedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
      : "—";
    return `${p.brand ?? "—"} ${p.weightGram}gr${e.originalUnit.serialNumber ? ` · ${e.originalUnit.serialNumber}` : ""} · swap ${date}`;
  };

  const unitLabel = (u: AvailUnit) =>
    `${u.product.brand ?? "—"} ${u.product.weightGram}gr${u.serialNumber ? ` · ${u.serialNumber}` : ""}${u.owner ? ` · ${u.owner.name}` : ""}`;

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        <button style={tabStyle(tab === "beli")}       onClick={() => setTab("beli")}>Beli Stok</button>
        <button style={tabStyle(tab === "konsinyasi")} onClick={() => setTab("konsinyasi")}>Konsinyasi</button>
        <button style={tabStyle(tab === "swap")}       onClick={() => setTab("swap")}>Swap</button>
      </div>

      {/* ── TAB: BELI STOK ────────────────────────────────────────────────── */}
      {tab === "beli" && (
        <form onSubmit={submitBeli} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={S.card}>
            <p style={{ fontSize: 12, color: "#5A5045", marginBottom: 16, letterSpacing: 1, textTransform: "uppercase" }}>Info Pembelian</p>
            <Grid cols={2}>
              <F label="Supplier *" addon={<QuickAdd type="counterparty" role="supplier" onCreated={(id, name) => { setSuppliers(s => s.find(x => x.id === id) ? s : [...s, { id, name }]); setBSupplier(id); }} />}>
                <Sel value={bSupplier} onChange={setBSupplier}>
                  <option value="">— Pilih supplier —</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Sel>
              </F>
              <F label="Tanggal Beli *">
                <Inp type="date" value={bDate} onChange={setBDate} />
              </F>
            </Grid>
            <div style={{ marginTop: 14 }}>
              <F label="Catatan">
                <TA value={bNotes} onChange={setBNotes} placeholder="Opsional…" />
              </F>
            </div>
          </div>

          {/* Unit list */}
          {bUnits.map((u, i) => (
            <div key={u._key} style={{ ...S.card, position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <p style={{ fontSize: 12, color: "#5A5045", letterSpacing: 1, textTransform: "uppercase" }}>
                  Unit #{i + 1}
                </p>
                {bUnits.length > 1 && (
                  <button type="button" onClick={() => setBUnits(u2 => u2.filter(x => x._key !== u._key))}
                    style={{ fontSize: 18, color: "#EF5350", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}>
                    ×
                  </button>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Swap event linkage */}
                <F label="Unit Pengganti Swap (opsional)">
                  <Sel value={u.swapEventId} onChange={v => updateUnit(u._key, { swapEventId: v })}>
                    <option value="">— Bukan pengganti swap —</option>
                    {openSwaps.map(e => <option key={e.id} value={e.id}>{swapEventLabel(e)}</option>)}
                  </Sel>
                </F>
                {u.swapEventId && (() => {
                  const ev = openSwaps.find(e => e.id === u.swapEventId);
                  if (!ev) return null;
                  return (
                    <div style={{ background: "rgba(201,168,76,.06)", border: "1px solid rgba(201,168,76,.15)", borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#7A6E5F" }}>
                      Ref price diwarisi otomatis dari unit asal:{" "}
                      <b style={{ color: "var(--gold)" }}>{fmt(ev.originalUnit.referencePrice ?? 0)}</b>
                      {" "}— harga beli unit ini tetap dicatat sebagai <i>actual purchase price</i>
                    </div>
                  );
                })()}
                <Grid cols={2}>
                  <F label="Produk *">
                    <Sel value={u.productId} onChange={v => updateUnit(u._key, { productId: v })}>
                      <option value="">— Pilih produk —</option>
                      {products.map(p => <option key={p.id} value={p.id}>{prodLabel(p)}</option>)}
                    </Sel>
                  </F>
                  <F label="Pemilik *" addon={<QuickAdd type="owner" onCreated={(id, name) => { setOwners(o => o.find(x => x.id === id) ? o : [...o, { id, name }]); updateUnit(u._key, { ownerId: id }); }} />}>
                    <Sel value={u.ownerId} onChange={v => updateUnit(u._key, { ownerId: v })}>
                      <option value="">— Pilih pemilik —</option>
                      {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </Sel>
                  </F>
                </Grid>
                <Grid cols={3}>
                  <F label="No. Serial">
                    <Inp value={u.serialNumber} onChange={v => updateUnit(u._key, { serialNumber: v })} placeholder="Opsional" />
                  </F>
                  <F label="Cert Code">
                    <Inp value={u.certCode} onChange={v => updateUnit(u._key, { certCode: v })} placeholder="Opsional" />
                  </F>
                  <F label="Tahun Cetak">
                    <Inp type="number" value={u.mintYear} onChange={v => updateUnit(u._key, { mintYear: v })} placeholder="cth. 2024" />
                  </F>
                </Grid>
                <Grid cols={2}>
                  <F label="Kondisi *">
                    <Sel value={u.condition} onChange={v => updateUnit(u._key, { condition: v as "new" | "used" })}>
                      <option value="new">Baru</option>
                      <option value="used">Bekas</option>
                    </Sel>
                  </F>
                  <F label="Harga Beli (Rp) *">
                    <Inp type="number" value={u.unitPrice} onChange={v => updateUnit(u._key, { unitPrice: v })} placeholder="0" />
                  </F>
                </Grid>
              </div>
            </div>
          ))}

          <button type="button" onClick={() => setBUnits(u => [...u, makeUnit()])}
            style={{
              height: 38, borderRadius: 8, fontSize: 13, cursor: "pointer",
              border: "1px dashed rgba(255,255,255,.12)", background: "transparent",
              color: "#5A5045", fontFamily: "var(--font-dm-sans), sans-serif",
            }}>
            + Tambah Unit
          </button>

          {bUnits.length > 0 && (
            <div style={{ fontSize: 13, color: "#7A6E5F", padding: "2px 0" }}>
              Total: <b style={{ color: "#EDE8DE" }}>
                {fmt(bUnits.reduce((s, u) => s + (parseFloat(u.unitPrice) || 0), 0))}
              </b>
              {" "}({bUnits.length} unit)
            </div>
          )}

          <ErrMsg msg={bError} />
          <div><SaveBtn loading={bLoading} label="Simpan Pembelian" /></div>
        </form>
      )}

      {/* ── TAB: KONSINYASI ───────────────────────────────────────────────── */}
      {tab === "konsinyasi" && (
        <form onSubmit={submitKonsinyasi} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={S.card}>
            <p style={{ fontSize: 12, color: "#5A5045", marginBottom: 16, letterSpacing: 1, textTransform: "uppercase" }}>Info Transaksi</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Grid cols={2}>
                <F label="Supplier Konsinyasi *" addon={<QuickAdd type="counterparty" role="supplier" onCreated={(id, name) => { setSuppliers(s => s.find(x => x.id === id) ? s : [...s, { id, name }]); setKSupp(id); }} />}>
                  <Sel value={kSupp} onChange={setKSupp}>
                    <option value="">— Pilih supplier —</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Sel>
                </F>
                <F label="Pembeli" addon={<QuickAdd type="counterparty" role="buyer" onCreated={(id, name) => { setBuyers(b => b.find(x => x.id === id) ? b : [...b, { id, name }]); setKBuyer(id); }} />}>
                  <Sel value={kBuyer} onChange={setKBuyer}>
                    <option value="">— Tanpa pembeli —</option>
                    {buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </Sel>
                </F>
              </Grid>
              <Grid cols={2}>
                <F label="Tanggal *">
                  <Inp type="date" value={kDate} onChange={setKDate} />
                </F>
                <F label="Catatan">
                  <Inp value={kNotes} onChange={setKNotes} placeholder="Opsional…" />
                </F>
              </Grid>
            </div>
          </div>

          <div style={S.card}>
            <p style={{ fontSize: 12, color: "#5A5045", marginBottom: 16, letterSpacing: 1, textTransform: "uppercase" }}>Detail Unit</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Grid cols={3}>
                <F label="No. Serial">
                  <Inp value={kSerial} onChange={setKSerial} placeholder="Opsional" />
                </F>
                <F label="Cert Code">
                  <Inp value={kCert} onChange={setKCert} placeholder="Opsional" />
                </F>
                <F label="Tahun Cetak">
                  <Inp type="number" value={kYear} onChange={setKYear} placeholder="cth. 2024" />
                </F>
              </Grid>
              <Grid cols={2}>
                <F label="Harga Beli dari Supplier (Rp) *">
                  <Inp type="number" value={kCogs} onChange={setKCogs} placeholder="0" />
                </F>
                <F label="Harga Jual ke Pembeli (Rp) *">
                  <Inp type="number" value={kSell} onChange={setKSell} placeholder="0" />
                </F>
              </Grid>
              <MarginPreview sell={kSell} cogs={kCogs} />
            </div>
          </div>

          <ErrMsg msg={kError} />
          <div><SaveBtn loading={kLoading} /></div>
        </form>
      )}

      {/* ── TAB: SWAP ─────────────────────────────────────────────────────── */}
      {tab === "swap" && (
        <form onSubmit={submitSwap} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={S.card}>
            <p style={{ fontSize: 12, color: "#5A5045", marginBottom: 16, letterSpacing: 1, textTransform: "uppercase" }}>Info Transaksi</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Grid cols={2}>
                <F label="Pembeli" addon={<QuickAdd type="counterparty" role="buyer" onCreated={(id, name) => { setBuyers(b => b.find(x => x.id === id) ? b : [...b, { id, name }]); setSwBuyer(id); }} />}>
                  <Sel value={swBuyer} onChange={setSwBuyer}>
                    <option value="">— Tanpa pembeli —</option>
                    {buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </Sel>
                </F>
                <F label="Tanggal *">
                  <Inp type="date" value={swDate} onChange={setSwDate} />
                </F>
              </Grid>
              <F label="Catatan">
                <Inp value={swNotes} onChange={setSwNotes} placeholder="Opsional…" />
              </F>
            </div>
          </div>

          <div style={S.card}>
            <p style={{ fontSize: 12, color: "#5A5045", marginBottom: 16, letterSpacing: 1, textTransform: "uppercase" }}>Unit yang Di-swap (keluar dari stok)</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <F label="Cari Unit">
                <Inp value={swSearch} onChange={v => { setSwSearch(v); setSwUnitId(""); }}
                  placeholder="Cari serial, brand, cert…" />
              </F>
              <F label="Pilih Unit *">
                <Sel value={swUnitId} onChange={setSwUnitId}>
                  <option value="">— Pilih unit —</option>
                  {swFiltered.map(u => (
                    <option key={u.id} value={u.id}>{unitLabel(u)}</option>
                  ))}
                </Sel>
              </F>
              {swUnit && (
                <div style={{ background: "rgba(201,168,76,.06)", border: "1px solid rgba(201,168,76,.15)", borderRadius: 8, padding: "10px 14px", fontSize: 12, display: "flex", gap: 20, flexWrap: "wrap" }}>
                  <span style={{ color: "#5A5045" }}>Ref Price: <b style={{ color: "var(--gold)" }}>{fmt(swUnit.referencePrice ?? 0)}</b></span>
                  {swUnit.serialNumber && <span style={{ color: "#5A5045" }}>S/N: <b style={{ color: "#9A8E7E" }}>{swUnit.serialNumber}</b></span>}
                  {swUnit.certCode    && <span style={{ color: "#5A5045" }}>Cert: <b style={{ color: "#9A8E7E" }}>{swUnit.certCode}</b></span>}
                  <span style={{ color: "#5A5045" }}>Pemilik: <b style={{ color: "#9A8E7E" }}>{swUnit.owner.name}</b></span>
                </div>
              )}
            </div>
          </div>

          <div style={S.card}>
            <p style={{ fontSize: 12, color: "#5A5045", marginBottom: 16, letterSpacing: 1, textTransform: "uppercase" }}>Harga & Penggantian</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Grid cols={2}>
                <F label="Harga Jual ke Customer (Rp) *">
                  <Inp type="number" value={swSell} onChange={setSwSell} placeholder="0" />
                </F>
                <F label="Estimasi Biaya Beli Pengganti dari Supplier (Rp) *">
                  <Inp type="number" value={swCost} onChange={setSwCost} placeholder="0" />
                </F>
              </Grid>
              <F label="Supplier Penggantian" addon={<QuickAdd type="counterparty" role="supplier" onCreated={(id, name) => { setSuppliers(s => s.find(x => x.id === id) ? s : [...s, { id, name }]); setSwSupp(id); }} />}>
                <Sel value={swSupp} onChange={setSwSupp}>
                  <option value="">— Opsional —</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Sel>
              </F>
              <MarginPreview sell={swSell} cogs={swCost} />
            </div>
          </div>

          {/* Checkbox: catat pengganti sekarang */}
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "4px 0" }}>
            <input
              type="checkbox"
              checked={swRecordNow}
              onChange={e => setSwRecordNow(e.target.checked)}
              style={{ width: 15, height: 15, accentColor: "var(--gold)", cursor: "pointer" }}
            />
            <span style={{ fontSize: 13, color: "#9A8E7E" }}>
              Catat unit pengganti sekarang (sudah tersedia dari supplier)
            </span>
          </label>

          {/* Form unit pengganti */}
          {swRecordNow && (
            <div style={S.card}>
              <p style={{ fontSize: 12, color: "#5A5045", marginBottom: 16, letterSpacing: 1, textTransform: "uppercase" }}>Unit Pengganti dari Supplier</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Grid cols={2}>
                  <F label="Supplier *" addon={<QuickAdd type="counterparty" role="supplier" onCreated={(id, name) => { setSuppliers(s => s.find(x => x.id === id) ? s : [...s, { id, name }]); setSwRepSupp(id); }} />}>
                    <Sel value={swRepSupp} onChange={setSwRepSupp}>
                      <option value="">— Pilih supplier —</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Sel>
                  </F>
                  <F label="Pemilik *" addon={<QuickAdd type="owner" onCreated={(id, name) => { setOwners(o => o.find(x => x.id === id) ? o : [...o, { id, name }]); setSwRepOwner(id); }} />}>
                    <Sel value={swRepOwner} onChange={setSwRepOwner}>
                      <option value="">— Pilih pemilik —</option>
                      {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </Sel>
                  </F>
                </Grid>
                <F label="Produk *">
                  <Sel value={swRepProduct} onChange={setSwRepProduct}>
                    <option value="">— Pilih produk —</option>
                    {products.map(p => <option key={p.id} value={p.id}>{prodLabel(p)}</option>)}
                  </Sel>
                </F>
                <Grid cols={3}>
                  <F label="No. Serial">
                    <Inp value={swRepSerial} onChange={setSwRepSerial} placeholder="Opsional" />
                  </F>
                  <F label="Cert Code">
                    <Inp value={swRepCert} onChange={setSwRepCert} placeholder="Opsional" />
                  </F>
                  <F label="Tahun Cetak">
                    <Inp type="number" value={swRepYear} onChange={setSwRepYear} placeholder="cth. 2024" />
                  </F>
                </Grid>
                <Grid cols={2}>
                  <F label="Kondisi *">
                    <Sel value={swRepCondition} onChange={v => setSwRepCondition(v as "new" | "used")}>
                      <option value="new">Baru</option>
                      <option value="used">Bekas</option>
                    </Sel>
                  </F>
                  <F label="Harga Beli dari Supplier (Rp) *">
                    <Inp type="number" value={swRepPrice} onChange={setSwRepPrice} placeholder="0" />
                  </F>
                </Grid>
                <p style={{ fontSize: 12, color: "#4A3E2E", fontStyle: "italic" }}>
                  Ref price unit pengganti diwarisi otomatis dari unit yang di-swap.
                </p>
              </div>
            </div>
          )}

          {/* Success state */}
          {swSuccess ? (
            <div style={{ background: "rgba(76,175,80,.07)", border: "1px solid rgba(76,175,80,.25)", borderRadius: 10, padding: "18px 20px" }}>
              <p style={{ fontSize: 14, color: "#4CAF50", marginBottom: 6 }}>✓ Transaksi swap berhasil dicatat</p>
              <p style={{ fontSize: 13, color: "#7A6E5F", marginBottom: 14 }}>
                Unit pengganti belum dicatat — pastikan dicatat sebelum unit hilang dari tracking.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a href="/admin/transactions/outstanding-swaps" style={{
                  height: 36, padding: "0 18px", display: "inline-flex", alignItems: "center",
                  borderRadius: 8, fontSize: 13, textDecoration: "none",
                  border: "1px solid rgba(201,168,76,.4)", background: "rgba(201,168,76,.12)", color: "var(--gold)",
                }}>
                  Lihat Outstanding Swaps →
                </a>
                <button type="button"
                  onClick={() => { setSwSuccess(false); setSwUnitId(""); setSwSearch(""); setSwSell(""); setSwCost(""); setSwBuyer(""); setSwSupp(""); setSwNotes(""); }}
                  style={{
                    height: 36, padding: "0 18px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                    border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "#7A6E5F",
                    fontFamily: "var(--font-dm-sans), sans-serif",
                  }}>
                  Catat Transaksi Baru
                </button>
              </div>
            </div>
          ) : (
            <>
              <ErrMsg msg={swError} />
              <div><SaveBtn loading={swLoading} /></div>
            </>
          )}
        </form>
      )}

      <style>{`
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.4); cursor: pointer; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.3; }
        select option { background: #1E1A14; color: #EDE8DE; }
      `}</style>
    </div>
  );
}
