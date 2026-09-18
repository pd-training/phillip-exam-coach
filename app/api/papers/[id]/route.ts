export const dynamic = "force-dynamic";

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:MyPassword2026!@phillip-exam-coach-db.c7cmo2c6ecz8.ap-southeast-1.rds.amazonaws.com:5432/phillip_exam_coach";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

    const paper = await prisma.$queryRaw`
      SELECT id, title, "durationMinutes", "totalQuestions"
      FROM "Paper"
      WHERE id = ${params.id}
    `;

    if (!paper || paper.length === 0) {
      await prisma.$disconnect();
      return Response.json(
        { success: false, error: "Paper not found" },
        { status: 404 }
      );
    }

    const questions = await prisma.$queryRaw`
      SELECT id, "questionText", "optionA", "optionB", "optionC", "optionD", "correctAnswer"
      FROM "Question"
      WHERE "paperId" = ${params.id}
      ORDER BY "orderInPaper" ASC
    `;

    await prisma.$disconnect();

    return Response.json({
      success: true,
      paper: {
        ...paper[0],
        questions: questions || [],
      },
    });
  } catch (error) {
    console.error("Error fetching paper:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
