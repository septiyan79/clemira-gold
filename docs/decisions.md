# Technical Decisions

## Database & ORM

### Prisma + Neon (serverless PostgreSQL)
The project uses Prisma with the `@prisma/adapter-neon` serverless adapter instead of a traditional PostgreSQL connection pool. This is because the app runs on Vercel's serverless/edge environment where persistent TCP connections aren't viable. Neon's HTTP-based driver handles connection pooling at the infrastructure level.

**Consequence:** `prisma db push` is used alongside migrations because migration drift is common — new columns added via `prisma db push` when the migration history is out of sync with the actual DB state.

### Decimal over Float for Prices
All money fields use `Decimal(14,2)` and Antam prices use `BigInt`. This prevents floating-point rounding errors in financial calculations. The downside is that every price read from Prisma requires `.toNumber()` or `.toFixed()` before use in JS.

### Explicit `margin` Column
`TransactionLine.margin` is stored as a computed column (`sellPrice - cogs`) rather than calculated at query time. This means historical margin data is immutable even if pricing logic changes, and reporting queries are simpler (no arithmetic in SQL).

---

## Architecture

### Next.js App Router + Server Components
Most admin pages are React Server Components fetching data directly with Prisma — no API layer needed for reads. This means:
- No `useEffect` / loading states for page data
- Simpler code (no client-side fetch on page load)
- Data is always fresh on navigation

Client components (`"use client"`) are used only where interactivity is needed: filters, forms, modals, inline edit tables.

### Server Actions for Admin Mutations (Products only)
The products page uses Server Actions (`actions.ts`) for create/update/delete instead of API routes. This is because the operations are simple CRUD with no shared consumers. Most other mutations use API routes because they're also called from scripts or could be called from external tools.

### Inline Styles over Tailwind
Despite Tailwind being installed, almost all styling uses inline React style objects. This is a deliberate choice for this project: inline styles are co-located with components, easy to maintain by a single developer, and avoid the build-step dependency on purging CSS classes. Tailwind is only used for global resets.

### URL-Based Filter State
All table filters (sales, purchases, stock units) persist state in URL params (`?q=...&dateFrom=...`). This allows:
- Sharing filtered URLs
- Browser back/forward navigation
- No client-side state management for filters

`useSearchParams` + `useRouter.replace` handles the client side; server components read `searchParams` prop.

---

## Forms & UI

### Single `TransactionForm` with Tab State
All transaction creation modes (Beli Stok, Jual Stok, Konsinyasi, Swap) live in one `TransactionForm` component with tab switching. Alternative was separate pages, but sharing state (products list, owners list, suppliers list) across tabs is simpler in one component since all data is fetched once on mount.

### QuickAdd Modal Pattern
Instead of navigating away to create a counterparty/owner/product mid-form, a modal QuickAdd component allows inline creation. The pattern is: search existing → create new → `onCreated(id, name)` callback updates parent state and auto-selects the new record. This avoids losing form state.

### `datalist` for Autocomplete
Native `<datalist>` is used for brand, gramasi, and series inputs instead of a custom dropdown. This keeps the implementation simple and accessible, though it has limited styling control across browsers. For more critical dropdowns (unit selection in swap), a custom search-filtered list is used.

### Two-Step Swap Unit Picker
The swap unit picker was originally two separate fields (search input + select dropdown). It was combined into a single combobox: type to filter, click to select, show info card below. This reduces cognitive overhead and prevents selecting a unit that doesn't match the search.

---

## Invoice & Documents

### Server-Side HTML-to-PDF vs Client-Side
Invoices are rendered as server-side HTML pages (styled with inline CSS for print) rather than generating PDFs server-side. Printing is done via `window.print()` from the browser. This is simpler to build and maintain than server-side PDF generation (jsPDF is available but only used for client-side export in some components).

### Separate Invoice Routes for Each Type
Each document type has its own route (`/admin/invoices/sales/[id]`, `/admin/invoices/purchases/[id]`, `/admin/invoices/receipts/[id]`, `/admin/invoices/consignment/[id]`) rather than a single parameterized route with a `type` param. This allows each document type to have different layouts, data queries, and print settings without complex conditional rendering.

---

## Data Import

### CSV/Sheets Import Scripts over UI
Stock and sales data were historically imported via `npx tsx scripts/...` rather than built in the UI. This is intentional for initial data migration — it allows dry-run preview, row-level error reporting, and bulk processing without timeout concerns. The scripts delete-and-reimport rather than merging, which makes them idempotent but destructive.

### `import-sales.ts` Doesn't Create ConsignmentLine
The script predates the full `ConsignmentLine` schema and creates only `Transaction + TransactionLine` for consignment rows. As a result, the purchases consignment tab queries `TransactionLine` directly (not `ConsignmentLine`) and uses a fallback chain to resolve supplier/product/serial from either `ConsignmentLine` or `StockUnit` relations.

---

## Price Prediction

### Holt's Double Exponential Smoothing
A simple statistical model (Holt's method) is used for next-day price prediction rather than ML. Reasons:
- Gold price data is relatively small (45-day window)
- No model training/hosting infrastructure needed
- Transparent and deterministic
- Parameters: alpha=0.3 (level), beta=0.1 (trend), 45-day history

The prediction includes a confidence interval (±1.5 standard deviations of recent residuals).

---

## Authentication

### Credentials-Only Auth
Only email/password login is supported — no OAuth providers. The project is a single-admin internal tool where managing Google/GitHub app credentials would be disproportionate overhead. `bcryptjs` handles password hashing.

### JWT Strategy (not Database Sessions)
`next-auth` is configured with `strategy: "jwt"` rather than database sessions. This avoids session table writes on every request and is appropriate for an admin tool where session invalidation is not a critical concern.

---

## Sequential Invoice Numbers

### Custom `InvoiceCounter` Table
Rather than relying on PostgreSQL sequences or UUIDs for invoice numbers, a dedicated `InvoiceCounter` table with an upsert+increment pattern generates human-readable sequential numbers per (prefix, year, month). This ensures:
- Human-readable references (`INV/2025/06/00042`)
- Monthly reset (resets per month)
- Multiple document types from same counter mechanism
- Atomic increment (no race conditions with upsert)

The downside is an extra round-trip per invoice creation, but this is acceptable for the low-volume admin context.

---

## Consignment Purchases Tab Queries TransactionLine, Not ConsignmentLine

The purchases page consignment tab queries `TransactionLine WHERE fulfillmentMode='consignment'` instead of querying `ConsignmentLine` directly. This is because `import-sales.ts` creates `TransactionLine` records with `fulfillmentMode='consignment'` but does NOT create `ConsignmentLine` records — so querying `ConsignmentLine` only returns UI-created records, missing all historically imported data.

Supplier, product, and serial number are resolved via a fallback chain:
- `consignmentLine?.supplier ?? stockUnit?.purchaseOrderLine?.purchaseOrder?.supplier`
- `consignmentLine?.product ?? stockUnit?.product`
- `consignmentLine?.serialNumber ?? stockUnit?.serialNumber`

---

## Swap Unit Picker as Combobox (Not Two Separate Fields)

The swap tab originally had two fields: a text search input and a separate `<select>` dropdown. These were merged into a single combobox: type to filter a floating dropdown, click to select, show info card below. The two-field pattern required mental context-switching and allowed selecting a unit that didn't match the typed search.

---

## Replacement Mode Locks Product and Owner in Beli Stok Form

When navigating from "Outstanding Swaps → Catat Pengganti", the Beli Stok form enters a locked replacement mode. Product, owner, and swap event fields are pre-filled and non-editable (shown as static text). The "Tambah Unit" button is hidden (only one replacement per swap). This prevents human error where the user might accidentally select a different product or owner than the original unit being replaced.

---

## No Tailwind Utilities — Keep Inline Styles

Considered migrating all inline styles to Tailwind utility classes. Decided against it because:
- Almost all colors are project-specific RGBA values requiring arbitrary value syntax (`bg-[rgba(201,168,76,0.12)]`) — no shorter than inline styles
- Dynamic/conditional styles can't safely use interpolated class names (Tailwind purger removes them)
- Invoice pages require raw `@media print` CSS that Tailwind can't replace
- Migration risk is high with no visual benefit
