import { prisma } from "@/lib/prisma";
import UserTable from "./UserTable";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, membership: true, createdAt: true },
  });

  return (
    <div>
      <p className="section-label" style={{ marginBottom: 8 }}>User</p>
      <h1 className="fd" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--text)", marginBottom: 28 }}>
        User Management
      </h1>
      <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, padding: "28px 24px" }}>
        <UserTable users={users} />
      </div>
    </div>
  );
}
