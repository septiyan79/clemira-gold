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

  // Default: hanya sync tanggal terbaru (~10 baris)
  // ?full=true: sync semua history
  let rowsToSync = rows;
  if (!fullSync) {
    const latestDate = rows.reduce(
      (max, row) => (row.tanggal > max ? row.tanggal : max),
      new Date(0)
    );
    rowsToSync = rows.filter(
      (row) => row.tanggal.getTime() === latestDate.getTime()
    );
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
