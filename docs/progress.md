# Progress — Completed Features

Status reflects code that exists and is wired end-to-end.

---

## Authentication
- [x] Email + password login (`/login`)
- [x] Session via JWT (NextAuth)
- [x] Admin role guard on all `/admin/*` routes
- [x] Redirect to `/login` if unauthenticated or non-admin
- [x] Public user self-registration (`/register`) — role=user, membership=free
- [x] Forgot password flow (`/forgot-password` → email link → `/reset-password?token=`)
- [x] Token-based password reset — one-time use, 1-hour expiry, clears lockout on success
- [x] Rate limit on reset request — blocks new token if one was created < 5 min ago
- [x] Self-service change password (`/admin/account`) — verifies current password before update
- [x] Transactional email via Resend (`src/lib/email.ts`) — branded HTML template

---

## Dashboard (`/admin`)
- [x] KPI cards — bulan ini: total penjualan, total margin, total unit terjual
- [x] KPI cards — saat ini: stok tersedia, transaksi pending, total produk
- [x] KPI cards — all time: total penjualan, total margin
- [x] Antam price display (harga dasar + buyback 1gr)
- [x] Recent transactions table (last 6)
- [x] Links to relevant pages from KPI cards

---

## Gold Prices
- [x] Cron sync from Google Sheets (`GET /api/sync-harga`)
- [x] Daily price display with day-over-day delta (`/admin/price`)
- [x] Monthly price chart (`/admin/price/monthly`)
- [x] Yearly price chart (`/admin/price/yearly`)
- [x] Next-day price prediction (Holt's smoothing)
- [x] Share price via WhatsApp (public landing page)
- [x] Public price chart on landing page

---

## Stock Management

### Products (`/admin/products`)
- [x] Product list with KPIs (total produk, unit tersedia, total unit)
- [x] Add product form (SKU, nama, brand, gramasi, purity, series)
- [x] Inline edit product (all fields)
- [x] Delete product (blocked if units exist)
- [x] Per-product stats: available / sold / total units

### Stock Units (`/admin/stock/units`)
- [x] Full inventory list with pagination
- [x] Filter by status, owner, brand, gramasi
- [x] Display: serial, cert code, mint year, ref price, actual price, owner, status badge

### Stock Overview (`/admin/stock`)
- [x] Aggregated view grouped by owner/brand/series/gramasi
- [x] Unit counts per group

### Rekap Stok (`/admin/stock/recap`)
- [x] Owner selector (all owners or specific)
- [x] Table: brand, series, gramasi, qty, total gramasi, nilai harga dasar, nilai buyback
- [x] Subtotals per owner (when "all owners" selected)
- [x] Grand total row
- [x] Antam price date shown in subtitle
- [x] Buyback for non-1gr: computed as `bb1gr × weightGram`

---

## Transactions

### Beli Stok
- [x] Form: supplier (+ QuickAdd), tanggal, catatan
- [x] Multi-unit per order (add/remove rows)
- [x] Per-unit: produk (+ QuickAddProduct), pemilik (+ QuickAdd), serial*, cert code, tahun cetak, harga beli
- [x] Swap replacement mode: locked product/owner fields, banner with original unit S/N
- [x] Submit → creates PurchaseOrder + StockUnit records
- [x] Redirects to stock units on success

### Jual Stok
- [x] Form: pembeli (+ QuickAdd), tanggal, catatan
- [x] Search-and-add units from available stock
- [x] Per-unit sell price input, ref price shown
- [x] Multi-unit per transaction, total displayed
- [x] Submit → marks units as sold, creates Transaction

### Konsinyasi
- [x] Form: supplier (+ QuickAdd), pembeli (+ QuickAdd), tanggal, catatan
- [x] Product (+ QuickAddProduct), serial*, cert code*, tahun cetak
- [x] Harga beli dari supplier + harga jual
- [x] Margin preview
- [x] Submit → creates Transaction + ConsignmentLine

### Swap
- [x] Form: pembeli (+ QuickAdd), tanggal, catatan
- [x] Single combobox unit picker (type to filter, click to select)
- [x] Selected unit info card: ref price, S/N, cert, tahun, pemilik
- [x] Harga jual + estimasi biaya pengganti
- [x] Supplier penggantian (optional)
- [x] Margin preview
- [x] Optional: catat unit pengganti sekarang (form unit pengganti dari supplier)
- [x] Submit → marks original unit swapped_out, creates SwapEvent

### Outstanding Swaps (`/admin/transactions/outstanding-swaps`)
- [x] List of swaps waiting for replacement unit
- [x] Shows: tgl swap, unit keluar, serial, pemilik, ref price, pembeli, harga jual, rencana biaya ganti
- [x] Badge: days since swap (merah jika > 7 hari)
- [x] Badge: mint year next to serial number
- [x] "Catat Pengganti" button → pre-filled locked Beli Stok form
- [x] Empty state when all swaps fulfilled

---

## Pembelian (`/admin/purchases`)

### Tab: Beli Stok
- [x] Table: bukti beli (linked), tgl beli, supplier, unit detail, total, spot price, catatan
- [x] Per-unit badge: Stok or Swap
- [x] Filter: search (invoice no, supplier, serial), gramasi, date range
- [x] Pagination

### Tab: Konsinyasi
- [x] Table: bukti, tanggal, supplier, produk, serial, harga beli, harga jual, margin, pembeli
- [x] Supplier/produk/serial resolved via fallback (ConsignmentLine → StockUnit)
- [x] Filter: search (supplier, serial), gramasi, date range
- [x] Pagination
- [x] KPIs: total item, total harga beli ke supplier, total margin

---

## Penjualan (`/admin/sales`)
- [x] Transaction list with all modes (own_stock, consignment, swap)
- [x] Filter: search (invoice, receipt, buyer), status, mode, gramasi, date range
- [x] Mode badge per line
- [x] Status badge (pending / paid)
- [x] Swap warning badge if replacement not yet recorded
- [x] Pagination with filter persistence
- [x] KPI cards (all-time: revenue, margin, units)

---

## Invoices & Documents

### Sales Invoice INV (`/admin/invoices/sales/[id]`)
- [x] Full invoice layout with logo, buyer/seller info, item table
- [x] Status management (mark paid → generates KWT)
- [x] Print button
- [x] Share via WhatsApp button
- [x] QR code
- [x] A5 print layout with zoom

### Receipt KWT (`/admin/invoices/receipts/[id]`)
- [x] Receipt layout (shown after payment)
- [x] Print + WhatsApp share
- [x] Sticky toolbar (mobile-responsive)

### Purchase Invoice PO (`/admin/invoices/purchases/[id]`)
- [x] Purchase order layout
- [x] Print + WhatsApp share
- [x] Item table with serial/cert/condition/price

### Consignment Bukti Beli (`/admin/invoices/consignment/[id]`)
- [x] "Bukti Beli / Buyback" document
- [x] Supplier/product/serial via fallback chain
- [x] Print + WhatsApp share
- [x] Sticky toolbar matching sales invoice style

---

## Reports

### Laba Bulanan (`/admin/reports/profit`)
- [x] Monthly P&L table (revenue, COGS, margin, unit count)
- [x] Bar chart: revenue vs COGS per month
- [x] Year selector
- [x] Totals row

---

## Master Data

### Counterparties (`/admin/counterparties`)
- [x] List buyers and suppliers
- [x] Role badges (buyer / supplier / both)

### Users (`/admin/users`)
- [x] Admin user management

### Akun Saya (`/admin/account`)
- [x] Tampil info akun: nama, email, role, membership
- [x] Form ganti password (verifikasi password lama sebelum update)

---

## Navigation & UI

### Sidebar
- [x] Group-based navigation (Home, Produk, Harga Antam, Stok, Transaksi, Laporan, Master Data, Akun)
- [x] Active state highlighting (URL-aware, including `?tab=` params)
- [x] Collapsible submenu groups (Harga, Catat Transaksi)
- [x] Outstanding swap count badge on "Outstanding Swaps" item
- [x] Outstanding swap badge on "Catat Transaksi" parent when collapsed
- [x] Logo links to landing page (`/`)
- [x] Mobile: slides in from left, overlay backdrop

### QuickAdd Components
- [x] QuickAdd counterparty (buyer or supplier): search existing → add role, or create new
- [x] QuickAdd owner: name + type form
- [x] QuickAddProduct: create new product form (no search step)

---

## Scripts

- [x] `import-stock.ts` — Batch import from Google Sheets (dry-run + confirm)
- [x] `import-sales.ts` — Batch import from CSV (dry-run + confirm)
- [x] `backfill-paid-status.ts` — One-time migration: mark all transactions paid
- [x] `merge-counterparty.ts` — Merge duplicate counterparties (dry-run + confirm)

---

## Documentation

- [x] `docs/architecture.md` — folder structure, tech stack, data flows
- [x] `docs/business-rules.md` — all business logic
- [x] `docs/api-contracts.md` — all API endpoints with request/response
- [x] `docs/decisions.md` — technical decisions with reasoning
- [x] `docs/progress.md` — this file
- [x] `AGENTS.md` — updated with project conventions (no Tailwind, prisma db push, etc.)
- [x] `CLAUDE.md` — imports all docs + end-of-session update instructions

---

## Security

- [x] Auth guard (`requireAdmin`) on all API mutation endpoints (POST/PATCH/DELETE)
- [x] Auth guard on all sensitive GET endpoints (units, summary, swap-events, margin, transactions, purchase-orders, products, owners, counterparties)
- [x] Security headers in `next.config.ts` (X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy, Permissions-Policy)
- [x] CRON_SECRET undefined-bypass fix in `sync-harga` route
- [x] Google Sheets row limit (10,000 max) to prevent memory exhaustion
- [x] Input validation on `purchase-orders` POST (price > 0, date validity, required fields)
- [x] Input validation on `transactions` POST (price > 0, date validity, per-line type checks)
- [x] Error messages in `users/actions.ts` sanitized — Prisma errors no longer leaked to client
- [x] Helper `src/lib/api-auth.ts` — single source of truth for admin auth check

---

## Not Yet Implemented / Known Gaps

- [x] Rate limiting on login — account lockout after 5 failed attempts, 15-min cooldown (DB-based, no Redis needed)
- [ ] Consignment settlement workflow (mark ConsignmentLine as settled, pay supplier)
- [ ] Ownership transfer UI (OwnershipTransfer model exists but no admin page)
- [ ] Reserved status usage (StockUnit.status='reserved' not used in any flow)
- [x] User self-registration flow (`/register`) — public, role=user by default
- [ ] Gold spot price auto-capture on transaction (field exists, not yet populated automatically)
- [ ] Multi-line consignment per transaction via UI (form only supports single line)
- [ ] Condition field still in DB and display (removed from forms but column remains)
