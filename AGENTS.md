# Project Instructions — Clemira Gold

## Next.js Version Warning
This project uses Next.js 16 which has breaking changes from older versions. Read `node_modules/next/dist/docs/` before writing any code. `searchParams` is a `Promise` and must be awaited in server components.

---

## Styling — Never Use Tailwind Utilities
Tailwind is installed **only as a CSS reset** (`@import "tailwindcss"` in globals.css). Do NOT use utility classes like `flex`, `text-sm`, `p-4`, etc.

Use instead:
- **Inline `style={{}}` objects** — the primary approach for all components
- **Custom classes from `globals.css`** for hover effects and shared typography: `.fd` (Cormorant serif font), `.section-label`, `.adm-tr-hover`, `.btn-gold`, `.price-card`
- **Per-page `<style>` blocks** for invoice/document pages with scoped classes

---

## Database
- **Never run `prisma migrate dev`** — the migration history is out of sync with the live DB. Always use `prisma db push` for schema changes.
- All money fields: `Decimal(14,2)` — always call `.toNumber()` before using in JS.
- `StockUnit.referencePrice` ≠ `actualPurchasePrice` — see `docs/business-rules.md`.

---

## API Conventions
- POST returns 201, errors return `{ "error": "..." }`
- All `Decimal`/`BigInt` values must be converted to number in API responses
- Use Prisma `$transaction()` for any multi-table write operations
- Invoice numbers via `InvoiceCounter` table — never generate manually

---

## Admin UI Conventions
- Filter state lives in URL params (`useSearchParams` + `useRouter.replace`), not component state
- Server components fetch data directly with Prisma — no client-side fetch on page load
- Use `"use client"` only when interactivity is required (forms, modals, filter bars)
- QuickAdd pattern for inline creation: modal → `onCreated(id, name)` callback → auto-select
- All `<select>/<option>` elements need `style={{ background: "#1A1612", color: "#EDE8DE" }}` on options for dark theme

---

## Key Business Concepts
- **3 fulfillment modes**: `own_stock`, `consignment`, `swap` — each has different COGS source
- **Outstanding swap**: `SwapEvent.replacementUnitId IS NULL` — shown in sidebar badge
- **referencePrice** is the valuation anchor inherited through swap chains, not actual cost
- Full details in `docs/business-rules.md`
