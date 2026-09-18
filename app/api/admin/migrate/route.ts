import { PrismaClient } from "@prisma/client";

export async function GET() {
  try {
    const prisma = new PrismaClient();

    // Run migrations
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "emailVerified" TIMESTAMP(3),
        "name" TEXT,
        "password" TEXT,
        "image" TEXT,
        "role" TEXT NOT NULL DEFAULT 'USER',
        "active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      );
    `);

    await prisma.$disconnect();

    return Response.json({ success: true, message: "Database tables created" });
  } catch (error) {
    const errorMsg = String(error);
    
    // Tables might already exist
    if (errorMsg.includes("already exists")) {
      return Response.json({ success: true, message: "Tables already exist" });
    }

    return Response.json({ error: errorMsg }, { status: 500 });
  }
}
