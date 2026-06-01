/**
 * Import data penjualan dari CSV (export Google Sheet)
 *
 * Format CSV (header wajib ada):
 *   nomor_seri, pembeli, tanggal_jual, harga_jual, mode[, nomor_seri_pengganti]
 *
 * Kolom nomor_seri_pengganti hanya wajib diisi untuk mode swap.
 * Untuk mode lain boleh kosong atau kolom tidak ada sama sekali.
 *
 * Mode yang valid:
 *   own_stock / stok / own / stock   → own_stock
 *   consignment / konsinyasi         → consignment
 *   swap                             → swap
 *
 * COGS per mode:
 *   own_stock   → referencePrice unit
 *   consignment → unitPrice dari PurchaseOrderLine
 *   swap        → referencePrice originalUnit (unit yang dijual)
 *
 * Cara pakai:
 *   # Preview saja (tidak mengubah data)
 *   npx tsx scripts/import-sales.ts data.csv
 *
 *   # Eksekusi sungguhan (hapus data lama, import baru)
 *   npx tsx scripts/import-sales.ts data.csv --confirm
 */

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import * as fs from "fs";
import * as path from "path";

// Load .env
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
  }
}

if (!process.env.DATABASE_URL) {
  console.error("❌  DATABASE_URL tidak ditemukan di .env");
  process.exit(1);
}

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma  = new PrismaClient({ adapter });
const CONFIRM  = process.argv.includes("--confirm");
const CSV_FILE = process.argv.find(a => a.endsWith(".csv"));

// ── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(raw: string): number {
  // Handle: 1050000 | 1.050.000 | 1,050,000 | Rp 1.050.000
  return parseInt(raw.replace(/[^0-9]/g, ""), 10);
}

function parseDate(raw: string): Date {
  const s = raw.trim();
  // ISO: 2025-01-15
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s + "T00:00:00.000Z");
  // DD/MM/YYYY or DD-MM-YYYY
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return new Date(`${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}T00:00:00.000Z`);
  throw new Error(`Format tanggal tidak dikenal: "${raw}"`);
}

function normalizeMode(raw: string): "own_stock" | "consignment" | "swap" {
  const s = raw.trim().toLowerCase();
  if (["own_stock", "own", "stok", "stock"].includes(s)) return "own_stock";
  if (["consignment", "konsinyasi"].includes(s))          return "consignment";
  if (["swap"].includes(s))                                return "swap";
  throw new Error(`Mode tidak valid: "${raw}" (gunakan: own_stock / consignment / swap)`);
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(l => l.trim());
  if (lines.length < 2) throw new Error("CSV kosong atau hanya ada header");

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
  );

  const required = ["nomor_seri", "pembeli", "tanggal_jual", "harga_jual", "mode"];
  for (const req of required) {
    if (!headers.includes(req)) throw new Error(`Kolom wajib tidak ditemukan: "${req}"\nHeader ditemukan: ${headers.join(", ")}`);
  }

  return lines.slice(1).map((line, i) => {
    // Simple CSV parse (handle quoted fields)
    const values: string[] = [];
    let cur = "", inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === "," && !inQuote) { values.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    values.push(cur.trim());

    if (values.length !== headers.length) {
      throw new Error(`Baris ${i + 2}: jumlah kolom tidak sesuai (${values.length} vs ${headers.length})`);
    }
    return Object.fromEntries(headers.map((h, j) => [h, values[j]]));
  }).filter(row => Object.values(row).some(v => v)); // skip empty rows
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!CSV_FILE) {
    console.error("❌  Sertakan path file CSV\n   Contoh: npx tsx scripts/import-sales.ts data.csv");
    process.exit(1);
  }
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`❌  File tidak ditemukan: ${CSV_FILE}`);
    process.exit(1);
  }

  console.log(`\n📂  Membaca ${CSV_FILE}…`);
  const rows = parseCSV(fs.readFileSync(CSV_FILE, "utf-8"));
  console.log(`    ${rows.length} baris data ditemukan\n`);

  // ── Validasi & lookup semua baris ──
  type ProcessedRow = {
    serialNumber:        string;
    buyerName:           string;
    transactedAt:        Date;
    sellPrice:           number;
    mode:                "own_stock" | "consignment" | "swap";
    unit:                { id: string; referencePrice: number | null };
    replacementUnit:     { id: string; serialNumber: string | null; purchaseCost: number | null } | null; // swap only
    cogs:                number;
    margin:              number;
    buyerId:             string | null;
    _buyerCreate:        boolean; // counterparty belum ada sama sekali → buat baru
    _buyerAddRole:       boolean; // counterparty ada tapi belum punya role buyer → tambah role
  };

  const errors: string[]       = [];
  const processed: ProcessedRow[] = [];

  // Pre-load SEMUA counterparty (bukan hanya buyer) untuk dedup & role-update
  const allCounterparties = await prisma.counterparty.findMany({
    select: { id: true, name: true, type: true },
  });
  const cpMap = new Map(allCounterparties.map(c => [c.name.toLowerCase(), c]));

  for (let i = 0; i < rows.length; i++) {
    const row   = rows[i];
    const rowNo = i + 2; // +2 karena header di baris 1

    try {
      const serialNumber = row.nomor_seri?.trim();
      if (!serialNumber) throw new Error("nomor_seri kosong");

      const buyerName = row.pembeli?.trim();
      if (!buyerName) throw new Error("pembeli kosong");

      const transactedAt = parseDate(row.tanggal_jual);
      const sellPrice    = parsePrice(row.harga_jual);
      const mode         = normalizeMode(row.mode);

      if (isNaN(sellPrice) || sellPrice <= 0) throw new Error(`harga_jual tidak valid: "${row.harga_jual}"`);

      // Lookup originalUnit by serial number
      const unit = await prisma.stockUnit.findFirst({
        where: { serialNumber },
        include: { purchaseOrderLine: { select: { unitPrice: true } } },
      });
      if (!unit) throw new Error(`Unit dengan nomor seri "${serialNumber}" tidak ditemukan di database`);

      // Lookup replacementUnit untuk swap (harus sebelum hitung COGS)
      let replacementUnit: { id: string; serialNumber: string | null; purchaseCost: number | null } | null = null;
      if (mode === "swap") {
        const replacementSerial = row.nomor_seri_pengganti?.trim();
        if (!replacementSerial) throw new Error(
          `Mode swap wajib mengisi nomor_seri_pengganti (diperlukan untuk menghitung COGS)`
        );
        const ru = await prisma.stockUnit.findFirst({
          where:   { serialNumber: replacementSerial },
          select:  { id: true, serialNumber: true, purchaseOrderLine: { select: { unitPrice: true } } },
        });
        if (!ru) throw new Error(`Unit pengganti dengan nomor seri "${replacementSerial}" tidak ditemukan di database`);
        const purchaseCost = ru.purchaseOrderLine?.unitPrice?.toNumber() ?? null;
        if (!purchaseCost) throw new Error(
          `Unit pengganti "${replacementSerial}" tidak punya data harga beli di PurchaseOrder ` +
          `— COGS swap = harga beli unit pengganti`
        );
        replacementUnit = { id: ru.id, serialNumber: ru.serialNumber, purchaseCost };
      } else if (row.nomor_seri_pengganti?.trim()) {
        // Mode bukan swap tapi ada nomor_seri_pengganti → warning saja, abaikan
        console.warn(`  ⚠️  Baris ${rowNo}: nomor_seri_pengganti diabaikan karena mode bukan swap`);
      }

      // Hitung COGS berdasarkan mode
      let cogs: number;
      if (mode === "consignment") {
        const poPrice = unit.purchaseOrderLine?.unitPrice?.toNumber();
        if (!poPrice) throw new Error(`Mode consignment tapi unit "${serialNumber}" tidak punya data harga beli di PurchaseOrder`);
        cogs = poPrice;
      } else if (mode === "swap") {
        // COGS swap = harga beli unit PENGGANTI dari supplier (bukan referencePrice unit lama)
        cogs = replacementUnit!.purchaseCost!;
      } else {
        // own_stock: pakai referencePrice
        const refPrice = unit.referencePrice?.toNumber();
        if (!refPrice) throw new Error(`Unit "${serialNumber}" tidak punya referencePrice`);
        cogs = refPrice;
      }

      const margin   = sellPrice - cogs;
      const cpEntry  = cpMap.get(buyerName.toLowerCase()) ?? null;
      const buyerId  = cpEntry?.id ?? null;

      processed.push({
        serialNumber,
        buyerName,
        transactedAt,
        sellPrice,
        mode,
        unit: { id: unit.id, referencePrice: unit.referencePrice?.toNumber() ?? null },
        replacementUnit,
        cogs,
        margin,
        buyerId,
        _buyerCreate:  cpEntry === null,
        _buyerAddRole: cpEntry !== null && !cpEntry.type.includes("buyer"),
      });

    } catch (e) {
      errors.push(`  Baris ${rowNo}: ${(e as Error).message}`);
    }
  }

  // ── Tampilkan preview ──
  const fmtRp = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

  console.log("═══════════════════════════════════════════════════════");
  console.log("  PREVIEW IMPORT");
  console.log("═══════════════════════════════════════════════════════");

  if (errors.length > 0) {
    console.log(`\n❌  ${errors.length} baris bermasalah:\n${errors.join("\n")}\n`);
  }

  const newBuyers   = [...new Set(processed.filter(r => r._buyerCreate).map(r => r.buyerName))];
  const roleUpdates = [...new Set(processed.filter(r => r._buyerAddRole).map(r => r.buyerName))];

  if (newBuyers.length > 0) {
    console.log(`\n🆕  Buyer baru yang akan dibuat (${newBuyers.length}):`);
    newBuyers.forEach(n => console.log(`    + ${n}`));
  }
  if (roleUpdates.length > 0) {
    console.log(`\n🔄  Counterparty yang akan ditambah role "buyer" (${roleUpdates.length}):`);
    roleUpdates.forEach(n => {
      const cp = cpMap.get(n.toLowerCase())!;
      console.log(`    ~ ${n}  [${cp.type.join(", ")}] → [${[...cp.type, "buyer"].join(", ")}]`);
    });
  }

  // Ringkasan per mode
  const modeCount = processed.reduce(
    (acc, r) => ({ ...acc, [r.mode]: (acc[r.mode] ?? 0) + 1 }),
    {} as Record<string, number>
  );
  const swapRows   = processed.filter(r => r.mode === "swap");
  const swapNoRepl = swapRows.filter(r => r.replacementUnit === null);

  console.log(`\n📊  Ringkasan (${processed.length} transaksi valid):`);
  const totalRevenue = processed.reduce((s, r) => s + r.sellPrice, 0);
  const totalCogs    = processed.reduce((s, r) => s + r.cogs, 0);
  const totalMargin  = processed.reduce((s, r) => s + r.margin, 0);

  console.log(`    Revenue : ${fmtRp(totalRevenue)}`);
  console.log(`    COGS    : ${fmtRp(totalCogs)}`);
  console.log(`    Margin  : ${fmtRp(totalMargin)}`);
  Object.entries(modeCount).forEach(([m, c]) => console.log(`    ${m.padEnd(16)}: ${c} transaksi`));

  if (swapNoRepl.length > 0) {
    console.log(`\n⚠️   ${swapNoRepl.length} swap tanpa unit pengganti (akan menjadi outstanding swap):`);
    swapNoRepl.forEach(r => console.log(`    - ${r.serialNumber} (${r.buyerName})`));
  }

  console.log("\n  Sample 5 baris pertama:");
  console.log("  " + ["Serial", "Pembeli", "Tgl Jual", "Harga Jual", "Mode", "COGS", "Margin", "Pengganti"]
    .map(h => h.padEnd(16)).join(""));
  processed.slice(0, 5).forEach(r => {
    const cols = [
      r.serialNumber,
      r.buyerName,
      r.transactedAt.toISOString().slice(0, 10),
      fmtRp(r.sellPrice),
      r.mode,
      fmtRp(r.cogs),
      fmtRp(r.margin),
      r.replacementUnit?.serialNumber ?? (r.mode === "swap" ? "(outstanding)" : "—"),
    ];
    console.log("  " + cols.map(c => String(c).padEnd(16)).join(""));
  });

  if (errors.length > 0) {
    console.log(`\n⚠️   Selesaikan ${errors.length} error di atas sebelum melanjutkan.`);
    await prisma.$disconnect();
    process.exit(1);
  }

  if (!CONFIRM) {
    console.log("\n───────────────────────────────────────────────────────");
    console.log("  ℹ️   Ini adalah DRY-RUN. Data belum diubah.");
    console.log("  Untuk eksekusi, jalankan dengan flag --confirm:");
    console.log(`  npx tsx scripts/import-sales.ts ${CSV_FILE} --confirm`);
    console.log("───────────────────────────────────────────────────────\n");
    await prisma.$disconnect();
    return;
  }

  // ── Eksekusi ──
  console.log("\n⚡  Memulai import…");

  // 1. Hapus data lama — satu transaksi kecil yang cepat
  console.log("    🗑️  Menghapus data transaksi lama…");
  await prisma.$transaction([
    prisma.swapEvent.deleteMany({}),
    prisma.consignmentLine.deleteMany({}),
    prisma.transactionLine.deleteMany({}),
    prisma.transaction.deleteMany({}),
    prisma.stockUnit.updateMany({
      where: { status: { in: ["sold", "swapped_out"] } },
      data:  { status: "available" },
    }),
  ]);
  console.log("    ✓  Data lama dihapus & status unit direset");

  // 2a. Tambahkan role "buyer" ke counterparty yang sudah ada tapi belum punya role buyer
  if (roleUpdates.length > 0) {
    console.log(`    🔄  Menambahkan role buyer ke ${roleUpdates.length} counterparty…`);
    for (const name of roleUpdates) {
      const cp = cpMap.get(name.toLowerCase())!;
      const newType = [...new Set([...cp.type, "buyer"])];
      await prisma.counterparty.update({ where: { id: cp.id }, data: { type: newType } });
      cpMap.set(name.toLowerCase(), { ...cp, type: newType });
      console.log(`    ✓ ${name}: [${cp.type.join(", ")}] → [${newType.join(", ")}]`);
    }
  }

  // 2b. Buat buyer baru yang benar-benar belum ada
  if (newBuyers.length > 0) {
    console.log(`    🆕  Membuat ${newBuyers.length} buyer baru…`);
    for (const name of newBuyers) {
      const created = await prisma.counterparty.create({ data: { name, type: ["buyer"] } });
      cpMap.set(name.toLowerCase(), created);
    }
  }

  // 3. Import transaksi row-per-row (tanpa satu transaksi besar agar tidak timeout)
  //    Jika gagal di tengah jalan, jalankan ulang script — step 1 akan bersihkan ulang.
  console.log(`    📥  Mengimport ${processed.length} transaksi…`);
  let count = 0;
  for (const row of processed) {
    const buyerId = cpMap.get(row.buyerName.toLowerCase())?.id ?? null;

    const createdTx = await prisma.transaction.create({
      data: { buyerId, transactedAt: row.transactedAt },
    });

    const createdLine = await prisma.transactionLine.create({
      data: {
        transactionId:   createdTx.id,
        stockUnitId:     row.unit.id,
        fulfillmentMode: row.mode,
        sellPrice:       row.sellPrice,
        cogs:            row.cogs,
        margin:          row.margin,
      },
    });

    // Buat SwapEvent untuk mode swap
    if (row.mode === "swap") {
      await prisma.swapEvent.create({
        data: {
          transactionLineId: createdLine.id,
          originalUnitId:    row.unit.id,
          replacementUnitId: row.replacementUnit?.id ?? null,
          replacementCost:   row.replacementUnit?.purchaseCost ?? null,
        },
      });
      await prisma.stockUnit.update({
        where: { id: row.unit.id },
        data:  { status: "swapped_out" },
      });
    } else {
      await prisma.stockUnit.update({
        where: { id: row.unit.id },
        data:  { status: "sold" },
      });
    }

    count++;
    if (count % 20 === 0) console.log(`    … ${count}/${processed.length}`);
  }

  const swapCount     = processed.filter(r => r.mode === "swap").length;
  const outstandCount = processed.filter(r => r.mode === "swap" && r.replacementUnit === null).length;

  console.log(`\n✅  Import selesai! ${processed.length} transaksi berhasil diimport.`);
  console.log(`    Total revenue : ${fmtRp(processed.reduce((s, r) => s + r.sellPrice, 0))}`);
  console.log(`    Total margin  : ${fmtRp(processed.reduce((s, r) => s + r.margin, 0))}`);
  if (swapCount > 0) {
    console.log(`    Swap          : ${swapCount} transaksi`);
    if (outstandCount > 0) {
      console.log(`    Outstanding   : ${outstandCount} swap tanpa unit pengganti`);
      console.log(`                    → Cek di /admin/transactions/outstanding-swaps`);
    }
  }
  console.log();

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("\n💥  Error tidak terduga:", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
