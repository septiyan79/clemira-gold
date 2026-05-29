import { Prisma } from "@prisma/client";

export async function generateInvoiceNo(
  prefix: "INV" | "PO",
  tx: Prisma.TransactionClient,
  atDate?: Date
): Promise<string> {
  const d = atDate ?? new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;

  const counter = await tx.invoiceCounter.upsert({
    where: { prefix_year_month: { prefix, year, month } },
    update: { seq: { increment: 1 } },
    create: { prefix, year, month, seq: 1 },
    select: { seq: true },
  });

  const seq = String(counter.seq).padStart(5, "0");
  const mm = String(month).padStart(2, "0");
  return `${prefix}/${year}/${mm}/${seq}`;
}
