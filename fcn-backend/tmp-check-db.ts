import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, role: true, status: true, email_verified: true, full_name: true, created_at: true, last_login_at: true, password_hash: true }
  });
  for (const u of users) {
    console.log(JSON.stringify({
      email: u.email,
      role: u.role,
      status: u.status,
      email_verified: u.email_verified,
      full_name: u.full_name,
      created_at: u.created_at,
      last_login_at: u.last_login_at,
      has_password: !!u.password_hash
    }));
  }

  const tables: Array<{ tablename: string }> = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`;
  console.log("Tables (" + tables.length + "):", tables.map((t) => t.tablename).join(", "));
}

main()
  .catch((e) => { console.error("FAILED:", e.message); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });