import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;
  const brand = req.nextUrl.searchParams.get("brand");
  const series = req.nextUrl.searchParams.get("series");

  const products = await prisma.product.findMany({
    where: {
      ...(brand && { brand }),
      ...(series && { series }),
    },
    orderBy: [{ brand: "asc" }, { weightGram: "asc" }],
  });

  return Response.json(
    products.map((p) => ({ ...p, weightGram: p.weightGram.toNumber() })),
  );
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;
  const { sku, name, weightGram, purity, brand, series } = await req.json();

  if (!sku || !name || weightGram == null) {
    return Response.json({ error: "sku, name, and weightGram are required" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: { sku, name, weightGram, purity, brand, series },
  });

  return Response.json({ ...product, weightGram: product.weightGram.toNumber() }, { status: 201 });
}
