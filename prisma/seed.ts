// V5/prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username    = process.env.ADMIN_USERNAME    ?? "admin";
  const password    = process.env.ADMIN_PASSWORD;
  const displayName = process.env.ADMIN_DISPLAY_NAME ?? "Administrator";

  if (!password) {
    throw new Error("ADMIN_PASSWORD env var required for seed");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where:  { username },
    update: {},
    create: { username, passwordHash, displayName, role: "admin", isActive: true },
  });

  console.log(`✔ Seeded admin user "${username}"`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
