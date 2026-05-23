"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchHargaFromSheets } from "@/lib/google-sheets";
import SyncButton from "./SyncButton";

async function syncHargaAction(): Promise<{ synced: number; error?: string }> {
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

async function getLatestHarga() {
  const latestDate = await prisma.hargaAntam.findFirst({
    orderBy: { tanggal: "desc" },
    select: { tanggal: true },
  });
  if (!latestDate) return { tanggal: null, rows: [] };

  const rows = await prisma.hargaAntam.findMany({
    where: { tanggal: latestDate.tanggal },
    orderBy: { gramasi: "asc" },
  });

  return { tanggal: latestDate.tanggal, rows };
}

function formatRupiah(harga: bigint) {
  return "Rp " + Number(harga).toLocaleString("id-ID");
}

function formatTanggal(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export default async function AdminHargaHarian() {
  const { tanggal, rows } = await getLatestHarga();

  return (
    <div>
      <p className="section-label" style={{ marginBottom: 8 }}>Harga Antam</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
        <div>
          <h1 className="fd" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--text)", marginBottom: 6 }}>
            Harga Harian
          </h1>
          {tanggal && (
            <p style={{ fontSize: 13, color: "var(--muted)" }}>
              Data terakhir: {formatTanggal(tanggal)}
            </p>
          )}
        </div>
        <SyncButton action={syncHargaAction} />
      </div>

      {rows.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>Belum ada data harga.</p>
      ) : (
        <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,.08)" }}>
                {["Gramasi", "Harga"].map((h) => (
                  <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11, letterSpacing: 1.5, color: "var(--muted)", textTransform: "uppercase", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                  <td style={{ padding: "14px 20px", fontSize: 14, color: "var(--text)" }}>{row.gramasi}</td>
                  <td style={{ padding: "14px 20px", fontSize: 14, color: "var(--gold)", fontFamily: "var(--font-dm-serif), serif" }}>
                    {formatRupiah(row.harga)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
