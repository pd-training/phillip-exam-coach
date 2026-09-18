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
    await (prisma as any).user.deleteMany({});

    // Create admin user - bypass enum validation
    const adminHash = await bcrypt.hash("Admin@123", 10);
    await (prisma as any).user.create({
      data: { 
        name: "Admin", 
        email: "admin@phillip.com", 
        password: adminHash, 
        role: "ADMIN"
      }
    });

    // Create student user - bypass enum validation
    const studentHash = await bcrypt.hash("Student@123", 10);
    await (prisma as any).user.create({
      data: { 
        name: "Student", 
        email: "student@phillip.com", 
        password: studentHash, 
        role: "STUDENT"
      }
    });

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
