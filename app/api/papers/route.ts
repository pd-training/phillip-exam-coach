export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const papers = await prisma.$queryRaw`
      SELECT id, title, description, "externalLink", "durationMinutes", "totalQuestions", "isAvailable", "createdAt"
      FROM "Paper"
      ORDER BY "createdAt" DESC
    `;

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

    // Use raw SQL to bypass Prisma enum validation
    const result = await prisma.$queryRaw`
      INSERT INTO "Paper" (id, title, description, "externalLink", "durationMinutes", "totalQuestions", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${title}, '', NULL, ${durationMinutes || 180}, ${totalQuestions || 150}, NOW(), NOW())
      RETURNING id, title, description, "externalLink", "durationMinutes", "totalQuestions", "isAvailable", "createdAt"
    `;

    const paperId = result?.[0]?.id;

    // Auto-create default exam part for single-part papers
    if (paperId) {
      const questionCount = totalQuestions || 150;
      await prisma.$queryRaw`
        INSERT INTO "ExamPart" (id, "paperId", "partName", "chapterStart", "chapterEnd", "questionCount", "passingScore", "orderIndex", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${paperId}::uuid, 'Full Exam', 1, 100, ${questionCount}, 70, 1, NOW(), NOW())
      `;
    }

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
