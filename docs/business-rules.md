# Business Rules

## Gold Unit Lifecycle

### Status Transitions

```
available ──► sold         (own_stock sale)
available ──► swapped_out  (swap transaction)
available ──► reserved     (manual hold — not yet used in UI)
```

A unit can never go back to `available` once sold or swapped out. The only exception is when a transaction is **deleted** (which is only allowed if the transaction is still `pending`/unpaid).

### referencePrice vs actualPurchasePrice

Every `StockUnit` has two price fields:

| Field | Meaning | Set When |
|-------|---------|----------|
| `actualPurchasePrice` | What we actually paid for this unit | PurchaseOrder creation |
| `referencePrice` | Valuation anchor for COGS calculation | Same as actual for new purchases; **inherited from original unit** for swap replacements |

The distinction matters for swaps: if we swap a unit whose original `referencePrice` was 750,000 and buy a replacement for 760,000, the swap's COGS remains 750,000 (using the chain's original reference). This reflects the ongoing obligation to the customer, not our re-sourcing cost.

---

## Fulfillment Modes

### own_stock
- Unit must be in `available` status before sale
- COGS = `unit.referencePrice`
- After sale: `unit.status` → `sold`

### consignment
- No stock unit involved — supplier's item, not ours
- COGS = `supplierPurchasePrice` (what supplier charges us)
- `ConsignmentLine` created with supplier details
- Supplier data: `productId`, `serialNumber`, `certCode`, `mintYear` all required (from UI)
- For script-imported data: product/serial pulled from linked `stockUnit` via fallback

### swap
- Customer brings their old unit (we record `originalUnitId`)
- We commit to sourcing a replacement (`replacementCost` = estimated cost)
- COGS = `replacementCost`
- `originalUnit.status` → `swapped_out`
- `SwapEvent` created with `replacementUnitId = null` → becomes "outstanding"
- Replacement is sourced later via a separate purchase order with `swapEventId`
- When replacement PO is created: `SwapEvent.replacementUnitId` set, unit inherits `referencePrice`

---

## COGS Calculation

| Mode | COGS Source |
|------|------------|
| `own_stock` | `StockUnit.referencePrice` |
| `consignment` | `ConsignmentLine.supplierPurchasePrice` |
| `swap` | `SwapEvent.replacementCost` (committed estimate) |

`margin = sellPrice - cogs` — stored explicitly on `TransactionLine`, never recalculated.

---

## Invoice & Receipt Rules

- **INV** (invoice): generated at transaction creation regardless of payment status
- **KWT** (receipt): generated only when `status` transitions `pending → paid`
- A transaction cannot be deleted if `status = paid`
- Only one KWT per transaction (cannot re-pay)

---

## Transaction Deletion Rules

- Only `pending` (unpaid) transactions can be deleted
- On deletion:
  - `own_stock` units: status restored to `available`
  - `swap` units: status restored to `available`, `SwapEvent` deleted
  - `consignment` lines: `ConsignmentLine` deleted
- All `TransactionLine` records deleted, then `Transaction` deleted

---

## Outstanding Swaps

A swap is "outstanding" when `SwapEvent.replacementUnitId IS NULL`.

- Displayed on `/admin/transactions/outstanding-swaps`
- Badge count shown in sidebar on "Outstanding Swaps" item and "Catat Transaksi" parent
- "Catat Pengganti" button pre-fills the Beli Stok form:
  - **Locked**: product, owner, swapEventId (cannot be changed)
  - **Pre-filled**: unitPrice (from `replacementCost`), supplierId (from `SwapEvent`)
  - **Shown in banner**: S/N of original unit

---

## Antam Gold Prices

### Storage Format
- Table: `HargaAntam`
- `tanggal`: date (unique per gramasi per date)
- `gramasi`: string — e.g. `"1 gram"`, `"5g"`, `"1g BB"` (buyback suffix)
- `harga`: bigint — total price for that denomination

### Buyback Detection
- A row is buyback if `gramasi` contains `"BB"` (case-insensitive)

### Multi-Weight Buyback Calculation
- Antam only provides an explicit buyback price for 1gr
- For other weights: `buyback = bb1gr × weightGram`
- This is computed at read time in `stock/recap/page.tsx` and elsewhere

### Price Sync
- Automated via `GET /api/sync-harga` (cron, secured with `CRON_SECRET`)
- Source: Google Sheets (service account with Viewer access)
- Upserts on `(tanggal, gramasi)` — idempotent

---

## Product Management

- Products are SKUs: brand + weight + series + purity
- `weightGram` stored as `Decimal(8,3)` — supports fractional grams (e.g. 0.500)
- SKU must be unique across all products
- Deleting a product is blocked if any `StockUnit` references it (any status)

---

## Counterparty Roles

- `type` is an array of strings: `["buyer"]`, `["supplier"]`, or `["buyer", "supplier"]`
- A counterparty can hold multiple roles simultaneously
- Role can be added via `PATCH /api/stock/counterparties/[id]` with `addRole`
- QuickAdd in forms automatically adds role if the counterparty already exists under a different role

---

## Stock Valuation (Rekap Stok)

The recap page shows three valuation columns per group:

| Column | Calculation |
|--------|------------|
| Jumlah Gramasi | `weightGram × qty` |
| Nilai Harga Dasar | `antam_dasar × weightGram × qty` |
| Nilai Buyback | `bb1gr × weightGram × qty` |

Only `available` units are included in the recap.

---

## Margin & Reporting

- `margin = sellPrice - cogs` — stored in DB, never recalculated
- Profit report (`/admin/reports/profit`) groups by month/year
- KPI on dashboard shows current month vs all-time
- Consignment "harga beli" on purchases page uses `TransactionLine.cogs` as fallback when no `ConsignmentLine` exists (script-imported data)

---

## Access Control

- All `/admin/*` routes require `session.user.role === "admin"`
- Non-admin users and unauthenticated requests are redirected to `/login`
- The cron endpoint (`/api/sync-harga`) uses `Authorization: Bearer {CRON_SECRET}` — no user session

---

## Supplier Fallback for Consignment

For consignment transactions, the supplier is resolved via this fallback chain:

```
consignmentLine?.supplier                                   (UI-created)
  ?? stockUnit?.purchaseOrderLine?.purchaseOrder?.supplier  (script-imported)
```

Similarly for product and serial number:
```
consignmentLine?.product    ?? stockUnit?.product
consignmentLine?.serialNumber ?? stockUnit?.serialNumber
```
