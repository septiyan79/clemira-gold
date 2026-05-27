import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") ?? "available";
  const ownerId = searchParams.get("ownerId");
  const productId = searchParams.get("productId");
  const mintYear = searchParams.get("mintYear");

  const units = await prisma.stockUnit.findMany({
    where: {
      status,
      ...(ownerId && { ownerId }),
      ...(productId && { productId }),
      ...(mintYear && { mintYear: parseInt(mintYear) }),
    },
    include: {
      product: true,
      owner: true,
      purchaseOrderLine: { select: { unitPrice: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(
    units.map((u) => ({
      ...u,
      product: { ...u.product, weightGram: u.product.weightGram.toNumber() },
      purchaseOrderLine: u.purchaseOrderLine
        ? { unitPrice: u.purchaseOrderLine.unitPrice.toNumber() }
        : null,
    })),
  );
}
