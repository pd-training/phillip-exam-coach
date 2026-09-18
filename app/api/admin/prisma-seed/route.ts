export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return Response.json(
        { success: false, message: "DATABASE_URL not set" },
        { status: 500 }
      );
    }

    const { PrismaClient } = await import("@prisma/client");
    const bcrypt = await import("bcryptjs");
    const prisma = new PrismaClient();

    // Clear data
    await prisma.user.deleteMany();
    await prisma.module.deleteMany();

    // Create module
    const module = await prisma.module.create({
      data: { code: "RES5", name: "RES 5" }
    });

    // Create paper
    const paper = await prisma.paper.create({
      data: { moduleId: module.id, title: "RES 5 Mock", durationMinutes: 180, totalQuestions: 150 }
    });

    // Create sections
    await prisma.paperSection.create({
      data: { paperId: paper.id, name: "Part I", order: 1, questionCount: 110 }
    });

    await prisma.paperSection.create({
      data: { paperId: paper.id, name: "Part II", order: 2, questionCount: 40 }
    });

    // Create admin
    const adminHash = await bcrypt.default.hash("Admin@123", 10);
    await prisma.user.create({
      data: { name: "Admin", email: "admin@phillip.com", passwordHash: adminHash, roles: ["ADMIN"] as any, active: true, approvedAt: new Date() }
    });

    // Create student
    const studentHash = await bcrypt.default.hash("Student@123", 10);
    const student = await prisma.user.create({
      data: { name: "Student", email: "student@phillip.com", passwordHash: studentHash, roles: ["STUDENT"] as any, active: true, approvedAt: new Date() }
    });

    // Assign paper
    await prisma.assignment.create({
      data: { paperId: paper.id, userId: student.id, status: "APPROVED" as any }
    });

    return Response.json({ success: true, message: "Seeded!", testAccounts: { admin: "admin@phillip.com / Admin@123", student: "student@phillip.com / Student@123" } });
  } catch (error) {
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}
