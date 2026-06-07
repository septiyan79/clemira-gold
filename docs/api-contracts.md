# API Contracts

Base URL: `/api`

All request bodies are JSON unless noted. All responses are JSON.

---

## Authentication

### `POST /api/auth/callback/credentials`
Handled by NextAuth.js internally.

**Body:** `{ email, password }`  
**Response:** Sets session cookie (JWT). Redirects on success/failure.

---

## Gold Prices

### `GET /api/sync-harga`
Sync Antam gold prices from Google Sheets. Intended for cron jobs.

**Auth:** `Authorization: Bearer {CRON_SECRET}`

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `full` | boolean | false | Sync all history vs latest date only |

**Response 200:**
```json
{
  "synced": 15,
  "total": 15,
  "fullSync": false,
  "errors": [],
  "timestamp": "2025-06-07T10:00:00.000Z"
}
```

---

### `GET /api/price/daily`
Get 1gr sell and buyback prices for a given date and the previous trading day.

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `date` | YYYY-MM-DD | today | Target date |

**Response 200:**
```json
{
  "rows": [
    { "gramasi": "1 gram", "harga": 759500, "isBB": false, "gram": 1 },
    { "gramasi": "1g BB",  "harga": 733000, "isBB": true,  "gram": 1 }
  ],
  "prevRows": [...],
  "date": "2025-06-07",
  "prevDate": "2025-06-06"
}
```

---

### `GET /api/price/monthly`
All daily prices (sell + buyback) for a given month.

**Query Params:** `year` (number), `month` (number, 1–12)

**Response 200:** Array of `{ date, sell, bb }` for each day in the month.

---

### `GET /api/price/yearly`
Last sell + buyback price per month for a given year.

**Query Params:** `year` (number)

**Response 200:** Array of up to 12 entries `{ month, sell, bb }`.

---

### `GET /api/price/predict`
Predict next-day gold price using Holt's double exponential smoothing.

**Cache:** `s-maxage=3600, stale-while-revalidate=300`

**Response 200:**
```json
{
  "predictedDate": "2025-06-08",
  "predictedSell": 758000,
  "lower": 756500,
  "upper": 759500,
  "trend": 200,
  "basedOnDate": "2025-06-07",
  "dataPoints": 45
}
```

---

### `GET /api/chart-data`
Time-series price data for charting.

**Query Params:** `period` — `"1m"` | `"3m"` | `"1y"`

**Cache:** `no-store`

**Response 200:** Array of `{ date: "YYYY-MM-DD", sell: number, bb: number }`.

---

## Stock — Owners

### `GET /api/stock/owners`
**Response 200:** `Owner[]`

### `POST /api/stock/owners`
**Body:**
```json
{ "name": "Toko", "type": "entity", "notes": "optional" }
```
`type`: `"entity"` | `"personal"`

**Response 201:** Created `Owner`

---

## Stock — Products

### `GET /api/stock/products`
**Query Params:** `brand`, `series` (optional filters)

**Response 200:** `Product[]`

### `POST /api/stock/products`
**Body:**
```json
{
  "sku": "LM-ANTAM-1GR",
  "name": "LM Antam 1gr Regular",
  "weightGram": 1.000,
  "purity": "999.9",
  "brand": "antam",
  "series": "regular"
}
```
**Response 201:** Created `Product`

---

## Stock — Units

### `GET /api/stock/units`
**Query Params:**
| Param | Description |
|-------|-------------|
| `status` | Filter by status (`available`, `sold`, etc.) |
| `ownerId` | Filter by owner |
| `productId` | Filter by product |
| `mintYear` | Filter by mint year |

**Response 200:** `StockUnit[]` with nested `product`, `owner`, `purchaseOrderLine`

---

## Stock — Summary

### `GET /api/stock/summary`
Aggregated stock grouped by owner + brand + series + weightGram + mintYear.

**Response 200:**
```json
[
  {
    "owner": "Toko",
    "brand": "antam",
    "series": "regular",
    "weightGram": 1.0,
    "mintYear": 2023,
    "unitCount": 5,
    "totalCogs": 3797500
  }
]
```

---

## Stock — Counterparties

### `GET /api/stock/counterparties`
**Query Params:**
| Param | Description |
|-------|-------------|
| `role` | `"buyer"` or `"supplier"` (filter by type array) |
| `q` | Search by name (for autocomplete) |

**Response 200:** `Counterparty[]`

### `POST /api/stock/counterparties`
**Body:**
```json
{ "name": "PT Supplier", "type": ["supplier"], "phone": "081234", "notes": "..." }
```
**Response 201:** Created `Counterparty`

### `GET /api/stock/counterparties/[id]`
**Response 200:** `Counterparty`  
**Response 404:** `{ "error": "Not found" }`

### `PATCH /api/stock/counterparties/[id]`
**Body (any combination):**
```json
{
  "name": "New Name",
  "type": ["buyer", "supplier"],
  "phone": "081234",
  "notes": "...",
  "addRole": "buyer"
}
```
`addRole` merges a single role into the existing type array without overwriting others.

**Response 200:** Updated `Counterparty`

---

## Stock — Purchase Orders

### `GET /api/stock/purchase-orders`
**Response 200:** `PurchaseOrder[]` with supplier + lines (with stockUnit details)

### `POST /api/stock/purchase-orders`
Creates a purchase order and all associated stock units atomically.

**Body:**
```json
{
  "supplierId": "cuid",
  "goldSpotPrice": 758000,
  "totalAmount": 759500,
  "purchasedAt": "2025-06-07T00:00:00Z",
  "notes": "optional",
  "units": [
    {
      "productId": "cuid",
      "ownerId": "cuid",
      "serialNumber": "AG123456",
      "certCode": "C12345",
      "mintYear": 2023,
      "unitPrice": 759500,
      "swapEventId": "cuid_or_omit"
    }
  ]
}
```

**Business logic:**
- Generates `PO/YYYY/MM/NNNNN` invoice number
- Each unit: creates `StockUnit` (status=`available`)
- If `swapEventId` provided: inherits `referencePrice` from original unit, updates `SwapEvent.replacementUnitId`
- Otherwise: `referencePrice = actualPurchasePrice = unitPrice`

**Response 201:** Created `PurchaseOrder` with lines

**Response 400:** `{ "error": "..." }` for missing fields  
**Response 404:** `{ "error": "..." }` for invalid swapEventId

---

## Stock — Swap Events

### `GET /api/stock/swap-events`
**Query Params:**
| Param | Description |
|-------|-------------|
| `open` | `"true"` — only events with `replacementUnitId IS NULL` |
| `originalUnitId` | Filter by original unit |

**Response 200:** `SwapEvent[]` with `originalUnit` details

---

## Sales — Transactions

### `GET /api/sales/transactions`
**Response 200:** `Transaction[]` with buyer, lines (stockUnit, consignmentLine, swapEvent)

### `POST /api/sales/transactions`
Creates a sale transaction. Supports mixed modes in a single transaction.

**Body:**
```json
{
  "buyerId": "cuid_or_omit",
  "goldSpotPrice": 758000,
  "transactedAt": "2025-06-07T00:00:00Z",
  "notes": "optional",
  "lines": [
    {
      "fulfillmentMode": "own_stock",
      "stockUnitId": "cuid",
      "sellPrice": 800000
    },
    {
      "fulfillmentMode": "consignment",
      "sellPrice": 850000,
      "consignment": {
        "supplierId": "cuid",
        "productId": "cuid_or_omit",
        "serialNumber": "AG123456",
        "certCode": "C12345",
        "mintYear": 2023,
        "supplierPurchasePrice": 780000
      }
    },
    {
      "fulfillmentMode": "swap",
      "stockUnitId": "cuid",
      "sellPrice": 800000,
      "swap": {
        "supplierId": "cuid_or_omit",
        "replacementCost": 760000
      }
    }
  ]
}
```

**Validation:**
- `fulfillmentMode` must be `own_stock` | `consignment` | `swap`
- `stockUnitId` required for `own_stock` and `swap`
- `consignment` object required for `consignment` mode
- `swap.replacementCost` required for `swap` mode

**COGS per mode:**
- `own_stock`: `unit.referencePrice`
- `consignment`: `consignment.supplierPurchasePrice`
- `swap`: `swap.replacementCost`

**Side effects per mode:**
- `own_stock`: `StockUnit.status` → `sold`
- `swap`: `StockUnit.status` → `swapped_out`, creates `SwapEvent`
- `consignment`: creates `ConsignmentLine`

**Response 201:** Created `Transaction` with lines

---

### `PATCH /api/sales/transactions/[id]`
Mark a transaction as paid, generating a KWT receipt number.

**Response 200:**
```json
{ "id": "cuid", "receiptNo": "KWT/2025/06/00001", "paidAt": "2025-06-07T..." }
```

**Response 400:** Already paid  
**Response 404:** Transaction not found

---

### `DELETE /api/sales/transactions/[id]`
Delete an unpaid transaction and restore stock unit statuses.

**Validation:** Transaction must be `status = "pending"`

**Side effects:**
- `own_stock` units → status restored to `available`
- `swap` units → status restored to `available`, `SwapEvent` deleted
- `consignment` → `ConsignmentLine` deleted

**Response 200:** `{ "success": true }`

**Response 400:** `{ "error": "Transaksi yang sudah dibayar tidak bisa dihapus" }`

---

## Sales — Margin

### `GET /api/sales/margin`
Line-level margin data for reporting.

**Query Params:**
| Param | Format | Description |
|-------|--------|-------------|
| `from` | YYYY-MM-DD | Start date (inclusive) |
| `to` | YYYY-MM-DD | End date (inclusive) |

**Response 200:**
```json
[
  {
    "transactionLineId": "cuid",
    "transactedAt": "2025-06-07T...",
    "buyer": "Customer Name",
    "brand": "antam",
    "weightGram": 1.0,
    "mintYear": 2023,
    "owner": "Toko",
    "fulfillmentMode": "own_stock",
    "sellPrice": 800000,
    "cogs": 750000,
    "margin": 50000
  }
]
```

---

## Error Response Format

All errors follow:
```json
{ "error": "Human-readable error message" }
```

Common status codes:
| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad request / validation error |
| 401 | Unauthorized (missing/invalid auth) |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate SKU) |
| 500 | Internal server error |
