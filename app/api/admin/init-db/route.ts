import { PrismaClient } from "@prisma/client";

export async function GET() {
  try {
    // Connect to default 'postgres' database to create new one
    const adminPrisma = new PrismaClient({
      datasources: {
        db: {
          url: "postgresql://postgres:MyPassword2026!@phillip-exam-coach-db.c7cmo2c6ecz8.ap-southeast-1.rds.amazonaws.com:5432/postgres",
        },
      },
    });

    // Create database
    await adminPrisma.$executeRawUnsafe(
      'CREATE DATABASE phillip_exam_coach;'
    );

    await adminPrisma.$disconnect();

    return Response.json({ success: true, message: "Database created" });
  } catch (error) {
    const errorMsg = String(error);
    
    // If database already exists, that's OK
    if (errorMsg.includes("already exists")) {
      return Response.json({ success: true, message: "Database already exists" });
    }

    return Response.json({ error: errorMsg }, { status: 500 });
  }
}
