import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_ROLES = ["buyer", "supplier"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cp = await prisma.counterparty.findUnique({ where: { id } });
  if (!cp) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(cp);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { name, type, phone, notes, addRole } = body;

  // Special convenience: add a single role without knowing current state
  if (addRole !== undefined) {
    if (!VALID_ROLES.includes(addRole)) {
      return Response.json({ error: "Invalid role" }, { status: 400 });
    }
    const existing = await prisma.counterparty.findUnique({ where: { id }, select: { type: true } });
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.counterparty.update({
      where: { id },
      data: {
        type: existing.type.includes(addRole)
          ? existing.type
          : [...existing.type, addRole],
      },
    });
    return Response.json(updated);
  }

  // Full field update
  const updateData: Record<string, unknown> = {};

  if (name  !== undefined) updateData.name  = name;
  if (phone !== undefined) updateData.phone = phone || null;
  if (notes !== undefined) updateData.notes = notes || null;

  if (type !== undefined) {
    if (!Array.isArray(type) || type.length === 0 || !type.every((r: string) => VALID_ROLES.includes(r))) {
      return Response.json({ error: "type must be non-empty array of 'buyer'/'supplier'" }, { status: 400 });
    }
    updateData.type = type;
  }

  if (Object.keys(updateData).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  const cp = await prisma.counterparty.update({ where: { id }, data: updateData });
  return Response.json(cp);
}
