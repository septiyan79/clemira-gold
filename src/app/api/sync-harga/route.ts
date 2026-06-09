import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchHargaFromSheets } from '@/lib/google-sheets';

const CHUNK_SIZE = 50;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const fullSync = request.nextUrl.searchParams.get('full') === 'true';

  const rows = await fetchHargaFromSheets();

  // Default: sync semua tanggal yang belum ada di DB (catch-up jika cron miss)
  // ?full=true: sync ulang semua history (upsert idempotent)
  let rowsToSync = rows;
  if (!fullSync) {
    const latestInDb = await prisma.hargaAntam.findFirst({
      orderBy: { tanggal: 'desc' },
      select: { tanggal: true },
    });
    if (latestInDb) {
      rowsToSync = rows.filter(row => row.tanggal > latestInDb.tanggal);
    }
  }

  let synced = 0;
  const errors: string[] = [];

  for (let i = 0; i < rowsToSync.length; i += CHUNK_SIZE) {
    const chunk = rowsToSync.slice(i, i + CHUNK_SIZE);
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
      if (result.status === 'fulfilled') synced++;
      else errors.push(String(result.reason));
    }
  }

  return Response.json({
    synced,
    total: rowsToSync.length,
    fullSync,
    errors,
    timestamp: new Date().toISOString(),
  });
}
