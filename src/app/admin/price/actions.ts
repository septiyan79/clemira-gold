"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchHargaFromSheets } from "@/lib/google-sheets";

export async function syncHargaAction(): Promise<{ synced: number; error?: string }> {
  "use server";

  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "admin") {
    return { synced: 0, error: "Unauthorized" };
  }

  try {
    const rows = await fetchHargaFromSheets();
    const latestDate = rows.reduce(
      (max, row) => (row.tanggal > max ? row.tanggal : max),
      new Date(0)
    );
    const rowsToSync = rows.filter(
      (row) => row.tanggal.getTime() === latestDate.getTime()
    );

    const results = await Promise.allSettled(
      rowsToSync.map((row) =>
        prisma.hargaAntam.upsert({
          where: { tanggal_gramasi: { tanggal: row.tanggal, gramasi: row.gramasi } },
          update: { harga: row.harga },
          create: { tanggal: row.tanggal, gramasi: row.gramasi, harga: row.harga },
        })
      )
    );

    const synced = results.filter((r) => r.status === "fulfilled").length;
    revalidatePath("/");
    revalidatePath("/api/chart-data");
    return { synced };
  } catch (err) {
    return { synced: 0, error: String(err) };
  }
}

export async function fullSyncHargaAction(): Promise<{ synced: number; error?: string }> {
  "use server";

  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "admin") {
    return { synced: 0, error: "Unauthorized" };
  }

  try {
    const rows = await fetchHargaFromSheets();

    let synced = 0;
    const errors: string[] = [];
    const CHUNK_SIZE = 50;

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const results = await Promise.allSettled(
        chunk.map((row) =>
          prisma.hargaAntam.upsert({
            where: { tanggal_gramasi: { tanggal: row.tanggal, gramasi: row.gramasi } },
            update: { harga: row.harga },
            create: { tanggal: row.tanggal, gramasi: row.gramasi, harga: row.harga },
          })
        )
      );
      for (const result of results) {
        if (result.status === "fulfilled") synced++;
        else errors.push(String(result.reason));
      }
    }

    revalidatePath("/");
    revalidatePath("/api/chart-data");
    return { synced, error: errors.length > 0 ? `${errors.length} baris gagal` : undefined };
  } catch (err) {
    return { synced: 0, error: String(err) };
  }
}

export async function getLatestHargaDate() {
  const latestDate = await prisma.hargaAntam.findFirst({
    orderBy: { tanggal: "desc" },
    select: { tanggal: true },
  });
  return latestDate?.tanggal ?? null;
}

