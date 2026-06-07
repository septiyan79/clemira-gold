import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import type { User } from "next-auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/login");
  }

  const outstandingSwapCount = await prisma.swapEvent.count({ where: { replacementUnitId: null } });

  return (
    <AdminShell user={session.user as User | undefined} outstandingSwapCount={outstandingSwapCount}>
      {children}
    </AdminShell>
  );
}
