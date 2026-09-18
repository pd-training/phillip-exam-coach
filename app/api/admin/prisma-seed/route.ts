export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return Response.json({ success: false, message: "DATABASE_URL not set" }, { status: 500 });
    }

    const { PrismaClient } = require("@prisma/client");
    const bcrypt = require("bcryptjs");
    const prisma = new PrismaClient();

    await prisma.user.deleteMany();

    const adminHash = await bcrypt.hash("Admin@123", 10);
    await prisma.user.create({
      data: { name: "Admin", email: "admin@phillip.com", passwordHash: adminHash, roles: ["ADMIN"], active: true, approvedAt: new Date() }
    });

    const studentHash = await bcrypt.hash("Student@123", 10);
    await prisma.user.create({
      data: { name: "Student", email: "student@phillip.com", passwordHash: studentHash, roles: ["STUDENT"], active: true, approvedAt: new Date() }
    });

    return Response.json({ success: true, message: "Seeded!", testAccounts: { admin: "admin@phillip.com / Admin@123", student: "student@phillip.com / Student@123" } });
  } catch (error) {
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}
