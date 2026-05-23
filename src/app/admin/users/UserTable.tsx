"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUser, updateUser, deleteUser } from "./actions";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  membership: string;
  createdAt: Date;
};

type ModalMode = "create" | "edit" | null;

const ROLES = ["user", "admin"];
const MEMBERSHIPS = ["free", "premium"];

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function UserTable({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [modal, setModal]             = useState<ModalMode>(null);
  const [editTarget, setEditTarget]   = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [error, setError]             = useState("");
  const [isPending, startTransition]  = useTransition();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user", membership: "free" });

  function openCreate() {
    setForm({ name: "", email: "", password: "", role: "user", membership: "free" });
    setError("");
    setModal("create");
  }

  function openEdit(u: UserRow) {
    setForm({ name: u.name ?? "", email: u.email, password: "", role: u.role, membership: u.membership });
    setEditTarget(u);
    setError("");
    setModal("edit");
  }

  function closeModal() { setModal(null); setEditTarget(null); }

  function handleSubmit() {
    setError("");
    startTransition(async () => {
      if (modal === "create") {
        if (!form.email || !form.password) { setError("Email dan password wajib diisi"); return; }
        const res = await createUser(form);
        if (res.error) { setError(res.error); return; }
      } else if (modal === "edit" && editTarget) {
        const res = await updateUser(editTarget.id, form);
        if (res.error) { setError(res.error); return; }
      }
      closeModal();
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteUser(deleteTarget.id);
      if (res.error) alert(res.error);
      setDeleteTarget(null);
      router.refresh();
    });
  }

  const field = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value })),
  });

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <p style={{ fontSize: 13, color: "#5A5045" }}>{users.length} pengguna terdaftar</p>
        <button onClick={openCreate} style={{
          background: "rgba(201,168,76,.12)", border: "1px solid rgba(201,168,76,.3)",
          color: "var(--gold)", borderRadius: 8, padding: "8px 18px",
          fontSize: 13, cursor: "pointer", transition: "all .2s",
        }}>+ Tambah User</button>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 560 }}>
          <thead>
            <tr>
              {["Nama", "Email", "Role", "Membership", "Bergabung", "Aksi"].map(h => (
                <th key={h} style={{ padding: "10px 14px", fontSize: 10, letterSpacing: 1.5, color: "#5A5045", textTransform: "uppercase", textAlign: "left", borderBottom: "1px solid rgba(201,168,76,.2)", fontWeight: 500, whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,.04)", transition: "background .15s" }}
                onMouseOver={e => (e.currentTarget.style.background = "rgba(201,168,76,.02)")}
                onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
                <td style={{ padding: "12px 14px", color: "#EDE8DE" }}>
                  {u.name ?? <span style={{ color: "#3A342A" }}>—</span>}
                </td>
                <td style={{ padding: "12px 14px", color: "#7A6E5F" }}>{u.email}</td>
                <td style={{ padding: "12px 14px" }}>
                  <Badge color={u.role === "admin" ? "gold" : "muted"}>{u.role}</Badge>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <Badge color={u.membership === "premium" ? "green" : "muted"}>{u.membership}</Badge>
                </td>
                <td style={{ padding: "12px 14px", color: "#5A5045", whiteSpace: "nowrap" }}>{fmtDate(u.createdAt)}</td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn onClick={() => openEdit(u)}>Edit</Btn>
                    <Btn danger onClick={() => setDeleteTarget(u)}>Hapus</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {modal && (
        <Overlay>
          <ModalBox>
            <h2 className="fd" style={{ fontSize: "1.25rem", fontWeight: 400, color: "#EDE8DE", marginBottom: 24 }}>
              {modal === "create" ? "Tambah User" : "Edit User"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <FormField label="Nama">
                <input className="um-in" placeholder="Nama lengkap" {...field("name")} />
              </FormField>
              <FormField label="Email">
                <input className="um-in" type="email" placeholder="email@example.com" {...field("email")}
                  readOnly={modal === "edit"} style={modal === "edit" ? { opacity: 0.5 } : {}} />
              </FormField>
              <FormField label={modal === "create" ? "Password" : "Password Baru (opsional)"}>
                <input className="um-in" type="password"
                  placeholder={modal === "edit" ? "Kosongkan jika tidak diubah" : "Minimal 6 karakter"}
                  {...field("password")} />
              </FormField>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <FormField label="Role">
                  <select className="um-in" {...field("role")}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </FormField>
                <FormField label="Membership">
                  <select className="um-in" {...field("membership")}>
                    {MEMBERSHIPS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </FormField>
              </div>
            </div>

            {error && <p style={{ color: "#EF5350", fontSize: 13, marginTop: 12 }}>{error}</p>}

            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <Btn onClick={closeModal}>Batal</Btn>
              <button onClick={handleSubmit} disabled={isPending} style={{
                padding: "8px 22px", fontSize: 13, color: "#1A1200", background: "var(--gold)",
                border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600,
                opacity: isPending ? 0.6 : 1, fontFamily: "var(--font-dm-sans), sans-serif",
              }}>
                {isPending ? "Menyimpan…" : "Simpan"}
              </button>
            </div>
          </ModalBox>
        </Overlay>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <Overlay>
          <ModalBox style={{ maxWidth: 380, borderColor: "rgba(239,83,80,.25)" }}>
            <h2 className="fd" style={{ fontSize: "1.2rem", fontWeight: 400, color: "#EDE8DE", marginBottom: 10 }}>
              Hapus User?
            </h2>
            <p style={{ fontSize: 14, color: "#7A6E5F", marginBottom: 24 }}>
              Akun <span style={{ color: "#EDE8DE" }}>{deleteTarget.name ?? deleteTarget.email}</span> akan dihapus permanen.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn onClick={() => setDeleteTarget(null)}>Batal</Btn>
              <button onClick={handleDelete} disabled={isPending} style={{
                padding: "8px 22px", fontSize: 13, color: "#fff", background: "#EF5350",
                border: "none", borderRadius: 8, cursor: "pointer",
                opacity: isPending ? 0.6 : 1, fontFamily: "var(--font-dm-sans), sans-serif",
              }}>
                {isPending ? "Menghapus…" : "Ya, Hapus"}
              </button>
            </div>
          </ModalBox>
        </Overlay>
      )}

      <style>{`
        .um-in{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:10px 14px;color:#EDE8DE;font-size:14px;outline:none;box-sizing:border-box;font-family:var(--font-dm-sans),sans-serif}
        .um-in:focus{border-color:rgba(201,168,76,.5)}
        .um-in[readonly]{cursor:default}
        .um-in option{background:#1E1A14;color:#EDE8DE}
      `}</style>
    </>
  );
}

/* ── tiny shared primitives ── */

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      {children}
    </div>
  );
}

function ModalBox({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#1A1612", border: "1px solid rgba(201,168,76,.2)", borderRadius: 16, padding: 28, width: "100%", maxWidth: 440, ...style }}>
      {children}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 11, letterSpacing: 1.2, color: "#5A5045", textTransform: "uppercase", display: "block", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: "gold" | "green" | "muted" }) {
  const styles = {
    gold:  { color: "var(--gold)",  background: "rgba(201,168,76,.12)", border: "1px solid rgba(201,168,76,.3)" },
    green: { color: "#4CAF50",      background: "rgba(76,175,80,.1)",   border: "1px solid rgba(76,175,80,.25)" },
    muted: { color: "#5A5045",      background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)" },
  };
  return <span style={{ ...styles[color], borderRadius: 20, padding: "3px 10px", fontSize: 12 }}>{children}</span>;
}

function Btn({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 12, borderRadius: 6, padding: "5px 14px", cursor: "pointer", transition: "all .2s",
      color: danger ? "#EF5350" : "#7A6E5F",
      background: danger ? "rgba(239,83,80,.06)" : "rgba(255,255,255,.04)",
      border: danger ? "1px solid rgba(239,83,80,.2)" : "1px solid rgba(255,255,255,.08)",
      fontFamily: "var(--font-dm-sans), sans-serif",
    }}>
      {children}
    </button>
  );
}
