export const dynamic = "force-dynamic";

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:MyPassword2026!@phillip-exam-coach-db.c7cmo2c6ecz8.ap-southeast-1.rds.amazonaws.com:5432/phillip_exam_coach";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

    const questions = await prisma.$queryRaw`
      SELECT id, "paperId", "chapterNumber", "questionText", "correctAnswer", "explanation", "createdAt"
      FROM "Question"
      WHERE "paperId" = ${params.id}::uuid
      ORDER BY "chapterNumber" ASC, "createdAt" ASC
    `;

    await prisma.$disconnect();

    return Response.json({
      success: true,
      questions: questions || []
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
