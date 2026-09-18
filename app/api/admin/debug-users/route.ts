export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:MyPassword2026!@phillip-exam-coach-db.c7cmo2c6ecz8.ap-southeast-1.rds.amazonaws.com:5432/phillip_exam_coach";
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

    // Use raw SQL to get users
    const users = await prisma.$queryRaw`SELECT id, email, name, role FROM "User"`;

    await prisma.$disconnect();

    return Response.json({
      success: true,
      userCount: users.length,
      users: users
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
