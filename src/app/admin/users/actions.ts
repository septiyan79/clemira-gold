"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function requireAdmin() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "admin") throw new Error("Unauthorized");
  return session!;
}

export async function createUser(data: {
  name: string; email: string; password: string; role: string; membership: string;
}): Promise<{ error?: string }> {
  try {
    await requireAdmin();
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return { error: "Email sudah terdaftar" };
    const hashed = await bcrypt.hash(data.password, 10);
    await prisma.user.create({
      data: { name: data.name || null, email: data.email, password: hashed, role: data.role, membership: data.membership },
    });
    revalidatePath("/admin/users");
    return {};
  } catch (e) {
    return { error: String(e) };
  }
}

export async function updateUser(
  id: string,
  data: { name: string; role: string; membership: string; password?: string }
): Promise<{ error?: string }> {
  try {
    await requireAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: Record<string, any> = { name: data.name || null, role: data.role, membership: data.membership };
    if (data.password) update.password = await bcrypt.hash(data.password, 10);
    await prisma.user.update({ where: { id }, data: update });
    revalidatePath("/admin/users");
    return {};
  } catch (e) {
    return { error: String(e) };
  }
}

export async function deleteUser(id: string): Promise<{ error?: string }> {
  try {
    const session = await requireAdmin();
    if ((session.user as { id?: string }).id === id) return { error: "Tidak dapat menghapus akun sendiri" };
    await prisma.user.delete({ where: { id } });
    revalidatePath("/admin/users");
    return {};
  } catch (e) {
    return { error: String(e) };
  }
}
