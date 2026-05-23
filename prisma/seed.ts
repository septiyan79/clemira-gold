import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash("admin123", 12);
  const password2 = await bcrypt.hash("password222", 12);

  const user = await prisma.user.upsert({
    where: { email: "admin@clemira.com" },
    update: {},
    create: {
      email: "admin@clemira.com",
      name: "Admin Clemira",
      password,
      role: "admin",
      membership: "free",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "admin2@clemira.com" },
    update: {},
    create: {
      email: "admin2@clemira.com",
      name: "Admin 2 Clemira",
      password: password2,
      role: "admin",
      membership: "free",
    },
  });

  console.log("User admin berhasil dibuat:", user.email);
  console.log("User admin berhasil dibuat:", user2.email);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
