/**
 * Jalankan: npx tsx --env-file=.env scripts/backfill-paid-status.ts
 * Hapus file ini setelah dijalankan sekali.
 *
 * Menandai semua transaksi lama (status=pending, receiptNo=null) sebagai PAID
 * dan meng-generate nomor kwitansi KWT/YYYY/MM/NNNNN.
 * paidAt = transactedAt (tanggal transaksi asli).
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function generateReceiptNo(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  atDate: Date
): Promise<string> {
  const year = atDate.getFullYear();
  const month = atDate.getMonth() + 1;

  const counter = await tx.invoiceCounter.upsert({
    where: { prefix_year_month: { prefix: "KWT", year, month } },
    update: { seq: { increment: 1 } },
    create: { prefix: "KWT", year, month, seq: 1 },
    select: { seq: true },
  });

  const seq = String(counter.seq).padStart(5, "0");
  const mm = String(month).padStart(2, "0");
  return `KWT/${year}/${mm}/${seq}`;
}

async function main() {
  const transactions = await prisma.transaction.findMany({
    where: { status: "pending", receiptNo: null },
    orderBy: { transactedAt: "asc" },
    select: { id: true, transactedAt: true, invoiceNo: true },
  });

  console.log(`Memproses ${transactions.length} transaksi...\n`);

  for (const t of transactions) {
    const receiptNo = await prisma.$transaction(async (tx) => {
      const no = await generateReceiptNo(tx, t.transactedAt);
      await tx.transaction.update({
        where: { id: t.id },
        data: { status: "paid", receiptNo: no, paidAt: t.transactedAt },
      });
      return no;
    });
    console.log(`  ${t.invoiceNo ?? t.id.slice(-8)} → ${receiptNo} ✓`);
  }

  console.log(`\nSelesai: ${transactions.length} transaksi ditandai PAID.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
