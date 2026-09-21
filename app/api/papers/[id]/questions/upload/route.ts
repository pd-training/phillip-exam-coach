export const dynamic = "force-dynamic";

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:MyPassword2026!@phillip-exam-coach-db.c7cmo2c6ecz8.ap-southeast-1.rds.amazonaws.com:5432/phillip_exam_coach";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.split("\n").filter(line => line.trim());

    if (lines.length < 2) {
      return Response.json(
        { success: false, error: "CSV must have header and at least one row" },
        { status: 400 }
      );
    }

    // Parse CSV
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const questions = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      
      if (values.length < 3) continue; // Skip incomplete rows

      const chapter = parseInt(values[0]);
      const questionText = values[1];
      const correctAnswer = values[2];
      const explanation = values[3] || "";

      // Validate
      if (isNaN(chapter)) {
        errors.push(`Row ${i + 1}: Invalid chapter number`);
        continue;
      }

      if (!questionText) {
        errors.push(`Row ${i + 1}: Question text is required`);
        continue;
      }

      if (!["A", "B", "C", "D"].includes(correctAnswer.toUpperCase())) {
        errors.push(`Row ${i + 1}: Answer must be A, B, C, or D`);
        continue;
      }

      questions.push({
        chapter,
        questionText,
        correctAnswer: correctAnswer.toUpperCase(),
        explanation
      });
    }

    if (questions.length === 0) {
      return Response.json(
        { success: false, error: "No valid questions to import", errors },
        { status: 400 }
      );
    }

    // Insert into database
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

    // First, delete existing questions for this paper
    await prisma.$queryRaw`
      DELETE FROM "Question"
      WHERE "paperId" = ${params.id}::uuid
    `;

    // Insert new questions
    for (const q of questions) {
      await prisma.$queryRaw`
        INSERT INTO "Question" (
          "paperId", "chapterNumber", "questionText", "correctAnswer", "explanation", "createdAt", "updatedAt"
        )
        VALUES (
          ${params.id}::uuid,
          ${q.chapter},
          ${q.questionText},
          ${q.correctAnswer},
          ${q.explanation},
          NOW(),
          NOW()
        )
      `;
    }

    // Update Paper totalQuestions
    await prisma.$queryRaw`
      UPDATE "Paper"
      SET "totalQuestions" = ${questions.length}, "updatedAt" = NOW()
      WHERE id = ${params.id}::uuid
    `;

    await prisma.$disconnect();

    return Response.json({
      success: true,
      count: questions.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error("Error uploading questions:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
