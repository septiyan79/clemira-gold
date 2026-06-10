import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChangePasswordForm from "./ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
    membership?: string;
  };

  const roleBadge = user.role === "admin" ? "Admin" : "User";
  const memberBadge = user.membership === "premium" ? "Premium" : "Free";

  return (
    <div style={{ maxWidth: "640px" }}>
      <div style={{ marginBottom: "32px" }}>
        <p className="section-label" style={{ marginBottom: "4px" }}>Akun Saya</p>
        <h1 className="fd" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--text)", margin: 0 }}>
          Profil &amp; Keamanan
        </h1>
      </div>

      {/* Info section */}
      <div style={{
        background: "rgba(201,168,76,.05)",
        border: "1px solid rgba(201,168,76,.15)",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "24px",
      }}>
        <h2 style={{ fontSize: "13px", letterSpacing: "1.5px", color: "var(--muted)", textTransform: "uppercase", margin: "0 0 20px" }}>
          Informasi Akun
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[
            { label: "Nama", value: user.name ?? "—" },
            { label: "Email", value: user.email ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", gap: "16px", alignItems: "baseline" }}>
              <span style={{ fontSize: "12px", color: "var(--muted)", minWidth: "80px" }}>{label}</span>
              <span style={{ fontSize: "14px", color: "var(--text)" }}>{value}</span>
            </div>
          ))}

          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--muted)", minWidth: "80px" }}>Role</span>
            <span style={{
              fontSize: "11px", fontWeight: 600, letterSpacing: ".5px",
              padding: "3px 10px", borderRadius: "20px",
              background: user.role === "admin" ? "rgba(201,168,76,.15)" : "rgba(255,255,255,.06)",
              color: user.role === "admin" ? "var(--gold)" : "var(--muted)",
            }}>
              {roleBadge}
            </span>
          </div>

          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--muted)", minWidth: "80px" }}>Membership</span>
            <span style={{
              fontSize: "11px", fontWeight: 600, letterSpacing: ".5px",
              padding: "3px 10px", borderRadius: "20px",
              background: user.membership === "premium" ? "rgba(201,168,76,.2)" : "rgba(255,255,255,.06)",
              color: user.membership === "premium" ? "var(--gold)" : "var(--muted)",
            }}>
              {memberBadge}
            </span>
          </div>
        </div>
      </div>

      {/* Change password section */}
      <div style={{
        background: "rgba(201,168,76,.05)",
        border: "1px solid rgba(201,168,76,.15)",
        borderRadius: "12px",
        padding: "24px",
      }}>
        <h2 style={{ fontSize: "13px", letterSpacing: "1.5px", color: "var(--muted)", textTransform: "uppercase", margin: "0 0 20px" }}>
          Ganti Password
        </h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
