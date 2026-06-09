import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNo } from "@/lib/invoice";
import { requireAdmin } from "@/lib/api-auth";

interface ConsignmentInput {
  supplierId: string;
  productId?: string;
  serialNumber?: string;
  certCode?: string;
  mintYear?: number;
  supplierPurchasePrice: number;
}

interface SwapInput {
  supplierId?: string;
  replacementCost: number; // wajib: biaya penggantian unit → menjadi COGS swap
}

interface LineInput {
  stockUnitId?: string;
  fulfillmentMode: "own_stock" | "consignment" | "swap";
  sellPrice: number;
  consignment?: ConsignmentInput;
  swap?: SwapInput;
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;
  const transactions = await prisma.transaction.findMany({
    include: {
      buyer: true,
      lines: {
        include: {
          stockUnit: { include: { product: true, owner: true } },
          consignmentLine: { include: { supplier: true } },
          swapEvent: { include: { originalUnit: true, replacementUnit: true } },
        },
      },
    },
    orderBy: { transactedAt: "desc" },
  });

  return Response.json(
    transactions.map((t) => ({
      ...t,
      goldSpotPrice: t.goldSpotPrice?.toNumber() ?? null,
      lines: t.lines.map((l) => ({
        ...l,
        sellPrice: l.sellPrice.toNumber(),
        cogs: l.cogs.toNumber(),
        margin: l.margin.toNumber(),
        consignmentLine: l.consignmentLine
          ? {
              ...l.consignmentLine,
              supplierPurchasePrice: l.consignmentLine.supplierPurchasePrice.toNumber(),
            }
          : null,
        swapEvent: l.swapEvent
          ? {
              ...l.swapEvent,
              replacementCost: l.swapEvent.replacementCost?.toNumber() ?? null,
            }
          : null,
        stockUnit: l.stockUnit
          ? {
              ...l.stockUnit,
              actualPurchasePrice: l.stockUnit.actualPurchasePrice?.toNumber() ?? null,
              referencePrice: l.stockUnit.referencePrice?.toNumber() ?? null,
              product: {
                ...l.stockUnit.product,
                weightGram: l.stockUnit.product.weightGram.toNumber(),
              },
            }
          : null,
      })),
    })),
  );
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;
  const { buyerId, goldSpotPrice, transactedAt, notes, lines } = await req.json();

  if (!Array.isArray(lines) || lines.length === 0) {
    return Response.json({ error: "lines[] is required" }, { status: 400 });
  }
  if (transactedAt !== undefined && transactedAt !== null && isNaN(Date.parse(transactedAt))) {
    return Response.json({ error: "transactedAt is not a valid date" }, { status: 400 });
  }

  for (let i = 0; i < (lines as LineInput[]).length; i++) {
    const line = (lines as LineInput[])[i];
    if (!["own_stock", "consignment", "swap"].includes(line.fulfillmentMode)) {
      return Response.json({ error: `lines[${i}]: invalid fulfillmentMode` }, { status: 400 });
    }
    if (typeof line.sellPrice !== "number" || !isFinite(line.sellPrice) || line.sellPrice <= 0) {
      return Response.json({ error: `lines[${i}].sellPrice must be a positive number` }, { status: 400 });
    }
    if (line.fulfillmentMode !== "consignment" && !line.stockUnitId) {
      return Response.json({ error: `lines[${i}]: stockUnitId required for own_stock and swap` }, { status: 400 });
    }
    if (line.fulfillmentMode === "consignment" && !line.consignment) {
      return Response.json({ error: `lines[${i}]: consignment details required` }, { status: 400 });
    }
    if (line.fulfillmentMode === "consignment" && line.consignment) {
      const sp = line.consignment.supplierPurchasePrice;
      if (typeof sp !== "number" || !isFinite(sp) || sp <= 0) {
        return Response.json({ error: `lines[${i}].consignment.supplierPurchasePrice must be a positive number` }, { status: 400 });
      }
    }
    if (line.fulfillmentMode === "swap" && !line.swap?.replacementCost) {
      return Response.json({ error: `lines[${i}]: swap.replacementCost required` }, { status: 400 });
    }
    if (line.fulfillmentMode === "swap" && line.swap) {
      const rc = line.swap.replacementCost;
      if (typeof rc !== "number" || !isFinite(rc) || rc <= 0) {
        return Response.json({ error: `lines[${i}].swap.replacementCost must be a positive number` }, { status: 400 });
      }
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const txDate = transactedAt ? new Date(transactedAt) : new Date();
    const invoiceNo = await generateInvoiceNo("INV", tx, txDate);

    const transaction = await tx.transaction.create({
      data: {
        buyerId,
        invoiceNo,
        goldSpotPrice,
        transactedAt: txDate,
        notes,
      },
    });

    const createdLines = await Promise.all(
      (lines as LineInput[]).map(async (line) => {
        let cogs = 0;

        if (line.fulfillmentMode === "own_stock") {
          // COGS = referencePrice of the unit sold
          const unit = await tx.stockUnit.findUnique({
            where: { id: line.stockUnitId! },
            select: { referencePrice: true },
          });
          cogs = unit?.referencePrice?.toNumber() ?? 0;

        } else if (line.fulfillmentMode === "consignment") {
          // COGS = price paid to the external supplier
          cogs = line.consignment!.supplierPurchasePrice;

        } else if (line.fulfillmentMode === "swap") {
          // COGS = replacement cost (actual_purchase_price of the incoming replacement unit)
          cogs = line.swap!.replacementCost;
        }

        const margin = line.sellPrice - cogs;

        const txLine = await tx.transactionLine.create({
          data: {
            transactionId:   transaction.id,
            stockUnitId:     line.stockUnitId ?? null,
            fulfillmentMode: line.fulfillmentMode,
            sellPrice:       line.sellPrice,
            cogs,
            margin,
          },
        });

        if (line.fulfillmentMode === "own_stock") {
          await tx.stockUnit.update({
            where: { id: line.stockUnitId! },
            data: { status: "sold" },
          });
        }

        if (line.fulfillmentMode === "consignment") {
          const c = line.consignment!;
          await tx.consignmentLine.create({
            data: {
              transactionLineId:      txLine.id,
              supplierId:             c.supplierId,
              productId:              c.productId,
              serialNumber:           c.serialNumber,
              certCode:               c.certCode,
              mintYear:               c.mintYear,
              supplierPurchasePrice:  c.supplierPurchasePrice,
            },
          });
        }

        if (line.fulfillmentMode === "swap") {
          await tx.stockUnit.update({
            where: { id: line.stockUnitId! },
            data: { status: "swapped_out" },
          });
          await tx.swapEvent.create({
            data: {
              transactionLineId: txLine.id,
              originalUnitId:    line.stockUnitId!,
              supplierId:        line.swap?.supplierId,
              replacementCost:   line.swap!.replacementCost,
            },
          });
        }

        return txLine;
      }),
    );

    return { ...transaction, lines: createdLines };
  });

  return Response.json(result, { status: 201 });
}
