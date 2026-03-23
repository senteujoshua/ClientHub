import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});
const db = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_PASSWORD ?? "Admin@1234";
  const name = process.env.ADMIN_NAME ?? "System Administrator";
  const phone = process.env.ADMIN_PHONE ?? null;
  const username = process.env.ADMIN_USERNAME ?? null;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    const updates: Record<string, string> = {};
    if (phone && !existing.phone) updates.phone = phone;
    if (username && !existing.username) updates.username = username;
    if (Object.keys(updates).length > 0) {
      await db.user.update({ where: { email }, data: updates });
      console.log(`✅ Updated existing admin (${Object.keys(updates).join(", ")}): ${email}`);
    } else {
      console.log(`Admin user already exists: ${email}`);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.create({
    data: { name, email, passwordHash, role: "admin", phone, username },
  });

  console.log(`✅ Admin user created: ${email}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
