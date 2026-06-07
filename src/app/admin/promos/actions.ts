"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type PromoRow = {
  id: string;
  nama: string;
  gramasi: string;
  badgeType: string;
  hargaJual: number;
  stok: number;
  kondisi: string | null;
  deskripsi: string | null;
  tags: string[];
};

type ActionResult = { error: string } | { success: true };

function getToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function cleanupOldPromos(): Promise<void> {
  await prisma.dailyPromo.deleteMany({
    where: { tanggal: { lt: getToday() } },
  });
}

export async function createPromo(formData: FormData): Promise<ActionResult> {
  const nama = (formData.get("nama") as string)?.trim();
  const gramasi = formData.get("gramasi") as string;
  const badgeType = formData.get("badgeType") as string;
  const hargaJualStr = (formData.get("hargaJual") as string)?.replace(/\./g, "").replace(",", ".");
  const stokStr = formData.get("stok") as string;
  const kondisi = (formData.get("kondisi") as string)?.trim() || null;
  const deskripsi = (formData.get("deskripsi") as string)?.trim() || null;
  const tagsRaw = (formData.get("tags") as string)?.trim() || "";
  const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : [];

  const hargaJual = parseFloat(hargaJualStr);
  const stok = Math.max(1, parseInt(stokStr) || 1);

  if (!nama || !gramasi || !badgeType || isNaN(hargaJual) || hargaJual <= 0) {
    return { error: "Nama, gramasi, badge, dan harga jual wajib diisi" };
  }

  await prisma.dailyPromo.create({
    data: {
      tanggal: getToday(),
      nama,
      gramasi,
      badgeType,
      hargaJual,
      stok,
      ...(kondisi ? { kondisi } : {}),
      ...(deskripsi ? { deskripsi } : {}),
      tags,
    },
  });

  revalidatePath("/admin/promos");
  revalidatePath("/sale");
  return { success: true };
}

export async function deletePromo(id: string): Promise<void> {
  await prisma.dailyPromo.delete({ where: { id } });
  revalidatePath("/admin/promos");
  revalidatePath("/sale");
}
