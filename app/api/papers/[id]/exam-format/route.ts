export const dynamic = "force-dynamic";

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:MyPassword2026!@phillip-exam-coach-db.c7cmo2c6ecz8.ap-southeast-1.rds.amazonaws.com:5432/phillip_exam_coach";

interface ExamPart {
  partName: string;
  chapterStart: number;
  chapterEnd: number;
  questionCount: number;
  passingScore: number;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

    const paper = await prisma.$queryRaw`
      SELECT id, "totalTime"
      FROM "Paper"
      WHERE id = ${params.id}::uuid
    `;

    if (!paper || paper.length === 0) {
      await prisma.$disconnect();
      return Response.json(
        { success: false, error: "Paper not found" },
        { status: 404 }
      );
    }

    const parts = await prisma.$queryRaw`
      SELECT id, "partName", "chapterStart", "chapterEnd", "questionCount", "passingScore", "orderIndex"
      FROM "ExamPart"
      WHERE "paperId" = ${params.id}::uuid
      ORDER BY "orderIndex" ASC
    `;

    await prisma.$disconnect();

    return Response.json({
      success: true,
      examFormat: {
        totalTime: paper[0].totalTime,
        parts: parts || []
      }
    });
  } catch (error) {
    console.error("Error fetching exam format:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { totalTime, parts } = await req.json();

    if (!parts || parts.length === 0) {
      return Response.json(
        { success: false, error: "At least one part is required" },
        { status: 400 }
      );
    }

    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

    // Update Paper totalTime
    await prisma.$queryRaw`
      UPDATE "Paper"
      SET "totalTime" = ${totalTime}, "updatedAt" = NOW()
      WHERE id = ${params.id}::uuid
    `;

    // Delete existing parts
    await prisma.$queryRaw`
      DELETE FROM "ExamPart"
      WHERE "paperId" = ${params.id}::uuid
    `;

    // Insert new parts
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      await prisma.$queryRaw`
        INSERT INTO "ExamPart" (
          "paperId", "partName", "chapterStart", "chapterEnd", 
          "questionCount", "passingScore", "orderIndex", "createdAt", "updatedAt"
        )
        VALUES (
          ${params.id}::uuid,
          ${part.partName},
          ${part.chapterStart},
          ${part.chapterEnd},
          ${part.questionCount},
          ${part.passingScore},
          ${i + 1},
          NOW(),
          NOW()
        )
      `;
    }

    await prisma.$disconnect();

    return Response.json({
      success: true,
      message: "Exam format saved successfully"
    });
  } catch (error) {
    console.error("Error saving exam format:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
