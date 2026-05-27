import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const lines = await prisma.transactionLine.findMany({
    where: {
      transaction: {
        transactedAt: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to + "T23:59:59Z") }),
        },
      },
    },
    include: {
      transaction: { select: { transactedAt: true, buyer: { select: { name: true } } } },
      stockUnit: {
        select: {
          mintYear: true,
          product: { select: { brand: true, weightGram: true } },
          owner: { select: { name: true } },
        },
      },
    },
    orderBy: { transaction: { transactedAt: "desc" } },
  });

  return Response.json(
    lines.map((l) => ({
      transactionLineId: l.id,
      transactedAt: l.transaction.transactedAt,
      buyer: l.transaction.buyer?.name ?? null,
      brand: l.stockUnit?.product.brand ?? null,
      weightGram: l.stockUnit?.product.weightGram.toNumber() ?? null,
      mintYear: l.stockUnit?.mintYear ?? null,
      owner: l.stockUnit?.owner.name ?? null,
      fulfillmentMode: l.fulfillmentMode,
      sellPrice: l.sellPrice.toNumber(),
      cogs: l.cogs.toNumber(),
      margin: l.margin.toNumber(),
    })),
  );
}
