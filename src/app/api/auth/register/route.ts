import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Email tidak valid" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return Response.json({ error: "Password minimal 8 karakter" }, { status: 400 });
    }
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return Response.json({ error: "Nama tidak boleh kosong" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return Response.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashed,
        role: "user",
        membership: "free",
      },
    });

    return Response.json({ success: true }, { status: 201 });
  } catch (e) {
    console.error("register error:", e);
    return Response.json({ error: "Terjadi kesalahan. Coba lagi." }, { status: 500 });
  }
}
