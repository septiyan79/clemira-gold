import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const owners = await prisma.owner.findMany({ orderBy: { name: "asc" } });
  return Response.json(owners);
}

export async function POST(req: NextRequest) {
  const { name, type, notes } = await req.json();

  if (!name || !type) {
    return Response.json({ error: "name and type are required" }, { status: 400 });
  }
  if (!["entity", "personal"].includes(type)) {
    return Response.json({ error: "type must be 'entity' or 'personal'" }, { status: 400 });
  }

  const owner = await prisma.owner.create({ data: { name, type, notes } });
  return Response.json(owner, { status: 201 });
}
