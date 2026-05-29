import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNo } from "@/lib/invoice";

interface ConsignmentInput {
  supplierId: string;
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
  const { buyerId, goldSpotPrice, transactedAt, notes, lines } = await req.json();

  if (!Array.isArray(lines) || lines.length === 0) {
    return Response.json({ error: "lines[] is required" }, { status: 400 });
  }

  for (const line of lines as LineInput[]) {
    if (!["own_stock", "consignment", "swap"].includes(line.fulfillmentMode)) {
      return Response.json({ error: `invalid fulfillmentMode: ${line.fulfillmentMode}` }, { status: 400 });
    }
    if (line.fulfillmentMode !== "consignment" && !line.stockUnitId) {
      return Response.json({ error: "stockUnitId required for own_stock and swap" }, { status: 400 });
    }
    if (line.fulfillmentMode === "consignment" && !line.consignment) {
      return Response.json({ error: "consignment details required for consignment mode" }, { status: 400 });
    }
    if (line.fulfillmentMode === "swap" && !line.swap?.replacementCost) {
      return Response.json({ error: "swap.replacementCost required for swap mode" }, { status: 400 });
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
