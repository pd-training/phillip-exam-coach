export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // Use env var if available, otherwise fallback to hardcoded connection string
    const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:MyPassword2026!@phillip-exam-coach-db.c7cmo2c6ecz8.ap-southeast-1.rds.amazonaws.com:5432/phillip_exam_coach";
    
    if (!dbUrl) {
      return Response.json({ 
        success: false, 
        message: "DATABASE_URL not configured",
      }, { status: 500 });
    }

    const { PrismaClient } = require("@prisma/client");
    const bcrypt = require("bcryptjs");
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

    // Clear existing users
    await prisma.user.deleteMany({});

    // Create admin user
    const adminHash = await bcrypt.hash("Admin@123", 10);
    await prisma.$queryRaw`
      INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'Admin', 'admin@phillip.com', ${adminHash}, 'ADMIN', NOW(), NOW())
    `;

    // Create student user
    const studentHash = await bcrypt.hash("Student@123", 10);
    await prisma.$queryRaw`
      INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'Student', 'student@phillip.com', ${studentHash}, 'STUDENT', NOW(), NOW())
    `;

    await prisma.$disconnect();

    return Response.json({ 
      success: true, 
      message: "✅ Database seeded successfully!", 
      accounts: {
        admin: "admin@phillip.com / Admin@123", 
        student: "student@phillip.com / Student@123"
      }
    });
  } catch (error) {
    console.error("Seed error:", error);
    return Response.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}
