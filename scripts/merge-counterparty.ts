/**
 * Merge dua counterparty yang namanya sama menjadi satu.
 *
 * Cara pakai:
 *   # Preview (tidak mengubah data)
 *   npx tsx scripts/merge-counterparty.ts "Debbie"
 *
 *   # Eksekusi
 *   npx tsx scripts/merge-counterparty.ts "Debbie" --confirm
 *
 * Script akan:
 *   1. Tampilkan semua counterparty dengan nama tersebut
 *   2. Pilih yang paling "lengkap" sebagai target (paling banyak role / paling lama)
 *   3. Re-link semua transaksi dari duplikat → target
 *   4. Tambahkan semua role dari duplikat ke target
 *   5. Hapus duplikat
 */

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
  }
}

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma  = new PrismaClient({ adapter });
const CONFIRM = process.argv.includes("--confirm");
const NAME    = process.argv.find(a => !a.startsWith("-") && !a.includes("merge-counterparty") && !a.includes("tsx") && !a.includes("node"));

async function main() {
  if (!NAME) {
    console.error("❌  Sertakan nama counterparty\n   Contoh: npx tsx scripts/merge-counterparty.ts \"Debbie\"");
    process.exit(1);
  }

  const matches = await prisma.counterparty.findMany({
    where: { name: { equals: NAME, mode: "insensitive" } },
    include: {
      transactions:     { select: { id: true } },
      purchaseOrders:   { select: { id: true } },
      consignmentLines: { select: { id: true } },
      swapEvents:       { select: { id: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (matches.length === 0) {
    console.error(`❌  Tidak ada counterparty dengan nama "${NAME}"`);
    process.exit(1);
  }

  if (matches.length === 1) {
    console.log(`✅  Hanya ada satu "${NAME}" — tidak perlu merge.`);
    console.log(`   ID: ${matches[0].id} | Role: [${matches[0].type.join(", ")}]`);
    await prisma.$disconnect();
    return;
  }

  console.log(`\n📋  Ditemukan ${matches.length} counterparty bernama "${NAME}":\n`);
  matches.forEach((c, i) => {
    console.log(`  [${i + 1}] ID: ${c.id}`);
    console.log(`      Role    : [${c.type.join(", ")}]`);
    console.log(`      Transaksi penjualan : ${c.transactions.length}`);
    console.log(`      Purchase order      : ${c.purchaseOrders.length}`);
    console.log(`      Consignment lines   : ${c.consignmentLines.length}`);
    console.log(`      Swap events         : ${c.swapEvents.length}`);
    console.log(`      Dibuat  : ${c.createdAt.toLocaleDateString("id-ID")}\n`);
  });

  // Target = yang paling lama (createdAt terkecil = index 0, sudah di-sort asc)
  const target     = matches[0];
  const duplicates = matches.slice(1);

  // Gabungkan semua role
  const mergedRoles = [...new Set([...target.type, ...duplicates.flatMap(d => d.type)])];

  console.log("═══════════════════════════════════════════════════════");
  console.log("  RENCANA MERGE");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`\n  Target  (dipertahankan) : ${target.id}`);
  console.log(`  Role setelah merge      : [${mergedRoles.join(", ")}]`);
  console.log(`\n  Duplikat (akan dihapus):`);

  let totalTxMoved = 0;
  for (const dup of duplicates) {
    console.log(`    - ${dup.id} | role: [${dup.type.join(", ")}] | ${dup.transactions.length} transaksi`);
    totalTxMoved += dup.transactions.length;
  }

  console.log(`\n  Transaksi yang akan di-re-link ke target : ${totalTxMoved}`);

  if (!CONFIRM) {
    console.log("\n───────────────────────────────────────────────────────");
    console.log("  ℹ️   Ini adalah DRY-RUN. Data belum diubah.");
    console.log("  Untuk eksekusi:");
    console.log(`  npx tsx scripts/merge-counterparty.ts "${NAME}" --confirm`);
    console.log("───────────────────────────────────────────────────────\n");
    await prisma.$disconnect();
    return;
  }

  console.log("\n⚡  Memulai merge…");

  for (const dup of duplicates) {
    // Re-link transaksi penjualan
    if (dup.transactions.length > 0) {
      await prisma.transaction.updateMany({
        where: { buyerId: dup.id },
        data:  { buyerId: target.id },
      });
      console.log(`  ✓ ${dup.transactions.length} transaksi di-re-link ke target`);
    }

    // Re-link purchase orders (jika ada)
    if (dup.purchaseOrders.length > 0) {
      await prisma.purchaseOrder.updateMany({
        where: { supplierId: dup.id },
        data:  { supplierId: target.id },
      });
      console.log(`  ✓ ${dup.purchaseOrders.length} purchase order di-re-link ke target`);
    }

    // Re-link consignment lines (jika ada)
    if (dup.consignmentLines.length > 0) {
      await prisma.consignmentLine.updateMany({
        where: { supplierId: dup.id },
        data:  { supplierId: target.id },
      });
      console.log(`  ✓ ${dup.consignmentLines.length} consignment line di-re-link ke target`);
    }

    // Re-link swap events (jika ada)
    if (dup.swapEvents.length > 0) {
      await prisma.swapEvent.updateMany({
        where: { supplierId: dup.id },
        data:  { supplierId: target.id },
      });
      console.log(`  ✓ ${dup.swapEvents.length} swap event di-re-link ke target`);
    }

    // Hapus duplikat
    await prisma.counterparty.delete({ where: { id: dup.id } });
    console.log(`  🗑️  Duplikat ${dup.id} dihapus`);
  }

  // Update role target
  await prisma.counterparty.update({
    where: { id: target.id },
    data:  { type: mergedRoles },
  });
  console.log(`  ✓ Role target diupdate → [${mergedRoles.join(", ")}]`);

  console.log(`\n✅  Merge selesai! "${NAME}" kini hanya ada satu entri.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("\n💥  Error:", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
