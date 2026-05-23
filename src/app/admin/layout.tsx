import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import type { User } from "next-auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/login");
  }

  return (
    <AdminShell user={session.user as User | undefined}>
      {children}
    </AdminShell>
  );
}
