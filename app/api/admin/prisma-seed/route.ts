export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      return Response.json({ 
        success: false, 
        message: "DATABASE_URL not set in environment variables. Add it to Amplify settings.",
        envCheck: { hasDbUrl: !!process.env.DATABASE_URL, nodeEnv: process.env.NODE_ENV }
      }, { status: 500 });
    }

    const { PrismaClient } = require("@prisma/client");
    const bcrypt = require("bcryptjs");
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

    // Create admin user
    const adminHash = await bcrypt.hash("Admin@123", 10);
    await prisma.user.create({
      data: { 
        name: "Admin", 
        email: "admin@phillip.com", 
        password: adminHash, 
        role: "ADMIN" as any
      }
    });

    // Create student user
    const studentHash = await bcrypt.hash("Student@123", 10);
    await prisma.user.create({
      data: { 
        name: "Student", 
        email: "student@phillip.com", 
        password: studentHash, 
        role: "STUDENT" as any
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
