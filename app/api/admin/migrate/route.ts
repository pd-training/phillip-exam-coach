import { PrismaClient } from "@prisma/client";

export async function GET() {
  try {
    const prisma = new PrismaClient();

    // Create enum first
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // Create User table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "emailVerified" TIMESTAMP(3),
        "name" TEXT,
        "password" TEXT,
        "image" TEXT,
        "role" "Role" NOT NULL DEFAULT 'USER',
        "active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      );
    `);

    await prisma.$disconnect();

    return Response.json({ success: true, message: "Database and tables created" });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
