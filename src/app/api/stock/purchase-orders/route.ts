import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNo } from "@/lib/invoice";

interface UnitInput {
  productId: string;
  ownerId: string;
  purchaseSourceId?: string;
  serialNumber?: string;
  certCode?: string;
  mintYear?: number;
  condition?: string;
  unitPrice: number;
  notes?: string;
  /**
   * Isi jika unit ini adalah pengganti dari swap.
   * Route akan mewarisi referencePrice dari original unit secara otomatis
   * dan mengupdate swap_events.replacementUnitId.
   */
  swapEventId?: string;
}

export async function GET() {
  const orders = await prisma.purchaseOrder.findMany({
    include: {
      supplier: true,
      lines: {
        include: { stockUnit: { include: { product: true, owner: true } } },
      },
    },
    orderBy: { purchasedAt: "desc" },
  });

  return Response.json(
    orders.map((o) => ({
      ...o,
      goldSpotPrice: o.goldSpotPrice?.toNumber() ?? null,
      totalAmount: o.totalAmount.toNumber(),
      lines: o.lines.map((l) => ({
        ...l,
        unitPrice: l.unitPrice.toNumber(),
        stockUnit: {
          ...l.stockUnit,
          actualPurchasePrice: l.stockUnit.actualPurchasePrice?.toNumber() ?? null,
          referencePrice: l.stockUnit.referencePrice?.toNumber() ?? null,
          product: {
            ...l.stockUnit.product,
            weightGram: l.stockUnit.product.weightGram.toNumber(),
          },
        },
      })),
    })),
  );
}

export async function POST(req: NextRequest) {
  const { supplierId, goldSpotPrice, totalAmount, purchasedAt, notes, units } =
    await req.json();

  if (!supplierId || !totalAmount || !Array.isArray(units) || units.length === 0) {
    return Response.json(
      { error: "supplierId, totalAmount, and units[] are required" },
      { status: 400 },
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const poDate = purchasedAt ? new Date(purchasedAt) : new Date();
    const invoiceNo = await generateInvoiceNo("PO", tx, poDate);

    const order = await tx.purchaseOrder.create({
      data: {
        supplierId,
        invoiceNo,
        goldSpotPrice,
        totalAmount,
        purchasedAt: poDate,
        notes,
      },
    });

    const lines = await Promise.all(
      (units as UnitInput[]).map(async (u) => {
        // For swap replacement units, inherit referencePrice from the original unit
        let referencePrice = u.unitPrice;
        if (u.swapEventId) {
          const swapEvent = await tx.swapEvent.findUnique({
            where: { id: u.swapEventId },
            include: { originalUnit: { select: { referencePrice: true } } },
          });
          if (swapEvent?.originalUnit.referencePrice) {
            referencePrice = swapEvent.originalUnit.referencePrice.toNumber();
          }
        }

        const stockUnit = await tx.stockUnit.create({
          data: {
            productId:          u.productId,
            ownerId:            u.ownerId,
            purchaseSourceId:   u.purchaseSourceId,
            serialNumber:       u.serialNumber,
            certCode:           u.certCode,
            mintYear:           u.mintYear,
            condition:          u.condition ?? "new",
            status:             "available",
            actualPurchasePrice: u.unitPrice,
            referencePrice,
          },
        });

        // Link replacement unit back to the swap event
        if (u.swapEventId) {
          await tx.swapEvent.update({
            where: { id: u.swapEventId },
            data: { replacementUnitId: stockUnit.id, replacementCost: u.unitPrice },
          });
        }

        return tx.purchaseOrderLine.create({
          data: {
            purchaseOrderId: order.id,
            stockUnitId:     stockUnit.id,
            unitPrice:       u.unitPrice,
            notes:           u.notes,
          },
        });
      }),
    );

    return { ...order, lines };
  });

  return Response.json(result, { status: 201 });
}
