export const dynamic = "force-dynamic";

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:MyPassword2026!@phillip-exam-coach-db.c7cmo2c6ecz8.ap-southeast-1.rds.amazonaws.com:5432/phillip_exam_coach";

export async function GET() {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

    const users = await prisma.$queryRaw`
      SELECT id, email, name, role, active, "createdAt"
      FROM "User"
      ORDER BY "createdAt" DESC
    `;

    await prisma.$disconnect();

    return Response.json({
      success: true,
      users: users || [],
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name, email, password, role, paperId } = await req.json();

    if (!name || !email || !password) {
      return Response.json(
        { success: false, error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const bcrypt = require("bcryptjs");
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

    // Check if user already exists
    const existing = await prisma.$queryRaw`
      SELECT id FROM "User" WHERE email = ${email}
    `;

    if (existing && existing.length > 0) {
      await prisma.$disconnect();
      return Response.json(
        { success: false, error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Use raw SQL to bypass Prisma enum validation
    const result = await prisma.$queryRaw`
      INSERT INTO "User" (id, name, email, password, role, active, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${name}, ${email}, ${hashedPassword}, ${role || "STUDENT"}, true, NOW(), NOW())
      RETURNING id, name, email, role, active, "createdAt"
    `;

    const userId = result?.[0]?.id;

    // If paperId provided, auto-approve paper assignment for student
    let paperAssignmentSuccess = false;
    let paperAssignmentError = null;
    if (paperId && userId) {
      try {
        console.log("Attempting to assign paper:", { paperId, userId });
        const paperAssignResult = await prisma.$queryRaw`
          INSERT INTO "PaperRequest" (id, "userId", "paperId", status, "reviewedAt", "createdAt")
          VALUES (gen_random_uuid(), ${userId}, ${paperId}::uuid, 'approved', NOW(), NOW())
          RETURNING id
        `;
        console.log("Paper assigned successfully:", paperAssignResult);
        paperAssignmentSuccess = true;
      } catch (paperError: any) {
        paperAssignmentError = paperError?.message || String(paperError);
        console.error("Error assigning paper:", paperAssignmentError);
        // Continue anyway - user is created
      }
    }

    await prisma.$disconnect();

    return Response.json({
      success: true,
      user: result?.[0] || null,
      paperId: paperId || null,
      paperAssignmentSuccess: paperAssignmentSuccess,
      paperAssignmentError: paperAssignmentError,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
