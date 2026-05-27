/**
 * Import Stok Awal dari Google Sheets
 *
 * Cara menjalankan:
 *   npx tsx scripts/import-stock.ts             — import sungguhan
 *   npx tsx scripts/import-stock.ts --dry-run   — preview tanpa menyimpan ke DB
 *
 * Sebelum menjalankan:
 *   1. Pastikan .env.local berisi DATABASE_URL, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY
 *   2. Sesuaikan CONFIG di bawah dengan susunan kolom di Google Sheet Anda
 *   3. Pastikan Service Account sudah diberi akses "Viewer" ke spreadsheet
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { google, Auth } from "googleapis";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// =============================================================================
// CONFIG — sesuaikan dengan Google Sheet Anda
// =============================================================================

/** ID spreadsheet (dari URL: .../spreadsheets/d/<ID>/edit) */
const SPREADSHEET_ID = process.env.STOCK_SHEET_ID ?? process.env.GOOGLE_SHEET_ID!;

const TABEL_BELI = {
  /** Nama sheet / tab untuk data pembelian */
  sheetName: "Tabel Beli",
  /** Baris pertama data (lewati header). 1 = baris pertama sheet, 2 = lewati 1 baris header */
  startRow: 2,
  /**
   * Indeks kolom (0 = kolom A, 1 = B, dst.)
   * Sesuaikan dengan urutan kolom di sheet Anda.
   */
  col: {
    noSeri:      0,  // no seri
    certCode:    1,  // certicode
    brand:       2,  // antam | ubs | galeri24 | dst
    series:      3,  // regular | gift | batik | dst
    gramasi:     4,  // "1 gram" | "1gr" | "1" | "5 gram" | dst
    tahunCetak:  5,  // 2022 | 2023 | dst (boleh kosong)
    tanggalBeli: 6,  // "15/01/2025" | "15 Jan 25" | dst
    hargaBeli:   7,  // "1.500.000" | "1500000"
    owner:       8,  // "Toko" | "Pribadi" | nama pemilik
    penjual:     9,  // nama supplier
    kategori:    10, // "stock" | "consign" | "swap" (tidak wajib)
  },
};

const TABEL_JUAL = {
  sheetName: "Tabel Jual",
  startRow: 2,
  /**
   * Set noSeri ke -1 jika Tabel Jual tidak punya kolom serial number.
   * Jika -1, transaksi jual akan diimport tanpa menautkan ke unit stok.
   */
  col: {
    noSeri:       0, // A = No Seri
    pembeli:      1, // B = Pembeli
    tanggalJual:  2, // C = Tanggal
    hargaJual:    3, // D = Harga
  },
  /** Set false untuk skip import Tabel Jual */
  enabled: true,
};

// =============================================================================
// HELPER PARSERS
// =============================================================================

function parseGramasi(val: string): number | null {
  if (!val) return null;
  const s = String(val).trim().toLowerCase();
  // "0.5 gram" | "1 gram" | "5 gram" | "10gr" | "1/2" | "2.5"
  const num = parseFloat(s.replace(/[^\d./]/g, "").replace("/", "/"));
  if (!isNaN(num)) return num;
  // Fraction "1/2"
  const frac = s.match(/(\d+)\s*\/\s*(\d+)/);
  if (frac) return parseInt(frac[1]) / parseInt(frac[2]);
  return null;
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, may: 4,
  jun: 5, jul: 6, agu: 7, aug: 7, sep: 8, okt: 9, oct: 9, nov: 10, des: 11, dec: 11,
};

function parseDate(val: string): Date | null {
  if (!val) return null;
  const s = String(val).trim();
  // "15/01/2025" or "15/01/25"
  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const d = parseInt(m[1]), mo = parseInt(m[2]) - 1;
    const y = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3]);
    return new Date(Date.UTC(y, mo, d));
  }
  // "15 Jan 25" or "15 Januari 2025"
  m = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{2,4})$/);
  if (m) {
    const d = parseInt(m[1]);
    const mo = MONTHS[m[2].toLowerCase().slice(0, 3)];
    const y = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3]);
    if (mo !== undefined) return new Date(Date.UTC(y, mo, d));
  }
  return null;
}

function parseRupiah(val: string): number | null {
  if (!val) return null;
  const n = parseFloat(String(val).replace(/[^\d]/g, ""));
  return isNaN(n) ? null : n;
}

function normalize(s: string | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function titleCase(s: string): string {
  return s.trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

// =============================================================================
// GOOGLE SHEETS
// =============================================================================

async function getSheetRows(
  sheets: ReturnType<typeof google.sheets>,
  sheetName: string,
  startRow: number,
): Promise<string[][]> {
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A${startRow}:Z`,
    valueRenderOption: "FORMATTED_VALUE",
  });
  return (resp.data.values ?? []) as string[][];
}

// =============================================================================
// MAIN
// =============================================================================

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  console.log(DRY_RUN ? "🔍  DRY RUN — tidak ada data yang disimpan\n" : "🚀  Import dimulai\n");

  // ── Prisma ──────────────────────────────────────────────────────────────────
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  // ── Google Sheets ────────────────────────────────────────────────────────────
  const auth = new Auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  // ── In-memory caches (avoid duplicate DB lookups) ────────────────────────────
  const ownerCache      = new Map<string, string>(); // name → id
  const productCache    = new Map<string, string>(); // "brand|weight|series" → id
  const cpCache         = new Map<string, string>(); // name → id (counterparties)

  async function getOrCreateOwner(name: string): Promise<string> {
    const key = normalize(name);
    if (ownerCache.has(key)) return ownerCache.get(key)!;
    const existing = await prisma.owner.findFirst({ where: { name: { equals: name.trim(), mode: "insensitive" } } });
    const id = existing
      ? existing.id
      : DRY_RUN
        ? `dry-owner-${key}`
        : (await prisma.owner.create({ data: { name: titleCase(name), type: "entity" } })).id;
    ownerCache.set(key, id);
    return id;
  }

  async function getOrCreateProduct(brand: string, weightGram: number, series: string): Promise<string> {
    const key = `${normalize(brand)}|${weightGram}|${normalize(series)}`;
    if (productCache.has(key)) return productCache.get(key)!;
    const existing = await prisma.product.findFirst({
      where: {
        brand:     { equals: brand.trim(),  mode: "insensitive" },
        series:    { equals: series.trim(), mode: "insensitive" },
        weightGram: weightGram,
      },
    });
    const sku = `LM-${normalize(brand).toUpperCase()}-${weightGram}GR-${normalize(series).replace(/\s+/g, "-").toUpperCase()}`;
    const name = `LM ${titleCase(brand)} ${weightGram}gr ${titleCase(series)}`;
    const id = existing
      ? existing.id
      : DRY_RUN
        ? `dry-product-${key}`
        : (await prisma.product.create({ data: { sku, name, weightGram, brand: normalize(brand), series: normalize(series) } })).id;
    productCache.set(key, id);
    return id;
  }

  async function getOrCreateCounterparty(name: string, type: string[]): Promise<string> {
    const key = normalize(name);
    if (cpCache.has(key)) return cpCache.get(key)!;
    const existing = await prisma.counterparty.findFirst({ where: { name: { equals: name.trim(), mode: "insensitive" } } });
    const id = existing
      ? existing.id
      : DRY_RUN
        ? `dry-cp-${key}`
        : (await prisma.counterparty.create({ data: { name: titleCase(name), type } })).id;
    cpCache.set(key, id);
    return id;
  }

  // ── TABEL BELI ───────────────────────────────────────────────────────────────
  console.log(`📥  Membaca "${TABEL_BELI.sheetName}"…`);
  const beliRows = await getSheetRows(sheets, TABEL_BELI.sheetName, TABEL_BELI.startRow);
  console.log(`    ${beliRows.length} baris ditemukan\n`);

  const { col: C } = TABEL_BELI;
  let imported = 0, skipped = 0, errored = 0;

  // Group by (supplier + date) → each group becomes one PurchaseOrder
  type PoGroup = {
    supplierId: string;
    purchasedAt: Date;
    units: Array<{
      productId: string; ownerId: string; serialNumber: string | null;
      certCode: string | null; mintYear: number | null;
      condition: string; unitPrice: number;
    }>;
  };
  const poGroups = new Map<string, PoGroup>();

  for (let i = 0; i < beliRows.length; i++) {
    const row = beliRows[i];
    const rowNum = TABEL_BELI.startRow + i;

    const noSeri     = row[C.noSeri]?.trim()  || null;
    const certCode   = row[C.certCode]?.trim() || null;
    const brandRaw   = row[C.brand]?.trim();
    const seriesRaw  = row[C.series]?.trim() || "regular";
    const gramasiRaw = row[C.gramasi]?.trim();
    const ownerRaw   = row[C.owner]?.trim();
    const penjualRaw = row[C.penjual]?.trim();
    const tanggalRaw = row[C.tanggalBeli]?.trim();
    const hargaRaw   = row[C.hargaBeli]?.trim();
    const tahunRaw   = row[C.tahunCetak]?.trim();

    // Skip baris kosong
    if (!brandRaw && !gramasiRaw) continue;

    const weightGram = parseGramasi(gramasiRaw);
    const hargaBeli  = parseRupiah(hargaRaw);
    const tanggal    = parseDate(tanggalRaw);
    const mintYear   = tahunRaw ? parseInt(tahunRaw) : null;

    const issues: string[] = [];
    if (!brandRaw)      issues.push("brand kosong");
    if (!weightGram)    issues.push(`gramasi tidak terbaca: "${gramasiRaw}"`);
    if (!hargaBeli)     issues.push(`harga tidak terbaca: "${hargaRaw}"`);
    if (!tanggal)       issues.push(`tanggal tidak terbaca: "${tanggalRaw}"`);
    if (!ownerRaw)      issues.push("owner kosong");
    if (!penjualRaw)    issues.push("penjual kosong");

    if (issues.length) {
      console.warn(`  ⚠  Baris ${rowNum} dilewati — ${issues.join(", ")}`);
      errored++;
      continue;
    }

    // Cek serial sudah ada di DB
    if (noSeri) {
      const exists = await prisma.stockUnit.findFirst({ where: { serialNumber: noSeri }, select: { id: true } });
      if (exists) {
        console.log(`  ↩  Baris ${rowNum} dilewati — serial "${noSeri}" sudah ada`);
        skipped++;
        continue;
      }
    }

    const productId   = await getOrCreateProduct(brandRaw!, weightGram!, seriesRaw);
    const ownerId     = await getOrCreateOwner(ownerRaw!);
    const supplierId  = await getOrCreateCounterparty(penjualRaw!, ["supplier"]);

    const poKey = `${supplierId}|${tanggal!.toISOString().slice(0, 10)}`;
    if (!poGroups.has(poKey)) {
      poGroups.set(poKey, { supplierId, purchasedAt: tanggal!, units: [] });
    }
    poGroups.get(poKey)!.units.push({
      productId, ownerId,
      serialNumber: noSeri,
      certCode,
      mintYear: mintYear && !isNaN(mintYear) ? mintYear : null,
      condition: "new",
      unitPrice: hargaBeli!,
    });

    console.log(`  ✓  Baris ${rowNum} — ${brandRaw} ${weightGram}gr "${noSeri ?? "no-seri"}"`);
    imported++;
  }

  console.log(`\n📦  Membuat Purchase Orders (${poGroups.size} PO untuk ${imported} unit)…`);

  if (!DRY_RUN) {
    for (const [, group] of poGroups) {
      const totalAmount = group.units.reduce((s, u) => s + u.unitPrice, 0);

      await prisma.$transaction(async (tx) => {
        const po = await tx.purchaseOrder.create({
          data: {
            supplierId:  group.supplierId,
            totalAmount,
            purchasedAt: group.purchasedAt,
          },
        });

        for (const u of group.units) {
          const unit = await tx.stockUnit.create({
            data: {
              productId:           u.productId,
              ownerId:             u.ownerId,
              purchaseSourceId:    group.supplierId,
              serialNumber:        u.serialNumber,
              certCode:            u.certCode,
              mintYear:            u.mintYear,
              condition:           u.condition,
              status:              "available",
              actualPurchasePrice: u.unitPrice,
              referencePrice:      u.unitPrice, // non-swap: reference = actual
            },
          });
          await tx.purchaseOrderLine.create({
            data: {
              purchaseOrderId: po.id,
              stockUnitId:     unit.id,
              unitPrice:       u.unitPrice,
            },
          });
        }
      });
    }
  }

  // ── TABEL JUAL ───────────────────────────────────────────────────────────────
  let soldImported = 0;

  if (TABEL_JUAL.enabled) {
    console.log(`\n💰  Membaca "${TABEL_JUAL.sheetName}"…`);
    const jualRows = await getSheetRows(sheets, TABEL_JUAL.sheetName, TABEL_JUAL.startRow);
    console.log(`    ${jualRows.length} baris ditemukan`);

    const { col: J } = TABEL_JUAL;

    for (let i = 0; i < jualRows.length; i++) {
      const row = jualRows[i];
      const rowNum = TABEL_JUAL.startRow + i;

      const noSeri     = J.noSeri >= 0 ? row[J.noSeri]?.trim() || null : null;
      const pembeliRaw = row[J.pembeli]?.trim();
      const tanggalRaw = row[J.tanggalJual]?.trim();
      const hargaRaw   = row[J.hargaJual]?.trim();

      if (!pembeliRaw && !tanggalRaw) continue;

      const tanggal  = parseDate(tanggalRaw);
      const hargaJual = parseRupiah(hargaRaw);

      if (!tanggal || !hargaJual) {
        const detail = [
          !tanggal  && `tanggal tidak terbaca: "${tanggalRaw ?? "(kosong)"}"`,
          !hargaJual && `harga tidak terbaca: "${hargaRaw ?? "(kosong)"}"`,
        ].filter(Boolean).join(", ");
        console.warn(`  ⚠  Jual baris ${rowNum} dilewati — ${detail}`);
        console.warn(`       raw: pembeli="${pembeliRaw}" tgl="${tanggalRaw}" harga="${hargaRaw}" serial="${noSeri}"`);
        continue;
      }

      // Find linked stock unit by serial number
      let stockUnit: { id: string; referencePrice: { toNumber(): number } | null } | null = null;
      if (noSeri) {
        stockUnit = await prisma.stockUnit.findFirst({
          where: { serialNumber: noSeri },
          select: { id: true, referencePrice: true },
        });
      }

      // COGS for own_stock = referencePrice of the unit sold
      const cogs = stockUnit?.referencePrice?.toNumber() ?? 0;
      const buyerId = pembeliRaw
        ? await getOrCreateCounterparty(pembeliRaw, ["buyer"])
        : null;

      if (!DRY_RUN) {
        await prisma.$transaction(async (tx) => {
          const trx = await tx.transaction.create({
            data: { buyerId, transactedAt: tanggal },
          });
          await tx.transactionLine.create({
            data: {
              transactionId:   trx.id,
              stockUnitId:     stockUnit?.id ?? null,
              fulfillmentMode: "own_stock",
              sellPrice:       hargaJual,
              cogs,
              margin:          hargaJual - cogs,
            },
          });
          if (stockUnit) {
            await tx.stockUnit.update({
              where: { id: stockUnit.id },
              data: { status: "sold" },
            });
          }
        });
      }

      console.log(`  ✓  Jual baris ${rowNum} — ${pembeliRaw} Rp ${hargaJual.toLocaleString("id-ID")}`);
      soldImported++;
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(50));
  console.log("✅  Import selesai");
  console.log(`   Stok diimport  : ${imported} unit`);
  console.log(`   Dilewati       : ${skipped} unit (sudah ada)`);
  console.log(`   Error / skip   : ${errored} baris`);
  if (TABEL_JUAL.enabled) console.log(`   Transaksi jual : ${soldImported}`);
  if (DRY_RUN) console.log("\n   ⚠  DRY RUN — tidak ada yang disimpan ke database");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("\n❌  Error:", e.message ?? e);
  process.exit(1);
});
