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

export type PromoInput = {
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
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000); // UTC+7 WIB
  return new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()));
}

export async function cleanupOldPromos(): Promise<void> {
  await prisma.dailyPromo.deleteMany({
    where: { tanggal: { lt: getToday() } },
  });
}

export async function createPromos(items: PromoInput[]): Promise<ActionResult> {
  if (items.length === 0) return { error: "Tidak ada item untuk disimpan" };

  const today = getToday();

  await prisma.$transaction(
    items.map(item =>
      prisma.dailyPromo.create({
        data: {
          tanggal: today,
          nama: item.nama,
          gramasi: item.gramasi,
          badgeType: item.badgeType,
          hargaJual: item.hargaJual,
          stok: item.stok,
          kondisi: item.kondisi,
          deskripsi: item.deskripsi,
          tags: item.tags,
        },
      })
    )
  );

  revalidatePath("/admin/promos");
  revalidatePath("/sale");
  return { success: true };
}

export async function updatePromo(id: string, formData: FormData): Promise<ActionResult> {
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

  await prisma.dailyPromo.update({
    where: { id },
    data: { nama, gramasi, badgeType, hargaJual, stok, kondisi, deskripsi, tags },
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
