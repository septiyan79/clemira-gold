import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNo } from "@/lib/invoice";

type Params = { params: Promise<{ id: string }> };

// PATCH — konfirmasi pembayaran → generate kwitansi
export async function PATCH(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const tx = await prisma.transaction.findUnique({
    where: { id },
    select: { status: true, transactedAt: true },
  });

  if (!tx) return Response.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
  if (tx.status === "paid") return Response.json({ error: "Sudah lunas" }, { status: 409 });

  const updated = await prisma.$transaction(async (ptx) => {
    const receiptNo = await generateInvoiceNo("KWT", ptx, new Date());
    return ptx.transaction.update({
      where: { id },
      data: { status: "paid", receiptNo, paidAt: new Date() },
      select: { id: true, receiptNo: true, paidAt: true },
    });
  });

  return Response.json(updated);
}

// DELETE — hapus transaksi & pulihkan status stok
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const tx = await prisma.transaction.findUnique({
    where: { id },
    include: {
      lines: {
        include: {
          swapEvent: true,
          consignmentLine: true,
        },
      },
    },
  });

  if (!tx) return Response.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
  if (tx.status === "paid") return Response.json({ error: "Transaksi yang sudah lunas tidak dapat dihapus" }, { status: 403 });

  await prisma.$transaction(async (ptx) => {
    for (const line of tx.lines) {
      if (line.fulfillmentMode === "own_stock" && line.stockUnitId) {
        await ptx.stockUnit.update({
          where: { id: line.stockUnitId },
          data: { status: "available" },
        });
      }

      if (line.fulfillmentMode === "swap" && line.swapEvent) {
        // Pulihkan unit asli yang di-swap
        await ptx.stockUnit.update({
          where: { id: line.swapEvent.originalUnitId },
          data: { status: "available" },
        });
        await ptx.swapEvent.delete({ where: { id: line.swapEvent.id } });
      }

      if (line.fulfillmentMode === "consignment" && line.consignmentLine) {
        await ptx.consignmentLine.delete({ where: { id: line.consignmentLine.id } });
      }
    }

    await ptx.transactionLine.deleteMany({ where: { transactionId: id } });
    await ptx.transaction.delete({ where: { id } });
  });

  return Response.json({ success: true });
}
