import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_ROLES = ["buyer", "supplier"];

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role"); // filter by role in type array
  const q    = req.nextUrl.searchParams.get("q");    // name search (for combobox)

  const counterparties = await prisma.counterparty.findMany({
    where: {
      ...(role ? { type: { has: role } } : {}),
      ...(q    ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { name: "asc" },
    ...(q ? { take: 10 } : {}), // limit search results for combobox
  });

  return Response.json(counterparties);
}

export async function POST(req: NextRequest) {
  const { name, type, phone, notes } = await req.json();

  if (!name || !Array.isArray(type) || type.length === 0) {
    return Response.json({ error: "name and type (array) are required" }, { status: 400 });
  }
  if (!type.every((r: string) => VALID_ROLES.includes(r))) {
    return Response.json({ error: "type values must be 'buyer' or 'supplier'" }, { status: 400 });
  }

  const counterparty = await prisma.counterparty.create({
    data: { name, type, phone, notes },
  });

  return Response.json(counterparty, { status: 201 });
}
