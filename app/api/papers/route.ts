export const dynamic = "force-dynamic";

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:MyPassword2026!@phillip-exam-coach-db.c7cmo2c6ecz8.ap-southeast-1.rds.amazonaws.com:5432/phillip_exam_coach";

export async function GET() {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

    const papers = await prisma.$queryRaw`
      SELECT id, title, "durationMinutes", "totalQuestions", "createdAt"
      FROM "Paper"
      ORDER BY "createdAt" DESC
    `;

    await prisma.$disconnect();

    return Response.json({
      success: true,
      papers: papers || [],
    });
  } catch (error) {
    console.error("Error fetching papers:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { title, durationMinutes, totalQuestions } = await req.json();

    if (!title) {
      return Response.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

    // Use raw SQL to bypass Prisma enum validation
    const result = await prisma.$queryRaw`
      INSERT INTO "Paper" (id, title, "durationMinutes", "totalQuestions", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${title}, ${durationMinutes || 180}, ${totalQuestions || 150}, NOW(), NOW())
      RETURNING id, title, "durationMinutes", "totalQuestions", "createdAt"
    `;

    await prisma.$disconnect();

    return Response.json({
      success: true,
      paper: result?.[0] || null,
    });
  } catch (error) {
    console.error("Error creating paper:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
