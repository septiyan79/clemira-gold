"use client";

import { useState, useTransition, useRef } from "react";
import { updateProduct, deleteProduct } from "./actions";

export type ProductRow = {
  id:         string;
  sku:        string;
  name:       string;
  brand:      string | null;
  weightGram: number;
  purity:     string;
  series:     string | null;
  stat: { available: number; sold: number; swapped: number; total: number };
};

const thStyle: React.CSSProperties = {
  padding: "10px 14px", fontSize: 10, letterSpacing: 1.5, color: "#5A5045",
  textTransform: "uppercase", textAlign: "left", fontWeight: 500,
  borderBottom: "1px solid rgba(201,168,76,.2)", whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  padding: "12px 14px", color: "#9A8E7E", whiteSpace: "nowrap",
  borderBottom: "1px solid rgba(255,255,255,.04)",
};
const cellInput: React.CSSProperties = {
  width: "100%", minWidth: 80,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(201,168,76,.3)",
  borderRadius: 6, padding: "5px 8px",
  color: "#EDE8DE", fontSize: 12,
  outline: "none", boxSizing: "border-box",
};
const actionBtn = (variant: "edit" | "delete" | "save" | "cancel" | "confirm"): React.CSSProperties => ({
  padding: "4px 10px", borderRadius: 6, fontSize: 11,
  cursor: "pointer", fontWeight: 500, border: "1px solid",
  ...(variant === "edit"    && { color: "#C9A84C", borderColor: "rgba(201,168,76,.3)", background: "rgba(201,168,76,.08)" }),
  ...(variant === "delete"  && { color: "#EF5350", borderColor: "rgba(239,83,80,.25)", background: "rgba(239,83,80,.06)" }),
  ...(variant === "save"    && { color: "#4CAF50", borderColor: "rgba(76,175,80,.3)",  background: "rgba(76,175,80,.08)"  }),
  ...(variant === "cancel"  && { color: "#5A5045", borderColor: "rgba(255,255,255,.08)", background: "transparent" }),
  ...(variant === "confirm" && { color: "#EF5350", borderColor: "rgba(239,83,80,.4)", background: "rgba(239,83,80,.12)" }),
});

const BRAND_OPTIONS  = ["antam", "ubs", "galeri24", "lotus"];
const SERIES_OPTIONS = ["regular", "gift", "batik", "seri khusus"];

export default function ProductTable({ products }: { products: ProductRow[] }) {
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rowError,   setRowError]   = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement | null>(null);

  function startEdit(id: string) {
    setEditingId(id);
    setDeletingId(null);
    setRowError(e => ({ ...e, [id]: "" }));
  }
  function cancelEdit() {
    setEditingId(null);
    setRowError({});
  }
  function startDelete(id: string) {
    setDeletingId(id);
    setEditingId(null);
    setRowError(e => ({ ...e, [id]: "" }));
  }
  function cancelDelete() {
    setDeletingId(null);
    setRowError({});
  }

  function handleUpdate(id: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateProduct(id, fd);
      if ("error" in res) {
        setRowError(prev => ({ ...prev, [id]: res.error }));
      } else {
        setEditingId(null);
        setRowError({});
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteProduct(id);
      if ("error" in res) {
        setRowError(prev => ({ ...prev, [id]: res.error }));
        setDeletingId(null);
      } else {
        setDeletingId(null);
        setRowError({});
      }
    });
  }

  if (products.length === 0) {
    return (
      <div style={{ padding: "48px 20px", textAlign: "center" }}>
        <p style={{ fontSize: 32, marginBottom: 12 }}>◈</p>
        <p style={{ fontSize: 15, color: "#5A5045" }}>Belum ada produk terdaftar</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {[
              { label: "SKU",        align: "left"  },
              { label: "Nama",       align: "left"  },
              { label: "Brand",      align: "left"  },
              { label: "Gramasi",    align: "right" },
              { label: "Purity",     align: "left"  },
              { label: "Series",     align: "left"  },
              { label: "Tersedia",   align: "right" },
              { label: "Terjual",    align: "right" },
              { label: "Total Unit", align: "right" },
              { label: "",           align: "right" },
            ].map(({ label, align }, i) => (
              <th key={i} style={{ ...thStyle, textAlign: align as React.CSSProperties["textAlign"] }}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const isEditing  = editingId  === p.id;
            const isDeleting = deletingId === p.id;
            const err        = rowError[p.id];

            if (isEditing) {
              return (
                <>
                  <tr key={p.id} style={{ background: "rgba(201,168,76,.03)" }}>
                    <td colSpan={10} style={{ padding: 0 }}>
                      <form
                        ref={formRef}
                        onSubmit={(e) => handleUpdate(p.id, e)}
                        style={{ display: "contents" }}
                      >
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <tbody>
                            <tr>
                              <td style={{ ...tdStyle, width: 110 }}>
                                <input name="sku" defaultValue={p.sku} required style={cellInput} />
                              </td>
                              <td style={{ ...tdStyle, minWidth: 180 }}>
                                <input name="name" defaultValue={p.name} required style={cellInput} />
                              </td>
                              <td style={{ ...tdStyle, width: 100 }}>
                                <input name="brand" defaultValue={p.brand ?? ""} list="edit-brand-opts" style={cellInput} placeholder="—" />
                                <datalist id="edit-brand-opts">
                                  {BRAND_OPTIONS.map(b => <option key={b} value={b} />)}
                                </datalist>
                              </td>
                              <td style={{ ...tdStyle, width: 90, textAlign: "right" }}>
                                <input name="weightGram" type="number" step="0.001" min="0.001"
                                  defaultValue={p.weightGram} required style={{ ...cellInput, textAlign: "right" }} />
                              </td>
                              <td style={{ ...tdStyle, width: 80 }}>
                                <input name="purity" defaultValue={p.purity} style={cellInput} />
                              </td>
                              <td style={{ ...tdStyle, width: 110 }}>
                                <input name="series" defaultValue={p.series ?? ""} list="edit-series-opts" style={cellInput} placeholder="—" />
                                <datalist id="edit-series-opts">
                                  {SERIES_OPTIONS.map(s => <option key={s} value={s} />)}
                                </datalist>
                              </td>
                              <td style={{ ...tdStyle, textAlign: "right" }}>{p.stat.available}</td>
                              <td style={{ ...tdStyle, textAlign: "right" }}>{p.stat.sold}</td>
                              <td style={{ ...tdStyle, textAlign: "right" }}>{p.stat.total}</td>
                              <td style={{ ...tdStyle, textAlign: "right" }}>
                                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                  <button type="submit" disabled={isPending} style={actionBtn("save")}>
                                    {isPending ? "…" : "Simpan"}
                                  </button>
                                  <button type="button" onClick={cancelEdit} style={actionBtn("cancel")}>
                                    Batal
                                  </button>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </form>
                    </td>
                  </tr>
                  {err && (
                    <tr key={`${p.id}-err`}>
                      <td colSpan={10} style={{
                        padding: "6px 14px 10px",
                        fontSize: 12, color: "#EF5350",
                        borderBottom: "1px solid rgba(255,255,255,.04)",
                        background: "rgba(239,83,80,.04)",
                      }}>
                        {err}
                      </td>
                    </tr>
                  )}
                </>
              );
            }

            return (
              <>
                <tr
                  key={p.id}
                  className="adm-tr-hover"
                  style={isDeleting ? { background: "rgba(239,83,80,.04)" } : undefined}
                >
                  <td style={tdStyle}>
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: "#5A5045" }}>{p.sku}</span>
                  </td>
                  <td style={{ ...tdStyle, color: "#EDE8DE", fontWeight: 500, maxWidth: 200 }}>{p.name}</td>
                  <td style={{ ...tdStyle, color: "var(--gold)", fontWeight: 500, textTransform: "capitalize" }}>
                    {p.brand ?? <span style={{ color: "#3A342A" }}>—</span>}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right", color: "#EDE8DE" }}>
                    {p.weightGram % 1 === 0 ? p.weightGram : p.weightGram.toFixed(1)} gr
                  </td>
                  <td style={tdStyle}>
                    <span style={{ padding: "1px 7px", borderRadius: 4, fontSize: 11, background: "rgba(201,168,76,.08)", color: "#C9A84C" }}>
                      {p.purity}
                    </span>
                  </td>
                  <td style={tdStyle}>{p.series ?? <span style={{ color: "#3A342A" }}>—</span>}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    {p.stat.available > 0
                      ? <span style={{ color: "#4CAF50", fontWeight: 500 }}>{p.stat.available}</span>
                      : <span style={{ color: "#3A342A" }}>0</span>}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    {p.stat.sold > 0
                      ? <span style={{ color: "#9A8E7E" }}>{p.stat.sold}</span>
                      : <span style={{ color: "#3A342A" }}>0</span>}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right", color: "#EDE8DE", fontWeight: 500 }}>
                    {p.stat.total}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    {isDeleting ? (
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "#EF5350" }}>Hapus?</span>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={isPending}
                          style={actionBtn("confirm")}
                        >
                          {isPending ? "…" : "Ya"}
                        </button>
                        <button onClick={cancelDelete} style={actionBtn("cancel")}>Tidak</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button onClick={() => startEdit(p.id)} style={actionBtn("edit")}>Edit</button>
                        <button onClick={() => startDelete(p.id)} style={actionBtn("delete")}>Hapus</button>
                      </div>
                    )}
                  </td>
                </tr>
                {err && !isDeleting && (
                  <tr key={`${p.id}-err`}>
                    <td colSpan={10} style={{
                      padding: "6px 14px 10px",
                      fontSize: 12, color: "#EF5350",
                      borderBottom: "1px solid rgba(255,255,255,.04)",
                      background: "rgba(239,83,80,.04)",
                    }}>
                      {err}
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
