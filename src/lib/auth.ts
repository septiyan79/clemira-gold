import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          select: {
            id: true, email: true, name: true, role: true, membership: true,
            password: true, failedLoginAttempts: true, lockedUntil: true,
          },
        });

        if (!user || !user.password) return null;

        // Block if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          const LOCK_THRESHOLD = 5;
          const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
          const newAttempts = user.failedLoginAttempts + 1;
          const shouldLock = newAttempts >= LOCK_THRESHOLD;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: shouldLock ? 0 : newAttempts,
              lockedUntil: shouldLock ? new Date(Date.now() + LOCK_DURATION_MS) : null,
            },
          });
          return null;
        }

        // Reset lockout state on successful login
        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          membership: user.membership,
        };
      },
    }),
  ],
});
