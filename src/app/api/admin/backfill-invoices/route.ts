/**
 * ONE-TIME backfill route: generates invoiceNo for all existing Transactions
 * and PurchaseOrders that don't have one yet.
 *
 * DELETE THIS FILE after running it once.
 *
 * Usage: POST /api/admin/backfill-invoices
 */
import { prisma } from "@/lib/prisma";
import { generateInvoiceNo } from "@/lib/invoice";

export async function POST() {
  const [txUpdated, poUpdated] = await prisma.$transaction(async (tx) => {
    // Backfill sales invoices
    const transactions = await tx.transaction.findMany({
      where: { invoiceNo: null },
      orderBy: { transactedAt: "asc" },
      select: { id: true, transactedAt: true },
    });

    for (const t of transactions) {
      const invoiceNo = await generateInvoiceNo("INV", tx, t.transactedAt);
      await tx.transaction.update({ where: { id: t.id }, data: { invoiceNo } });
    }

    // Backfill purchase receipts
    const purchaseOrders = await tx.purchaseOrder.findMany({
      where: { invoiceNo: null },
      orderBy: { purchasedAt: "asc" },
      select: { id: true, purchasedAt: true },
    });

    for (const po of purchaseOrders) {
      const invoiceNo = await generateInvoiceNo("PO", tx, po.purchasedAt);
      await tx.purchaseOrder.update({ where: { id: po.id }, data: { invoiceNo } });
    }

    return [transactions.length, purchaseOrders.length];
  });

  return Response.json({
    message: "Backfill selesai",
    salesInvoicesGenerated: txUpdated,
    purchaseReceiptsGenerated: poUpdated,
  });
}
