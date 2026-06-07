# Architecture

## Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Next.js | 16.2.6 | App Router, server components |
| UI | React | 19.2.4 | |
| Database | PostgreSQL (Neon) | — | Serverless, edge-compatible |
| ORM | Prisma | 7.8.0 | With `@prisma/adapter-neon` |
| Auth | NextAuth.js | 5.0.0-beta.31 | Credentials provider, JWT strategy |
| Styling | Tailwind CSS | 4 | Minimal use — most styles are inline |
| Icons | Lucide React | 1.17.0 | |
| PDF | jsPDF + html2canvas | 4.2.1 / 1.4.1 | Invoice export |
| QR Code | qrcode | 1.5.4 | On invoices |
| Google API | googleapis | 171.4.0 | Price sync from Sheets |
| Analytics | @vercel/analytics | 2.0.1 | |
| Deployment | Vercel | — | Inferred from config |

---

## Folder Structure

```
clemira-gold/
├── docs/                        # Project documentation
├── prisma/
│   ├── schema.prisma            # Database schema (single source of truth)
│   └── migrations/              # Auto-generated migration history
├── public/                      # Static assets (Logo CG.png, etc.)
├── scripts/                     # One-off and maintenance scripts
│   ├── import-stock.ts          # Batch import stock from Google Sheets
│   ├── import-sales.ts          # Batch import sales from CSV
│   ├── backfill-paid-status.ts  # One-time migration: mark old tx as paid
│   └── merge-counterparty.ts    # Merge duplicate counterparty records
└── src/
    ├── app/
    │   ├── (public)/            # Landing pages (public, no auth)
    │   ├── login/               # Login page
    │   ├── admin/               # Admin panel (auth-gated)
    │   │   ├── layout.tsx       # Auth guard + outstanding swap count
    │   │   ├── page.tsx         # Dashboard
    │   │   ├── products/        # Product SKU management
    │   │   ├── stock/
    │   │   │   ├── page.tsx     # Stock overview
    │   │   │   ├── units/       # Individual unit inventory
    │   │   │   └── recap/       # Stock recap with Antam valuation
    │   │   ├── sales/           # Transaction list
    │   │   ├── purchases/       # Purchase orders + consignment tab
    │   │   ├── transactions/
    │   │   │   ├── new/         # Create transaction form (4 tabs)
    │   │   │   └── outstanding-swaps/
    │   │   ├── price/           # Gold price management
    │   │   ├── invoices/
    │   │   │   ├── sales/[id]/     # INV document
    │   │   │   ├── receipts/[id]/  # KWT document
    │   │   │   ├── purchases/[id]/ # PO document
    │   │   │   └── consignment/[id]/ # Bukti beli konsinyasi
    │   │   ├── reports/profit/  # Monthly P&L
    │   │   ├── counterparties/  # Buyer/supplier contacts
    │   │   └── users/           # User management
    │   └── api/
    │       ├── auth/            # NextAuth handler
    │       ├── sync-harga/      # Cron: sync Antam prices
    │       ├── price/           # Price queries (daily/monthly/yearly/predict)
    │       ├── chart-data/      # Time-series chart data
    │       ├── stock/           # Stock CRUD (owners/products/units/counterparties/POs/swaps)
    │       └── sales/           # Transaction CRUD + margin reporting
    ├── components/
    │   ├── admin/               # Admin UI components
    │   ├── landing/             # Public landing page components
    │   ├── price/               # Gold price display components
    │   ├── sale/                # Product showcase components
    │   └── shared/              # Shared utilities (WhatsApp popover, etc.)
    └── lib/
        ├── prisma.ts            # Prisma client with Neon adapter
        ├── auth.ts              # NextAuth config
        ├── auth.config.ts       # JWT callbacks, session strategy
        ├── google-sheets.ts     # Fetch prices from Google Sheets
        ├── predict.ts           # Holt's exponential smoothing
        └── invoice.ts           # Sequential invoice number generator
```

---

## Database Schema Overview

```
User ──────────────────────────────────── (auth only)

HargaAntam (tanggal, gramasi, harga)     (gold prices from Antam)

Owner ◄──────────────────── StockUnit ──► Product
                                │
                         (each physical gold bar/coin)
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                  │
       PurchaseOrderLine   TransactionLine    SwapEvent
              │                 │
       PurchaseOrder    (fulfillmentMode)
              │           own_stock ──► StockUnit.status=sold
       Counterparty       consignment ──► ConsignmentLine ──► Counterparty
                          swap ──► SwapEvent ──► replacement StockUnit
```

### Key Models at a Glance

| Model | Purpose |
|-------|---------|
| `Owner` | Who holds the gold (entity or personal) |
| `Product` | Gold SKU (brand + weight + series) |
| `StockUnit` | Individual physical gold piece |
| `PurchaseOrder` | Batch buy from supplier |
| `PurchaseOrderLine` | Unit-level detail within PO |
| `Transaction` | Sale event |
| `TransactionLine` | Per-item within sale, with COGS/margin |
| `ConsignmentLine` | Detail for pass-through sales |
| `SwapEvent` | Customer trades old unit for new |
| `HargaAntam` | Antam official gold prices |
| `InvoiceCounter` | Sequential document numbering |
| `Counterparty` | Buyers and suppliers |

---

## Main Data Flows

### 1. Stock Purchase (Beli Stok)
```
Admin form
  → POST /api/stock/purchase-orders
    → Generate invoice no (PO/YYYY/MM/NNNNN)
    → Create StockUnit (status=available)
    → Create PurchaseOrderLine (unitPrice = actual cost)
    → If swapEventId: copy referencePrice from original unit
    → If new unit: actualPurchasePrice = referencePrice
```

### 2. Sales — Own Stock
```
Admin form
  → POST /api/sales/transactions (fulfillmentMode=own_stock)
    → Generate invoice no (INV/YYYY/MM/NNNNN)
    → COGS = unit.referencePrice
    → margin = sellPrice - COGS
    → StockUnit.status → sold
    → (Optional) PATCH → status=paid, generates KWT/YYYY/MM/NNNNN
```

### 3. Sales — Swap
```
Admin form
  → POST /api/sales/transactions (fulfillmentMode=swap)
    → Creates SwapEvent (replacementUnitId=null) — "outstanding"
    → originalUnit.status → swapped_out
    → COGS = replacementCost (committed cost for new unit)
  
  Later:
  → POST /api/stock/purchase-orders (with swapEventId)
    → Creates replacement StockUnit
    → SwapEvent.replacementUnitId set
    → New unit inherits referencePrice from original
```

### 4. Sales — Consignment
```
Admin form
  → POST /api/sales/transactions (fulfillmentMode=consignment)
    → Creates ConsignmentLine (no StockUnit created)
    → COGS = supplierPurchasePrice
    → margin = sellPrice - supplierPurchasePrice
```

### 5. Price Sync
```
Cron (secured by CRON_SECRET)
  → GET /api/sync-harga
    → Reads Google Sheets (service account auth)
    → Upserts HargaAntam rows (tanggal + gramasi unique)
    → Processes in 50-row batches
```

---

## Authentication Flow

```
/login page
  → POST /api/auth/callback/credentials (NextAuth)
    → Looks up User by email
    → bcryptjs.compare(password, user.password)
    → Returns JWT with {id, email, name, role, membership}

All /admin/* routes:
  → AdminLayout checks session.user.role === "admin"
  → Redirects to /login if not authenticated or not admin
```

---

## Invoice Number Format

| Type | Prefix | Generated When |
|------|--------|---------------|
| Sales invoice | `INV` | Transaction created |
| Purchase order | `PO` | Purchase order created |
| Receipt | `KWT` | Transaction marked paid |

Format: `{PREFIX}/{YYYY}/{MM:02d}/{SEQ:05d}`
Example: `INV/2025/06/00042`

Counter is atomic per (prefix, year, month) — resets monthly, increments sequentially.
