import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashed,
        role: "user",
        membership: "free",
        // emailVerified stays null until verified
      },
    });

    // Create verification token (24 hour expiry)
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await sendVerificationEmail(user.email, token);

    return Response.json({ success: true }, { status: 201 });
  } catch (e) {
    console.error("register error:", e);
    return Response.json({ error: "Terjadi kesalahan. Coba lagi." }, { status: 500 });
  }
}
