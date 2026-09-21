export const dynamic = "force-dynamic";

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:MyPassword2026!@phillip-exam-coach-db.c7cmo2c6ecz8.ap-southeast-1.rds.amazonaws.com:5432/phillip_exam_coach";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; qid: string } }
) {
  try {
    const { questionText, correctAnswer, explanation, chapterNumber } = await req.json();

    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

    const result = await prisma.$queryRaw`
      UPDATE "Question"
      SET "questionText" = ${questionText}, 
          "correctAnswer" = ${correctAnswer},
          "explanation" = ${explanation},
          "chapterNumber" = ${chapterNumber},
          "updatedAt" = NOW()
      WHERE id = ${params.qid}::uuid
      AND "paperId" = ${params.id}::uuid
      RETURNING *
    `;

    await prisma.$disconnect();

    if (!result || result.length === 0) {
      return Response.json(
        { success: false, error: "Question not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      question: result[0]
    });
  } catch (error) {
    console.error("Error updating question:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; qid: string } }
) {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

    await prisma.$queryRaw`
      DELETE FROM "Question"
      WHERE id = ${params.qid}::uuid
      AND "paperId" = ${params.id}::uuid
    `;

    // Update Paper totalQuestions
    const count = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Question" WHERE "paperId" = ${params.id}::uuid
    `;

    await prisma.$queryRaw`
      UPDATE "Paper"
      SET "totalQuestions" = ${count[0].count}, "updatedAt" = NOW()
      WHERE id = ${params.id}::uuid
    `;

    await prisma.$disconnect();

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting question:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
