"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string } | { success: true };

export async function createProduct(formData: FormData): Promise<ActionResult> {
  const sku        = (formData.get("sku")        as string ?? "").trim();
  const name       = (formData.get("name")       as string ?? "").trim();
  const weightRaw  = (formData.get("weightGram") as string ?? "").trim();
  const purity     = (formData.get("purity")     as string ?? "999.9").trim() || "999.9";
  const brand      = (formData.get("brand")      as string ?? "").trim() || null;
  const series     = (formData.get("series")     as string ?? "").trim() || null;

  if (!sku)   return { error: "SKU wajib diisi" };
  if (!name)  return { error: "Nama produk wajib diisi" };

  const weightGram = parseFloat(weightRaw);
  if (isNaN(weightGram) || weightGram <= 0) return { error: "Gramasi harus berupa angka positif" };

  try {
    await prisma.product.create({
      data: { sku, name, weightGram, purity, brand, series },
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unique constraint") || msg.includes("unique")) {
      return { error: `SKU "${sku}" sudah digunakan` };
    }
    return { error: "Gagal menyimpan produk. Coba lagi." };
  }
}

export async function updateProduct(id: string, formData: FormData): Promise<ActionResult> {
  const sku       = (formData.get("sku")        as string ?? "").trim();
  const name      = (formData.get("name")       as string ?? "").trim();
  const weightRaw = (formData.get("weightGram") as string ?? "").trim();
  const purity    = (formData.get("purity")     as string ?? "999.9").trim() || "999.9";
  const brand     = (formData.get("brand")      as string ?? "").trim() || null;
  const series    = (formData.get("series")     as string ?? "").trim() || null;

  if (!sku)  return { error: "SKU wajib diisi" };
  if (!name) return { error: "Nama produk wajib diisi" };

  const weightGram = parseFloat(weightRaw);
  if (isNaN(weightGram) || weightGram <= 0) return { error: "Gramasi harus berupa angka positif" };

  try {
    await prisma.product.update({
      where: { id },
      data: { sku, name, weightGram, purity, brand, series },
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unique constraint") || msg.includes("unique")) {
      return { error: `SKU "${sku}" sudah digunakan` };
    }
    return { error: "Gagal mengupdate produk. Coba lagi." };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const unitCount = await prisma.stockUnit.count({ where: { productId: id } });
  if (unitCount > 0) {
    return { error: `Tidak bisa dihapus — masih ada ${unitCount} unit terkait produk ini` };
  }
  try {
    await prisma.product.delete({ where: { id } });
    revalidatePath("/admin/products");
    return { success: true };
  } catch {
    return { error: "Gagal menghapus produk. Coba lagi." };
  }
}
