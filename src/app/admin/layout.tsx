import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/Sidebar";
import AdminHeader from "@/components/admin/Header";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/login");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--dark)" }}>
      <AdminSidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <AdminHeader user={session.user} />
        <main style={{ flex: 1, padding: "28px", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
