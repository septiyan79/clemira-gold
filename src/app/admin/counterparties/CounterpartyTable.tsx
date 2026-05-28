"use client";

import { useState } from "react";

type CP = { id: string; name: string; type: string[]; phone: string | null; notes: string | null };

const ROLE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  buyer:    { label: "Buyer",    color: "#C9A84C", bg: "rgba(201,168,76,.12)"  },
  supplier: { label: "Supplier", color: "#64B5F6", bg: "rgba(100,181,246,.12)" },
};

const VALID_ROLES = ["buyer", "supplier"];

const S = {
  inp: {
    height: 38, width: "100%", background: "rgba(255,255,255,.04)", color: "#EDE8DE",
    border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "0 12px",
    fontSize: 13, outline: "none", fontFamily: "var(--font-dm-sans), sans-serif",
    boxSizing: "border-box",
  } as React.CSSProperties,
  lbl: {
    display: "block", fontSize: 11, color: "#5A5045", letterSpacing: "1px",
    textTransform: "uppercase", marginBottom: 5,
  } as React.CSSProperties,
};

const thStyle: React.CSSProperties = {
  padding: "10px 14px", fontSize: 10, letterSpacing: 1.5, color: "#5A5045",
  textTransform: "uppercase", textAlign: "left", fontWeight: 500,
  borderBottom: "1px solid rgba(201,168,76,.2)", whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  padding: "12px 14px", color: "#9A8E7E",
  borderBottom: "1px solid rgba(255,255,255,.04)", verticalAlign: "middle",
};

// ── Modal (shared for create & edit) ─────────────────────────────────────────
function CPModal({
  title, initial, onSave, onClose, saving, err,
}: {
  title: string;
  initial: Partial<CP>;
  onSave: (data: Omit<CP, "id">) => void;
  onClose: () => void;
  saving: boolean;
  err: string;
}) {
  const [name,  setName]  = useState(initial.name  ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [roles, setRoles] = useState<string[]>(initial.type ?? []);
  const [localErr, setLocalErr] = useState("");

  function toggleRole(r: string) {
    setRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  }

  function handleSave() {
    if (!name.trim())    { setLocalErr("Nama wajib diisi"); return; }
    if (roles.length === 0) { setLocalErr("Pilih minimal satu role"); return; }
    setLocalErr("");
    onSave({ name: name.trim(), type: roles, phone: phone.trim() || null, notes: notes.trim() || null });
  }

  const displayErr = localErr || err;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#1E1A14", border: "1px solid rgba(255,255,255,.1)",
        borderRadius: 16, padding: 28, width: "100%", maxWidth: 420,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 className="fd" style={{ fontSize: "1.1rem", fontWeight: 400, color: "var(--text)", margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#5A5045", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={S.lbl}>Nama *</label>
            <input value={name} onChange={e => setName(e.target.value)} style={S.inp}
              placeholder="Nama counterparty"
              onKeyDown={e => e.key === "Enter" && handleSave()} autoFocus />
          </div>

          <div>
            <label style={S.lbl}>Role *</label>
            <div style={{ display: "flex", gap: 10 }}>
              {VALID_ROLES.map(r => {
                const cfg     = ROLE_CFG[r];
                const checked = roles.includes(r);
                return (
                  <label key={r} style={{
                    display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
                    padding: "7px 14px", borderRadius: 8,
                    border: `1px solid ${checked ? cfg.color + "55" : "rgba(255,255,255,.08)"}`,
                    background: checked ? cfg.bg : "transparent",
                    transition: "all .15s",
                  }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleRole(r)}
                      style={{ accentColor: cfg.color, cursor: "pointer" }} />
                    <span style={{ fontSize: 13, color: checked ? cfg.color : "#5A5045" }}>{cfg.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label style={S.lbl}>No. HP</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} style={S.inp} placeholder="Opsional" />
          </div>

          <div>
            <label style={S.lbl}>Catatan</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Opsional" rows={2}
              style={{ ...S.inp, height: "auto", padding: "8px 12px", resize: "vertical" }} />
          </div>
        </div>

        {displayErr && (
          <div style={{ marginTop: 14, fontSize: 12, color: "#EF5350",
            background: "rgba(239,83,80,.08)", border: "1px solid rgba(239,83,80,.2)",
            borderRadius: 6, padding: "8px 12px" }}>
            {displayErr}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={handleSave} disabled={saving} style={{
            height: 38, padding: "0 24px", borderRadius: 8, fontSize: 13, cursor: saving ? "default" : "pointer",
            border: "1px solid rgba(201,168,76,.4)", background: "rgba(201,168,76,.12)", color: "var(--gold)",
            fontFamily: "var(--font-dm-sans), sans-serif", opacity: saving ? 0.6 : 1, transition: "all .2s",
          }}>
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
          <button onClick={onClose} style={{
            height: 38, padding: "0 18px", borderRadius: 8, fontSize: 13, cursor: "pointer",
            border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "#7A6E5F",
            fontFamily: "var(--font-dm-sans), sans-serif",
          }}>
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main table component ──────────────────────────────────────────────────────
export default function CounterpartyTable({ initial }: { initial: CP[] }) {
  const [list,    setList]    = useState<CP[]>(initial);
  const [mode,    setMode]    = useState<"edit" | "create" | null>(null);
  const [target,  setTarget]  = useState<CP | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [apiErr,  setApiErr]  = useState("");
  const [search,  setSearch]  = useState("");

  const filtered = search.trim()
    ? list.filter(cp => cp.name.toLowerCase().includes(search.toLowerCase()))
    : list;

  function openEdit(cp: CP) { setTarget(cp); setMode("edit"); setApiErr(""); }
  function openCreate()     { setTarget(null); setMode("create"); setApiErr(""); }
  function closeModal()     { setMode(null); setTarget(null); }

  async function handleSave(data: Omit<CP, "id">) {
    setSaving(true); setApiErr("");

    if (mode === "create") {
      const res = await fetch("/api/stock/counterparties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setSaving(false);
      if (res.ok) {
        const created: CP = await res.json();
        setList(l => [...l, created].sort((a, b) => a.name.localeCompare(b.name)));
        closeModal();
      } else {
        const d = await res.json();
        setApiErr(d.error ?? "Gagal membuat counterparty");
      }
    } else if (mode === "edit" && target) {
      const res = await fetch(`/api/stock/counterparties/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setSaving(false);
      if (res.ok) {
        const updated: CP = await res.json();
        setList(l => l.map(x => x.id === updated.id ? updated : x));
        closeModal();
      } else {
        const d = await res.json();
        setApiErr(d.error ?? "Gagal menyimpan perubahan");
      }
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama…"
          style={{
            height: 36, flex: 1, minWidth: 200, background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.1)", borderRadius: 8,
            padding: "0 12px", fontSize: 13, color: "#EDE8DE", outline: "none",
            fontFamily: "var(--font-dm-sans), sans-serif",
          }}
        />
        <button onClick={openCreate} style={{
          height: 36, padding: "0 18px", borderRadius: 8, fontSize: 13, cursor: "pointer",
          border: "1px solid rgba(201,168,76,.4)", background: "rgba(201,168,76,.12)", color: "var(--gold)",
          fontFamily: "var(--font-dm-sans), sans-serif", whiteSpace: "nowrap",
        }}>
          + Tambah Counterparty
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ padding: "48px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#5A5045" }}>
            {search ? `Tidak ada hasil untuk "${search}"` : "Belum ada counterparty"}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Nama", "Role", "No. HP", "Catatan", ""].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(cp => (
                <tr key={cp.id} className="adm-tr-hover">
                  <td style={{ ...tdStyle, color: "#EDE8DE", fontWeight: 500 }}>{cp.name}</td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: 5 }}>
                      {cp.type.map(r => {
                        const cfg = ROLE_CFG[r] ?? { label: r, color: "#9A8E7E", bg: "transparent" };
                        return (
                          <span key={r} style={{
                            fontSize: 11, padding: "2px 8px", borderRadius: 4,
                            color: cfg.color, background: cfg.bg, fontWeight: 500,
                          }}>
                            {cfg.label}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td style={tdStyle}>{cp.phone ?? <span style={{ color: "#3A342A" }}>—</span>}</td>
                  <td style={{ ...tdStyle, maxWidth: 200, whiteSpace: "normal", color: "#5A5045", fontSize: 12 }}>
                    {cp.notes ?? <span style={{ color: "#3A342A" }}>—</span>}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <button onClick={() => openEdit(cp)} style={{
                      fontSize: 12, padding: "4px 12px", borderRadius: 6, cursor: "pointer",
                      border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "#7A6E5F",
                      fontFamily: "var(--font-dm-sans), sans-serif", transition: "all .15s",
                    }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {mode && (
        <CPModal
          title={mode === "create" ? "Tambah Counterparty" : `Edit — ${target?.name}`}
          initial={target ?? {}}
          onSave={handleSave}
          onClose={closeModal}
          saving={saving}
          err={apiErr}
        />
      )}
    </>
  );
}
