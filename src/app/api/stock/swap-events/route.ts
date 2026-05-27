import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const open           = req.nextUrl.searchParams.get("open") === "true";
  const originalUnitId = req.nextUrl.searchParams.get("originalUnitId");

  const events = await prisma.swapEvent.findMany({
    where: {
      ...(open           ? { replacementUnitId: null }  : {}),
      ...(originalUnitId ? { originalUnitId }            : {}),
    },
    include: {
      originalUnit: {
        include: {
          product: { select: { brand: true, weightGram: true, series: true } },
        },
      },
      transactionLine: {
        select: { transaction: { select: { transactedAt: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(
    events.map((e) => ({
      id:              e.id,
      replacementCost: e.replacementCost?.toNumber() ?? null,
      transactedAt:    e.transactionLine?.transaction.transactedAt.toISOString() ?? null,
      originalUnit: {
        id:             e.originalUnit.id,
        serialNumber:   e.originalUnit.serialNumber,
        referencePrice: e.originalUnit.referencePrice?.toNumber() ?? null,
        product: {
          brand:      e.originalUnit.product.brand,
          weightGram: e.originalUnit.product.weightGram.toNumber(),
          series:     e.originalUnit.product.series,
        },
      },
    })),
  );
}
